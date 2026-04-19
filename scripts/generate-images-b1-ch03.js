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
    filename: 'ch03-plural-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A cheerful classroom scene showing a teacher pointing at a whiteboard. On the whiteboard there are two columns: on the left "1 book" with a drawing of one book, and on the right "3 books" with drawings of three books. Below that "1 child" with one stick figure and "4 children" with four stick figures. A few students sit at desks looking at the board. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-plural-rules.png',
    prompt: `Black and white line art illustration for an English language workbook showing plural noun rules. Five small panels arranged vertically: Panel 1 labeled "+s": a single cat becoming two cats. Panel 2 labeled "+es": one bus becoming two buses. Panel 3 labeled "y→ies": one city skyline becoming multiple city skylines with the word transformation shown. Panel 4 labeled "f→ves": one knife becoming multiple knives. Panel 5 labeled "irregular": one foot becoming two feet with a surprised expression. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-daily-routine.png',
    prompt: `Black and white line art illustration for an English language workbook showing a daily routine sequence. Six small scenes arranged in a 2x3 grid showing a teenage boy's day: (1) waking up with an alarm clock showing 6:30, (2) brushing teeth at a bathroom mirror, (3) eating breakfast with family at a table, (4) walking to school with a backpack, (5) sitting in a classroom with other students, (6) doing homework at a desk in the evening. Each scene is inside a rounded rectangle. Clean, simple line drawing style. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-dialogue-routines.png',
    prompt: `Black and white line art illustration for an English language workbook. Two Brazilian teenagers, a boy and a girl, standing in a school hallway talking to each other. The boy has a speech bubble saying "What time do you wake up?" and the girl has a speech bubble saying "I usually wake up at 6:30." They are wearing casual school clothes and carrying backpacks. There is a clock on the wall behind them. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-frequency-adverbs.png',
    prompt: `Black and white line art illustration for an English language workbook showing frequency adverbs on a vertical scale. A large thermometer-style gauge on the left going from 0% at the bottom to 100% at the top. Next to each level there is a label and a small icon: at 100% "ALWAYS" with a sun (every day), at 80% "USUALLY" with a mostly-filled circle, at 60% "OFTEN" with a half-filled circle, at 40% "SOMETIMES" with a quarter-filled circle, at 10% "RARELY" with an almost empty circle, at 0% "NEVER" with an X mark. Clean, simple line drawing style. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
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
  console.log(`Generating ${IMAGES.length} images for B1 Chapter 3 (Plural & Simple Present)...\n`);

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
