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
    filename: 'ch05-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A cheerful Brazilian classroom scene showing a teacher at a whiteboard. On the whiteboard there is a frequency scale (always, usually, sometimes, never) on the left side, and a list of possessive adjectives (my, your, his, her, our, their) on the right side. Several students sit at desks, some pointing at their own books and bags. One student is asking "Whose book is this?" in a speech bubble. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch05-frequency-scale.png',
    prompt: `Black and white line art illustration for an English language workbook showing frequency adverbs on a vertical scale. A large thermometer-style gauge on the left going from 0% at the bottom to 100% at the top. Next to each level there is a label and a small icon: at 100% "ALWAYS" with a checkmark repeated many times, at 90% "USUALLY" with a mostly-filled bar, at 70% "OFTEN" with a three-quarter-filled bar, at 50% "SOMETIMES" with a half-filled bar, at 10% "RARELY" with a nearly empty bar, at 0% "NEVER" with an X mark. On the right side small example scenes: a person brushing teeth (always), a person walking to school (usually), a person reading a book (often), a person eating pizza (sometimes), a person at a cinema (rarely), a person drinking coffee with an X over it (never). Clean, simple line drawing style. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch05-possessive-adjectives.png',
    prompt: `Black and white line art illustration for an English language workbook showing possessive adjectives. Six small panels arranged in a 2x3 grid. Each panel shows a person pointing at or holding something that belongs to them, with a label: Panel 1: a girl holding a bag labeled "MY bag". Panel 2: a boy showing a phone labeled "YOUR phone" with an arrow pointing to the viewer. Panel 3: a boy playing guitar labeled "HIS guitar". Panel 4: a girl petting a cat labeled "HER cat". Panel 5: two students in front of a school building labeled "OUR school". Panel 6: a group of kids next to bicycles labeled "THEIR bicycles". Each panel is inside a rounded rectangle. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch05-dialogue.png',
    prompt: `Black and white line art illustration for an English language workbook. Two Brazilian teenagers, a girl and a boy, standing in a school hallway after class talking to each other. The girl has a speech bubble saying "Is this your pen?" and the boy has a speech bubble saying "No, it's not mine!" The girl is holding up a blue pen. There are backpacks on the floor nearby and a classroom door behind them. They are wearing casual school clothes. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch05-reading-scene.png',
    prompt: `Black and white line art illustration for an English language workbook. Two Brazilian teenagers, a boy and a girl, sitting side by side at a library table studying together. The girl has English books open in front of her and is explaining something to the boy. The boy has Maths books and is taking notes. There are bookshelves behind them. Both look focused and friendly. A small clock on the wall shows afternoon time. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
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
  console.log(`Generating ${IMAGES.length} images for B1 Chapter 5 (Frequency Adverbs & Possessives)...\n`);

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
