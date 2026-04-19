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
    filename: 'ch08-phrasal-verbs-header.png',
    prompt: `Black and white line art illustration for an English language workbook about phrasal verbs. A classroom scene with a friendly teacher pointing at a whiteboard. On the whiteboard there are three examples written: LOOK plus UP equals search for info, GIVE plus UP equals stop trying, TURN plus ON equals activate. Each example shows a verb and a particle joining together with a plus sign and an equals sign to form a new meaning. Two students sit at desks looking at the board with interest. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch08-separable-inseparable.png',
    prompt: `Black and white line art illustration for an English language workbook explaining separable vs inseparable phrasal verbs. The image is split into two panels. LEFT PANEL labeled "SEPARABLE": shows the word "TURN" and "OFF" with a small object (a light bulb) sliding between them, with a checkmark. An arrow shows the object can go in the middle. RIGHT PANEL labeled "INSEPARABLE": shows the words "RAN INTO" locked together with a small padlock, and an object (a person icon) can only go after both words, with a checkmark. A red X shows attempting to split them is wrong. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch08-daily-routine-phrasal-verbs.png',
    prompt: `Black and white line art illustration for an English language workbook showing daily routine phrasal verbs. A sequence of four small scenes arranged in a row like a comic strip, each showing a stick figure: (1) A person sitting up in bed stretching with an alarm clock, labeled "WAKE UP"; (2) A person putting on a jacket, labeled "PUT ON"; (3) A hand picking up keys from a table, labeled "PICK UP"; (4) A hand turning off a light switch, labeled "TURN OFF". Each scene is inside a simple rounded rectangle frame. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch08-make-do-take-have.png',
    prompt: `Black and white line art illustration for an English language workbook about collocations with make, do, take, and have. Four columns, each headed by a verb in a circle: MAKE, DO, TAKE, HAVE. Under MAKE: icons of a lightbulb (decision), two stick figures shaking hands (friends), and an upward arrow (progress). Under DO: icons of a notebook (homework), a dumbbell (exercise), and a handshake (a favour). Under TAKE: icons of a coffee cup (a break), a camera (a photo), and a pencil writing (notes). Under HAVE: icons of two speech bubbles (a conversation), a smiley face (fun), and a chat bubble (a go). Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
  },
  {
    filename: 'ch08-email-reading.png',
    prompt: `Black and white line art illustration for an English language workbook. A young Brazilian male student (Lucas) sitting at a desk with a laptop, typing an email to a friend. On the laptop screen, a simple email interface is visible with "To: Camila" at the top. Around Lucas, small thought bubbles show: a university building (his future plans), running shoes (his new exercise routine), and two friends meeting and waving (running into someone). The scene conveys a friendly, informal email being written. Clean, simple educational workbook illustration. No shading, no gray tones, pure black lines on white background.`
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
  console.log(`Generating ${IMAGES.length} images for Chapter 8 (Phrasal Verbs & Collocations)...\n`);

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
