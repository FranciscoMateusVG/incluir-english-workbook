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
    filename: 'ch06-time-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A row of five different clocks showing different times: a round wall clock showing 3:00, an alarm clock showing 7:30, a digital clock display showing 12:45, a wristwatch showing 9:15, and a grandfather clock showing 6:00. A teenage student stands to the right looking at the clocks with a curious expression, holding a notebook. The word "TIME" appears in large decorative letters above the clocks. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch06-clock-face.png',
    prompt: `Black and white line art illustration for an English language workbook showing how to tell time. A large clock face in the center with numbers 1-12 clearly visible. The right half of the clock (from 12 going clockwise to 6) is labeled "PAST" with an arrow. The left half (from 6 going clockwise to 12) is labeled "TO" with an arrow. At the 12 position: "o'clock". At the 3 position: "quarter past". At the 6 position: "half past". At the 9 position: "quarter to". Between these positions, small labels show "5 past", "10 past", "20 past", "25 past" on the right side, and "25 to", "20 to", "10 to", "5 to" on the left side. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch06-prepositions-at-in-on.png',
    prompt: `Black and white line art illustration for an English language workbook showing three time prepositions in three separate panels side by side. LEFT PANEL labeled "AT": a clock showing 7:00 with the text "at 7 o'clock" and a moon with stars with the text "at night". CENTER PANEL labeled "IN": a sun rising with the text "in the morning", a calendar showing "JULY" with the text "in July", and "2025" with the text "in 2025". RIGHT PANEL labeled "ON": a calendar page showing "MONDAY" with the text "on Monday", and a calendar showing "March 5" with the text "on the 5th". Each panel is inside a rounded rectangle border. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch06-dialogue-schedule.png',
    prompt: `Black and white line art illustration for an English language workbook. Two Brazilian teenagers, a girl and a boy, sitting at a school desk during break time. They are looking at a paper timetable on the desk between them. The girl has a speech bubble saying "What time does your first class start?" and the boy has a speech bubble saying "It starts at quarter past seven." Behind them is a classroom wall with a clock showing 10:00 and a bulletin board. They are wearing casual school clothes. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch06-weekly-timetable.png',
    prompt: `Black and white line art illustration for an English language workbook. A weekly school timetable drawn as a large grid. The columns are labeled Monday, Tuesday, Wednesday, Thursday, Friday across the top. The rows show time slots: 7:00-8:00, 8:00-9:00, 9:00-10:00, BREAK, 10:00-11:00, 11:00-12:00. Some cells contain subject names like "Maths", "English", "Science", "Art", "P.E.", "Portuguese", "History", "Geography". A pencil and an eraser are drawn next to the timetable. The title "My Weekly Timetable" appears at the top in a decorative banner. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
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
  console.log(`Generating ${IMAGES.length} images for B1 Chapter 6 (Time & Time Prepositions)...\n`);

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
