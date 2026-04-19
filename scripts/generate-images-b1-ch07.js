const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse --provider flag (default: openai)
const provider = process.argv.includes('--gemini') ? 'gemini' : 'openai';

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'b1');

const IMAGES = [
  {
    filename: 'ch07-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A diverse group of five people of different ages, heights, and builds standing together on a city street. Behind them are various modes of transportation: a bus, a bicycle leaning against a lamppost, a car, and a directional street sign pointing left and right. The people include a tall man with a beard, a short woman with curly hair, a teenager with a backpack, an elderly person with a hat, and a child. Simple, clean line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch07-physical-descriptions.png',
    prompt: `Black and white line art illustration for an English language workbook showing physical descriptions vocabulary. Two people side by side: on the left, a tall slim young woman with long curly hair, and on the right, a short older man with a beard and short straight hair. Around each person are neat label arrows pointing to features with English words: "tall", "slim", "long curly hair", "brown eyes" for the woman, and "short", "beard", "short straight hair", "glasses" for the man. At the bottom, two example sentences: "She IS tall. She HAS long curly hair." Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch07-transportation.png',
    prompt: `Black and white line art illustration for an English language workbook showing means of transportation. Six small panels arranged in a 2x3 grid, each inside a rounded rectangle with a label below: (1) "by bus" with a city bus, (2) "by car" with a small sedan car, (3) "by bike" with a bicycle, (4) "by train" with a passenger train, (5) "by plane" with an airplane, (6) "on foot" with a person walking. Each vehicle and figure is drawn simply and clearly. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch07-directions-map.png',
    prompt: `Black and white line art illustration for an English language workbook showing a simple street map for practising directions. The map shows a grid of streets with clearly labelled buildings: a SCHOOL, a PARK (with small trees), a HOSPITAL (with a cross), a SUPERMARKET (with a shopping cart icon), a CHURCH (with a steeple), a BANK, and a PHARMACY. There are arrows on the streets showing "Go straight", "Turn left", and "Turn right". A dotted line shows a path from a "You are here" marker to the hospital. Street names are labelled. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch07-dialogue-directions.png',
    prompt: `Black and white line art illustration for an English language workbook. A tourist with a backpack and a map in hand is standing on a city street talking to a friendly Brazilian teenage girl. The tourist has a speech bubble saying "Excuse me, how do I get to the market?" and the girl has a speech bubble saying "Go straight and turn left!" Behind them are simple buildings, a street sign, and a directional arrow pointing left. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  }
];

// =============================================================================
// OPENAI (DALL-E 3)
// =============================================================================

function generateWithOpenAI(imageConfig) {
  const apiKey = envContent.match(/OPENAI_KEY="(.+)"/)?.[1];
  if (!apiKey) { console.error('Could not find OPENAI_KEY in .env'); process.exit(1); }

  const { filename, prompt } = imageConfig;
  const outputPath = path.join(OUTPUT_DIR, filename);

  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json'
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.openai.com',
      path: '/v1/images/generations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API error ${res.statusCode}: ${data}`));
          return;
        }
        try {
          const json = JSON.parse(data);
          const buffer = Buffer.from(json.data[0].b64_json, 'base64');
          fs.writeFileSync(outputPath, buffer);
          console.log(`  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
          resolve(outputPath);
        } catch (err) { reject(err); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// =============================================================================
// GEMINI (Nano Banana)
// =============================================================================

async function generateWithGemini(imageConfig) {
  const apiKey = envContent.match(/GEMINI_API_KEY="(.+)"/)?.[1];
  if (!apiKey) { console.error('Could not find GEMINI_API_KEY in .env'); process.exit(1); }

  const { filename, prompt } = imageConfig;
  const outputPath = path.join(OUTPUT_DIR, filename);

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: { responseModalities: ['Text', 'Image'] },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64');
      fs.writeFileSync(outputPath, buffer);
      console.log(`  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`);
      return outputPath;
    }
  }

  throw new Error('No image returned by Gemini');
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const providerLabel = provider === 'gemini' ? 'Gemini' : 'DALL-E 3';
  console.log(`Generating ${IMAGES.length} images for B1 Chapter 7 (People Descriptions, Transportation & Directions)...\n`);

  const generate = provider === 'gemini' ? generateWithGemini : generateWithOpenAI;

  for (const img of IMAGES) {
    console.log(`Generating: ${img.filename}...`);
    try {
      await generate(img);
    } catch (err) {
      console.error(`  Failed: ${img.filename}: ${err.message}`);
    }
  }

  console.log('\nDone!');
}

main();
