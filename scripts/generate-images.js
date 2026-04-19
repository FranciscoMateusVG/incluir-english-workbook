const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse --provider flag (default: openai)
const provider = process.argv.includes('--gemini') ? 'gemini' : 'openai';

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'b4');

const IMAGES = [
  {
    filename: 'ch02-future-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A teenage student sitting at a desk, with a large thought bubble above their head containing icons of future plans: an airplane, a graduation cap, a calendar, and a speech bubble with "I will...". Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch02-will-vs-going-to.png',
    prompt: `Black and white line art illustration for an English language workbook, split into two panels side by side. LEFT panel labeled "Will" (spontaneous): a person at a restaurant looking at a menu and saying "I'll have the chicken!" with a speech bubble. RIGHT panel labeled "Going to" (planned): a person with a packed suitcase and airplane tickets looking at a calendar. Clean simple line drawing, no shading, no gray tones, pure black lines on white background. Educational workbook illustration.`
  },
  {
    filename: 'ch02-modal-verbs.png',
    prompt: `Black and white line art illustration for an English language workbook showing 4 small scenes in a 2x2 grid illustrating modal verbs. Top-left: a person swimming confidently (CAN). Top-right: a traffic stop sign and seatbelt sign (MUST). Bottom-left: a doctor giving advice to a patient (SHOULD). Bottom-right: a person looking at clouds wondering if it will rain (MIGHT). Clean simple line drawing, no shading, no gray tones, pure black lines on white background. Educational workbook style.`
  },
  {
    filename: 'ch02-prepositions.png',
    prompt: `Black and white line art illustration for an English language workbook teaching prepositions ON, IN, AT. A simple room scene with clear labels: a cat sitting ON a table, a ball IN a box, and a person standing AT the door. Each preposition (ON, IN, AT) is written in bold next to its corresponding scene element. Clean simple line drawing, no shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch02-weekend-plans.png',
    prompt: `Black and white line art illustration for an English language workbook. A teenage girl sitting at a laptop writing an email, with thought bubbles showing weekend activities: shopping bags, a movie theater/cinema screen, books for studying, and friends meeting at a park. Clean simple line drawing, no shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 2...\n`);

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
