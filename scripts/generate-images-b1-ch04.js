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
    filename: 'ch04-numbers-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A staircase made of number blocks ascending from left to right. The steps are labeled with increasing numbers: 100, 200, 500, 1000, 10000, 100000, 1000000. A young student with a backpack is climbing the staircase, looking excited and pointing upward. Stars and sparkles around the top. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch04-place-value.png',
    prompt: `Black and white line art illustration for an English language workbook showing place value. A large chart with columns labeled from right to left: ONES, TENS, HUNDREDS, THOUSANDS, TEN THOUSANDS, HUNDRED THOUSANDS, MILLIONS. The number 2,500,000 is shown with each digit in its correct column. Below each column header is a simple icon: single dot for ones, group of ten dots for tens, a square of dots for hundreds, a cube for thousands, etc. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch04-ordinal-podium.png',
    prompt: `Black and white line art illustration for an English language workbook. A running race finish scene with a podium. Five children are shown: three on the podium labeled 1st (tallest, center), 2nd (left), and 3rd (right), each looking happy. Two more runners are nearby labeled 4th and 5th. A finish line banner is visible behind them. The children look like diverse teenagers. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch04-shopping-prices.png',
    prompt: `Black and white line art illustration for an English language workbook. A school supply shop scene. A teenage girl is at a counter talking to a shop assistant. On shelves behind the counter there are backpacks, notebooks, pens, and pencils with price tags showing numbers like R$120, R$8.50, R$4.99, R$15.99. The girl is holding some notebooks. A cash register is on the counter. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch04-calendar-dates.png',
    prompt: `Black and white line art illustration for an English language workbook. A large calendar page for a generic month showing numbered days 1 through 31 in a grid. Some dates are circled or starred with small labels: a birthday cake icon on the 15th, a Brazilian flag on the 7th, a Christmas tree on the 25th, a heart on the 14th. At the top, the months of the year are written in small text: January through December. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
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
  console.log(`Generating ${IMAGES.length} images for B1 Chapter 4 (Numbers Beyond 100)...\n`);

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
