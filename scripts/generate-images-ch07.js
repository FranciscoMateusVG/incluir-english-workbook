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
    filename: 'ch07-relative-pronouns.png',
    prompt: `Black and white line art illustration for an English language workbook. A friendly teacher standing at a whiteboard pointing to a chart. The chart has two columns: on the left column, simple icons represent people (stick figure), things (a box), places (a house), time (a clock), and possession (a key). On the right column, the words WHO, WHICH, WHERE, WHEN, WHOSE are written next to their matching icons, each connected by a small arrow. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch07-defining-clause.png',
    prompt: `Black and white line art illustration for an English language workbook showing a defining relative clause. Three identical-looking girls standing in a row, each wearing slightly different accessories (one with a hat, one with a backpack, one with glasses). A large hand points at the girl with glasses, and above her a speech bubble says "The girl WHO wears glasses is my friend." The word WHO is circled. An arrow points from WHO to the specific girl, showing the clause identifies WHICH girl. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch07-defining-vs-nondefining.png',
    prompt: `Black and white line art illustration for an English language workbook comparing defining and non-defining relative clauses. The image is split into two panels side by side. LEFT PANEL labeled "DEFINING" (no commas): shows two brothers standing, one is circled, with text "My brother who lives in London" and a small question mark bubble saying "Which one?". RIGHT PANEL labeled "NON-DEFINING" (with commas): shows one brother standing alone, with text "My brother, who lives in London," and a speech bubble with extra info icon. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch07-neighborhood-reading.png',
    prompt: `Black and white line art illustration for an English language workbook. A cozy Brazilian neighborhood scene showing a quiet street with small houses, a mango tree giving shade, a small bakery on the corner with bread visible in the window, an elderly woman tending a flower garden next door, and a small square with a bench where two elderly men play dominoes. A school building is visible in the background with a colorful mural on its wall. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch07-commas-matter.png',
    prompt: `Black and white line art illustration for an English language workbook about the importance of commas in relative clauses. Two large comma characters drawn as cartoon figures standing as gatekeepers on either side of a speech bubble that contains the text "extra info". Above the commas, the word "NON-DEFINING" is written. Below the scene, the same speech bubble appears without the comma characters, labeled "DEFINING". A small student character looks at both scenes with a lightbulb above their head. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 7 (Relative Clauses)...\n`);

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
