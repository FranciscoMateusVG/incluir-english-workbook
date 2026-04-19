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
    filename: 'ch04-present-perfect-continuous.png',
    prompt: `Black and white line art illustration for an English language workbook. A teenage girl sitting at a desk studying with books and notebooks open around her. A large clock on the wall shows the passage of time with a curved arrow from 9 AM to the current time. A small calendar in the corner shows "since 2021". Above her head a thought bubble shows the text pattern "has been + verb-ing". Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch04-for-vs-since.png',
    prompt: `Black and white line art illustration for an English language workbook showing the difference between FOR and SINCE. A horizontal timeline arrow going from left to right. On the left side, a point marked "2019" with the label "SINCE (starting point)" and an arrow pointing to that specific moment. Below the timeline, a bracket spanning a section labeled "FOR 5 years (duration)" showing the period of time. A small figure of a student standing at the right end of the timeline (present day). Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch04-reported-speech.png',
    prompt: `Black and white line art illustration for an English language workbook showing reported speech. Three people in a scene: Person A (a girl) on the left with a speech bubble saying "I like pizza" in quotation marks. Person B (a boy) in the middle, listening to Person A. On the right side, Person B is now talking to Person C (another student), with a speech bubble saying "She said she liked pizza" without quotation marks. A small arrow connects the two scenes showing the transformation from direct to reported speech. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch04-school-cafeteria-dialogue.png',
    prompt: `Black and white line art illustration for an English language workbook. Two teenage students, a boy and a girl, standing in a school cafeteria having a conversation. The girl holds a book and points toward a door labeled "Library". The boy holds a book he needs to return. Simple cafeteria background with a table and lunch trays visible. Both students have friendly expressions. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch04-science-competition.png',
    prompt: `Black and white line art illustration for an English language workbook. A teenage girl standing on a podium holding a trophy and a certificate, smiling proudly. Behind her is a banner that reads "Science Competition". Next to the podium, a male teacher with glasses is clapping. In front of the podium, there are two reporters, one holding a microphone and another holding a notepad. A solar panel model is displayed on a small table beside the podium. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 4...\n`);

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
