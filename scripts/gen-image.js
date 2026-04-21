#!/usr/bin/env node
/**
 * gen-image.js — Generate or replace a single workbook illustration.
 *
 * Usage:
 *   node scripts/gen-image.js <output-path> "<prompt>"
 *   node scripts/gen-image.js <output-path> "<prompt>" --provider openai
 *
 * Examples:
 *   node scripts/gen-image.js assets/images/b4/ch02-future-header.png "A student at a desk thinking about the future"
 *   node scripts/gen-image.js assets/images/b4/ch05-new-image.png "Two people shaking hands" --provider openai
 *
 * The prompt is automatically wrapped with the workbook illustration style
 * prefix/suffix unless --raw is passed.
 *
 * Options:
 *   --provider <gemini|openai>  Image provider (default: gemini)
 *   --raw                       Use prompt as-is, no style wrapping
 *   --size <WxH>                Image size (default: 1024x1024)
 */

const fs = require('fs')
const path = require('path')
const https = require('https')

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const envPath = path.join(__dirname, '..', '.env')
const envContent = fs.readFileSync(envPath, 'utf8')

const STYLE_PREFIX = 'Black and white line art illustration for an English language workbook. '
const STYLE_SUFFIX = ' Clean, simple line drawing style suitable for print. No shading, no gray tones, pure black lines on white background. Educational workbook illustration style.'

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)

function flag(name) {
  const i = args.indexOf(`--${name}`)
  if (i === -1) return null
  const val = args[i + 1]
  args.splice(i, val && !val.startsWith('--') ? 2 : 1)
  return val || true
}

const provider = flag('provider') || 'gemini'
const raw = flag('raw')
const size = flag('size') || '1024x1024'

// After stripping flags, the remaining positional args are: <path> <prompt>
const outputPath = args[0]
const promptArg = args.slice(1).join(' ')

if (!outputPath || !promptArg) {
  console.error('Usage: node scripts/gen-image.js <output-path> "<prompt>" [--provider gemini|openai] [--raw]')
  process.exit(1)
}

const resolvedOutput = path.resolve(outputPath)
const prompt = raw ? promptArg : `${STYLE_PREFIX}${promptArg}${STYLE_SUFFIX}`

// ---------------------------------------------------------------------------
// Gemini
// ---------------------------------------------------------------------------

async function generateWithGemini() {
  const apiKey = envContent.match(/GEMINI_API_KEY="(.+)"/)?.[1]
  if (!apiKey) {
    console.error('Error: GEMINI_API_KEY not found in .env')
    process.exit(1)
  }

  const { GoogleGenAI } = await import('@google/genai')
  const ai = new GoogleGenAI({ apiKey })

  console.log('Calling Gemini...')
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: prompt,
    config: { responseModalities: ['Text', 'Image'] }
  })

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      const buffer = Buffer.from(part.inlineData.data, 'base64')
      fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true })
      fs.writeFileSync(resolvedOutput, buffer)
      return buffer.length
    }
  }

  throw new Error('No image returned by Gemini')
}

// ---------------------------------------------------------------------------
// OpenAI (DALL-E 3)
// ---------------------------------------------------------------------------

function generateWithOpenAI() {
  const apiKey = envContent.match(/OPENAI_KEY="(.+)"/)?.[1]
  if (!apiKey) {
    console.error('Error: OPENAI_KEY not found in .env')
    process.exit(1)
  }

  const body = JSON.stringify({
    model: 'dall-e-3',
    prompt,
    n: 1,
    size,
    quality: 'standard',
    response_format: 'b64_json'
  })

  console.log('Calling DALL-E 3...')
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
            fs.mkdirSync(path.dirname(resolvedOutput), { recursive: true })
            fs.writeFileSync(resolvedOutput, buffer)
            resolve(buffer.length)
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const exists = fs.existsSync(resolvedOutput)
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  gen-image — ${provider}`)
  console.log(`${'='.repeat(60)}`)
  console.log(`  Output:   ${resolvedOutput}`)
  console.log(`  Replace:  ${exists ? 'yes (existing file)' : 'no (new file)'}`)
  console.log(`  Provider: ${provider}`)
  console.log(`  Raw mode: ${raw ? 'yes' : 'no (auto style wrap)'}`)
  console.log(`${'='.repeat(60)}\n`)

  const generate = provider === 'openai' ? generateWithOpenAI : generateWithGemini
  const bytes = await generate()

  console.log(`\nDone! Saved ${(bytes / 1024).toFixed(0)} KB to ${resolvedOutput}`)
}

main().catch((err) => {
  console.error(`\nFailed: ${err.message}`)
  process.exit(1)
})
