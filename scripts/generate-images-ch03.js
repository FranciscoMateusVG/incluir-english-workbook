const fs = require('fs')
const path = require('path')
const https = require('https')

// Load .env
const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')

// Parse --provider flag (default: openai)
const provider = process.argv.includes('--gemini') ? 'gemini' : 'openai'

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'b4')

const IMAGES = [
  {
    filename: 'ch03-present-perfect-header.png',
    prompt: `Black and white line art illustration for an English language workbook. A timeline showing the concept of Present Perfect tense: on the left side labeled "PAST" there is a person starting to read a book, and on the right side labeled "NOW" the same person is still reading with a stack of finished books next to them. An arrow connects past to present with the text "I have read five books" written along the arrow. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-irregular-verbs-table.png',
    prompt: `Black and white line art illustration for an English language workbook about past participles. Three columns showing verb transformation with simple icons: "GO" with walking feet arrow "WENT" with running feet arrow "GONE" with footprints fading away; "EAT" with a full plate arrow "ATE" with half-eaten food arrow "EATEN" with an empty plate; "WRITE" with a blank paper arrow "WROTE" with a pen writing arrow "WRITTEN" with a finished letter. Clean, simple line drawing style. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-time-markers.png',
    prompt: `Black and white line art illustration for an English language workbook showing Present Perfect time markers. Four small scenes arranged in a 2x2 grid: Top-left labeled "EVER/NEVER": a person with a thought bubble containing a question mark and an airplane (Have you ever flown?). Top-right labeled "JUST": a person who has just arrived at a door, still holding luggage. Bottom-left labeled "ALREADY/YET": a student with a completed homework paper with a checkmark. Bottom-right labeled "SINCE/FOR": a calendar showing years 2020 to 2025 with a house icon. Clean simple line drawing, no shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-dialogue-cafeteria.png',
    prompt: `Black and white line art illustration for an English language workbook. Two teenage students, a boy and a girl, sitting at a school cafeteria table having a conversation about travel. The girl has a speech bubble saying "Have you ever been to another country?" and the boy has a thought bubble with the Argentinian flag and landmarks. They are sitting across from each other with lunch trays on the table. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  },
  {
    filename: 'ch03-travel-blog.png',
    prompt: `Black and white line art illustration for an English language workbook. A young woman (Marina) sitting at a laptop writing a travel blog, surrounded by travel souvenirs and photos pinned to a wall behind her showing landmarks from different European countries: the Eiffel Tower (Paris), a pizza slice (Italy), a bicycle (Amsterdam), Big Ben with a question mark (not yet visited). A small map of Europe is visible on her desk. Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.`
  }
]

// =============================================================================
// OPENAI (DALL-E 3)
// =============================================================================

function generateWithOpenAI(imageConfig) {
  const apiKey = envContent.match(/OPENAI_KEY="(.+)"/)?.[1]
  if (!apiKey) {
    console.error('Could not find OPENAI_KEY in .env')
    process.exit(1)
  }

  const { filename, prompt } = imageConfig
  const outputPath = path.join(OUTPUT_DIR, filename)

  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size: '1024x1024',
    quality: 'standard',
    response_format: 'b64_json'
  })

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.openai.com',
        path: '/v1/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => {
          if (res.statusCode !== 200) {
            reject(new Error(`API error ${res.statusCode}: ${data}`))
            return
          }
          try {
            const json = JSON.parse(data)
            const buffer = Buffer.from(json.data[0].b64_json, 'base64')
            fs.writeFileSync(outputPath, buffer)
            console.log(
              `  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`
            )
            resolve(outputPath)
          } catch (err) {
            reject(err)
          }
        })
      }
    )
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// =============================================================================
// GEMINI (Nano Banana)
// =============================================================================

async function generateWithGemini(imageConfig) {
  const apiKey = envContent.match(/GEMINI_API_KEY="(.+)"/)?.[1]
  if (!apiKey) {
    console.error('Could not find GEMINI_API_KEY in .env')
    process.exit(1)
  }

  const { filename, prompt } = imageConfig
  const outputPath = path.join(OUTPUT_DIR, filename)

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: prompt,
    config: { responseModalities: ['Text', 'Image'] }
  })

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.writeFileSync(outputPath, buffer)
      console.log(
        `  Saved: ${outputPath} (${(buffer.length / 1024).toFixed(0)} KB)`
      )
      return outputPath
    }
  }

  throw new Error('No image returned by Gemini')
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const providerLabel = 'Gemini'
  console.log(
    `Generating ${IMAGES.length} images for Chapter 3 (Present Perfect) using ${providerLabel}...\n`
  )

  const generate = generateWithGemini

  for (const img of IMAGES) {
    console.log(`Generating: ${img.filename}...`)
    try {
      await generate(img)
    } catch (err) {
      console.error(`  Failed: ${img.filename}: ${err.message}`)
    }
  }

  console.log('\nDone!')
}

main()
