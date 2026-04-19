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
    filename: 'ch05-past-perfect-timeline.png',
    prompt: `Black and white line art illustration for an English language workbook. A clear horizontal timeline arrow going from left to right, labeled "PAST" on the far left and "NOW" on the far right. Two events are marked on the timeline: Event 1 (earlier, on the left) labeled "PAST PERFECT - had + past participle" with a small icon of a person finishing homework, and Event 2 (later, in the middle) labeled "SIMPLE PAST" with a small icon of a person arriving home. Arrows and labels clearly show Event 1 happened BEFORE Event 2. Below the timeline the example sentence reads: "She had finished her homework when I arrived." Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch05-train-station.png',
    prompt: `Black and white line art illustration for an English language workbook. A person standing on an empty train platform looking disappointed. The person has just arrived and is looking down the tracks where a train is seen departing in the distance, getting smaller. A station clock on the wall shows the time. The scene conveys the idea "When I arrived at the station, the train had already left." Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch05-shopping-centre-dialogue.png',
    prompt: `Black and white line art illustration for an English language workbook. Two teenage students, a boy and a girl, sitting at a school desk talking on a Monday morning. The girl (Mariana) looks embarrassed and is gesturing while telling a story. A thought bubble above her head shows a small scene of her arriving at a shopping centre and seeing an empty bench where her friend had been waiting. The boy (Lucas) listens with a surprised expression. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch05-detective-mystery.png',
    prompt: `Black and white line art illustration for an English language workbook. A detective in a coat holding a magnifying glass, examining clues at a mansion. He stands near a bedroom window where muddy footprints are visible on the floor. A ladder leans against the wall outside the window. An open safe is visible in the background. The scene has a mystery atmosphere suitable for a reading comprehension story about a missing necklace. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch05-sequence-events.png',
    prompt: `Black and white line art illustration for an English language workbook. Two numbered panels showing a sequence of events. Panel 1 (labeled "FIRST - Past Perfect") shows a student studying hard at a desk with books, looking focused. Panel 2 (labeled "THEN - Simple Past") shows the same student smiling and holding up a test paper with a good grade. A large arrow connects Panel 1 to Panel 2 showing the chronological order. Below: "He had studied hard, so he passed the exam." Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 5 (Past Perfect)...\n`);

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
