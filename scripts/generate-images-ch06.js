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
    filename: 'ch06-active-vs-passive.png',
    prompt: `Black and white line art illustration for an English language workbook showing the concept of active vs passive voice. On the left side labeled "ACTIVE", a chef (stick figure with a chef hat) is cooking a meal in a pan, with an arrow pointing from the chef to the meal, showing "Subject → Verb → Object". On the right side labeled "PASSIVE", the same meal is on a plate in the center with an arrow pointing back to the chef, showing "Subject ← is cooked ← by Agent". The two sides are separated by a vertical dashed line. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch06-passive-tenses-timeline.png',
    prompt: `Black and white line art illustration for an English language workbook. A horizontal timeline arrow from left (PAST) to right (FUTURE) with the word PRESENT in the middle. Along the timeline, small labeled markers show different passive voice tenses: "was built" in the past, "is being repaired" at present with small construction lines, "has been finished" between past and present with a checkmark, and "will be opened" in the future with a ribbon-cutting scissors icon. Below the timeline the formula "be + past participle" is shown in a box. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch06-city-tour.png',
    prompt: `Black and white line art illustration for an English language workbook. A tour guide with a small flag is standing next to a tourist in front of a historic baroque church with ornate details. The tour guide is pointing at the church and has a speech bubble that says "It was designed by Aleijadinho." The tourist is holding a camera and looking impressed. In the background there are cobblestone streets and colonial-style buildings typical of a historic Brazilian town. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch06-machu-picchu.png',
    prompt: `Black and white line art illustration for an English language workbook. A panoramic view of Machu Picchu, the ancient Incan city, perched on a mountain with terraces and stone buildings. The iconic Huayna Picchu mountain rises behind it. In the foreground, a small figure of an explorer with a hat and notebook stands looking at the ruins. Clouds float around the mountain peaks. The style is clean line art suitable for a textbook. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch06-passive-transformation.png',
    prompt: `Black and white line art illustration for an English language workbook showing how to transform an active sentence into passive voice step by step. Three horizontal rows connected by downward arrows: Row 1 shows "The teacher corrected the tests" with "The teacher" underlined and labeled "Subject", "corrected" labeled "Verb", and "the tests" labeled "Object". Row 2 shows arrows indicating the object moves to subject position and subject moves to agent position. Row 3 shows the result "The tests were corrected by the teacher" with "The tests" now labeled "New Subject", "were corrected" labeled "be + past participle", and "by the teacher" labeled "Agent". Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 6 (Passive Voice)...\n`);

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
