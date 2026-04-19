# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Overview

**Incluir English Learning Workbook** - AI-assisted educational content for English learning.

This is a content/documentation project (not code). The system generates professional, printable PDF workbooks from HTML content.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

---

## CRITICAL: Read Before Working

### Documentation (Read in Order)

1. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System overview, folder structure, design decisions
2. **[docs/TEMPLATING.md](docs/TEMPLATING.md)** - Component vocabulary, nesting rules, content contract
3. **[docs/PDF-GENERATION.md](docs/PDF-GENERATION.md)** - Build commands, options, pagination
4. **[docs/GOTCHAS.md](docs/GOTCHAS.md)** - Common pitfalls and troubleshooting

### Sample Content

- **[content/b4/chapters/chapter-01-tenses.html](content/b4/chapters/chapter-01-tenses.html)** - Reference chapter with all components
- **[content/b4/chapters/chapter-02-future-modals-prepositions.html](content/b4/chapters/chapter-02-future-modals-prepositions.html)** - Reference chapter with illustrations

---

## Project Structure

```
incluir_english_workbook/
├── templates/           # Base HTML templates
│   ├── base.html       # Standard page template
│   ├── cover.html      # Cover page template
│   └── toc.html        # Table of contents template
├── content/            # Workbook content (this is where you work)
│   ├── b1/chapters/    # Book Level 1 (Beginner)
│   ├── b2/chapters/    # Book Level 2
│   ├── b3/chapters/    # Book Level 3
│   └── b4/chapters/    # Book Level 4 (most developed)
├── styles/             # CSS stylesheets (DO NOT MODIFY unless necessary)
│   ├── print.css       # Page setup, typography, breaks
│   └── components.css  # Component definitions
├── assets/             # Static assets
│   └── images/         # Content images (organized by book: b1/, b2/, b3/, b4/)
├── scripts/            # Build tooling
│   ├── build.js        # Single chapter HTML→PDF conversion
│   ├── build-all.js    # Multi-chapter batch builder
│   └── generate-images*.js  # Image generation scripts (DALL-E 3)
├── output/             # Generated PDFs (gitignored)
├── docs/               # Documentation
├── .env                # API keys (OPENAI_KEY for image generation)
└── package.json        # Dependencies
```

---

## Content Generation Rules (Summary)

### Component Vocabulary

Use ONLY these components (defined in `styles/components.css`):

| Component | Purpose |
|-----------|---------|
| `.chapter` | Chapter container |
| `.unit` | Unit within chapter |
| `.rule-box` | Grammar rules, key points |
| `.callout` | Tips (`.tip`), notes (`.note`), warnings (`.warning`), reminders (`.remember`) |
| `.example` | Example sentences with translation |
| `.vocab-table` | Vocabulary lists |
| `.dialogue-block` | Conversations |
| `.reading-passage` | Text for reading comprehension |
| `.exercise` | Practice activities |
| `.word-bank` | Words to use in fill-in-blank exercises |
| `.matching-columns` | Matching exercise layout |
| `.ordering-items` | Ordering exercise layout |
| `.image-grid` | Multiple images in a row |
| `.image-exercise` | Image + questions side by side |
| `.listening-box` | Audio track placeholder |
| `.answer` | Correct answer (hidden in student version) |
| `.answer-key` | Full answer key (hidden in student version) |
| `.teacher-note` | Teacher guidance (hidden in student version) |

### Nesting Rules

- `.rule-box` CAN contain: `<p>`, lists, `<table>`, `.example`
- `.rule-box` CANNOT contain: `.exercise`, `.callout`, `.answer-key`
- `.callout` CANNOT contain: `.exercise`, `.rule-box`, `.example`
- `.exercise` CANNOT contain: `.rule-box`, `.callout`, nested exercises

### Forbidden Patterns

- NO `<script>` tags
- NO `<style>` tags
- NO inline styles (`style="..."`)
- NO external URLs
- NO `<br>` for spacing (use CSS margins)

---

## Building PDFs

### Setup (First Time Only)

```bash
npm install
npm run install:playwright
```

### Generate PDF

```bash
# Student version
node scripts/build.js content/b4/chapters/chapter-01-tenses.html -v student

# Teacher version
node scripts/build.js content/b4/chapters/chapter-01-tenses.html -v teacher

# Custom output
node scripts/build.js input.html -o output/custom-name.pdf

# Build all chapters for a book
npm run build:b4           # All B4 chapters (student)
npm run build:b4:teacher   # All B4 chapters (teacher)
```

---

## Dual Output (Student vs Teacher)

The SAME HTML generates both versions via CSS toggle:

| Content | Student | Teacher |
|---------|---------|---------|
| Lessons | ✓ | ✓ |
| Exercises | ✓ | ✓ |
| `.answer` | Hidden | Visible |
| `.answer-key` | Hidden | Visible |
| `.teacher-note` | Hidden | Visible |

**Implementation:** The build script sets `class="student-version"` or `class="teacher-version"` on `<html>`.

---

## Creating New Content

### New Chapter Checklist

**IMPORTANT: Steps 1-7 are ALL mandatory when creating a new chapter. NEVER skip image generation — chapters without illustrations are incomplete.**

1. [ ] Create `content/<level>/chapters/chapter-XX-name.html`
2. [ ] Copy structure from an existing chapter (e.g., `chapter-01-tenses.html`)
3. [ ] Use only components from `components.css`
4. [ ] Include `.answer` spans for all exercise items
5. [ ] Include `.answer-key` at end of chapter
6. [ ] Include `.teacher-note` where appropriate
7. [ ] **Generate illustrations** — THIS IS MANDATORY, NOT OPTIONAL:
   - Create `scripts/generate-images-<level>-chXX.js` (e.g., `generate-images-b1-ch03.js`)
   - Define ~5 images per chapter (see Image Generation below)
   - Run the script to generate all images
   - Insert `<figure class="image-figure">` tags in the chapter HTML
   - Verify images render in the built PDF
8. [ ] Test build: `node scripts/build.js content/<level>/chapters/chapter-XX-name.html -v student`
9. [ ] Test build: `node scripts/build.js content/<level>/chapters/chapter-XX-name.html -v teacher`

---

## Image Generation

Each chapter should have **~5 black and white illustrations** to make the content more didactic and engaging. Images are generated using the **OpenAI DALL-E 3 API** (key in `.env`).

### Image Requirements

- **Style:** Black and white line art — no color, no shading, no gray tones, pure black lines on white background
- **Size:** 1024x1024 PNG
- **Location:** `assets/images/b4/` (or `b1/`, `b2/`, `b3/` for other books)
- **Naming:** `chXX-descriptive-name.png` (e.g., `ch05-detective-mystery.png`)

### What to Illustrate (~5 per chapter)

1. **Chapter header** — A scene that introduces the chapter theme (placed after `chapter-header`)
2. **Key grammar concept** — Visual diagram or scene showing the main rule (placed after rule boxes or example groups)
3. **Contrast/comparison** — Side-by-side or split panel comparing two concepts (e.g., active vs passive, will vs going to)
4. **Dialogue/conversation scene** — Characters in the setting of the chapter's dialogue (placed before `.dialogue-block`)
5. **Reading passage scene** — Illustration that sets the context for the reading section (placed before `.reading-passage`)

### Image Placement in HTML

Use the `<figure class="image-figure">` component. **Paths must be relative from `content/b4/chapters/` — use `../../../assets/images/b4/`** (3 levels up).

```html
<figure class="image-figure">
    <img src="../../../assets/images/b4/chXX-name.png" alt="Descriptive alt text">
    <figcaption>Caption text here</figcaption>
</figure>
```

**Placement rules:**
- Place OUTSIDE of `.rule-box`, `.callout`, `.exercise`, `.example` elements
- Good spots: after chapter header, between rule boxes and exercises, after example groups, before reading passages and dialogues
- Each image gets its own `<figure>` block at the same nesting level as other content blocks

### Generating Images (Script)

Create a Node.js script at `scripts/generate-images-chXX.js`. Use existing scripts as reference (e.g., `scripts/generate-images.js`).

The script pattern:

```javascript
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load API key from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const apiKey = envContent.match(/OPENAI_KEY="(.+)"/)?.[1];

const OUTPUT_DIR = path.join(__dirname, '..', 'assets', 'images', 'b4');

const IMAGES = [
  {
    filename: 'chXX-descriptive-name.png',
    prompt: `Black and white line art illustration for an English language workbook.
[Describe the scene clearly]. Clean, simple line drawing style suitable for print.
No shading, no gray tones, pure black lines on white background.
Educational workbook illustration style.`
  },
  // ... more images
];

// Use DALL-E 3, size 1024x1024, response_format: 'b64_json'
// Save base64 response as PNG files to OUTPUT_DIR
```

Run with: `node scripts/generate-images-chXX.js` (allow ~60s per image)

### DALL-E Prompt Tips

- Always start with: "Black and white line art illustration for an English language workbook"
- Always end with: "No shading, no gray tones, pure black lines on white background. Educational workbook illustration style."
- Be specific about the scene, characters, and what they're doing
- For split panels: "split into two panels side by side, LEFT panel: [...], RIGHT panel: [...]"
- For grids: "showing 4 small scenes in a 2x2 grid"
- For labeled diagrams: include the labels in the prompt, but note DALL-E sometimes misspells text
- Keep prompts focused — one clear concept per image

### Verification

After inserting images, build the PDF and check:
- File size should be significantly larger (typically 5-7MB with images vs ~300KB without)
- Images should render in the PDF (not show as broken icons)
- Images should be well-positioned and not overlap with other content

---

## Main Branch

**Main branch is `master`**

---

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Update issue status** - Close finished work, update in-progress items
3. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
4. **Clean up** - Clear stashes, prune remote branches
5. **Verify** - All changes committed AND pushed
6. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
