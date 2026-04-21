# Claude Code Instructions

Read `AGENTS.md` and `docs/` before working on content.

## Chapter Review Workflow

This project uses an **iterative chapter-by-chapter review loop** between the human reviewer and Claude. Never batch-render the full workbook during review — always render one chapter at a time.

### The Loop

```
1. RENDER  →  2. REVIEW  →  3. EDIT  →  repeat until approved
```

**Step 1 — Render a single chapter:**

```bash
# Student version (default)
node scripts/build.js content/<book>/chapters/<chapter>.html -v student -o output/review.pdf

# Teacher version (shows answers, teacher notes)
node scripts/build.js content/<book>/chapters/<chapter>.html -v teacher -o output/review-teacher.pdf
```

Always output to `output/review.pdf` (or `output/review-teacher.pdf`) so there's one predictable file to open. After rendering, open it:

```bash
open output/review.pdf
```

**Step 2 — Human reviews the PDF.** They check:
- Exercise quality and correctness
- Image placement and relevance
- Answer key accuracy
- Layout and page breaks
- Teacher notes (in teacher version)

**Step 3 — Apply requested changes.** Edit the HTML source in `content/<book>/chapters/`, then go back to Step 1.

### Rules

- **One chapter at a time.** Do not render the full workbook (`build-all.js`) during review cycles. Use `build.js` for single chapters.
- **Consistent output path.** Always use `-o output/review.pdf` so the reviewer doesn't have to hunt for the file. Overwrite each iteration.
- **Render both versions when asked.** If the reviewer says "show me the teacher version", render with `-v teacher -o output/review-teacher.pdf`.
- **Always open the PDF after rendering.** Use `open output/review.pdf` so the reviewer can see it immediately.
- **Announce what changed.** Before each re-render, briefly list what was modified (e.g., "Fixed exercise 3 answer key, repositioned image after Unit 2 intro").
- **Never skip image verification.** If images were added or moved, confirm they render in the PDF (not broken icons).

### Quick Reference

| Action | Command |
|--------|---------|
| Render chapter (student) | `node scripts/build.js content/b4/chapters/chapter-02-future-modals-prepositions.html -v student -o output/review.pdf` |
| Render chapter (teacher) | `node scripts/build.js content/b4/chapters/chapter-02-future-modals-prepositions.html -v teacher -o output/review-teacher.pdf` |
| Open PDF | `open output/review.pdf` |
| Build full workbook | `npm run build:b4` (only after all chapters are approved) |

## Publishing (Full Workbook with Front Matter)

Use `publish.js` to build the final print-ready workbook. It merges the cover, student manual, summary (table of contents), and all chapters into one PDF, then compresses for B&W printing.

### Usage

```bash
# Build both student and teacher books (compressed, grayscale, 150 DPI)
npm run publish:b4

# Build only one variant
npm run publish:b4:student
npm run publish:b4:teacher

# Keep color (still compressed)
npm run publish:b4:color

# No compression at all (full quality)
npm run publish:b4:full

# Custom options
node scripts/publish.js -b b4 --dpi 200 --color
```

### Front matter files

Each book's front matter lives in `assets/frontmatter/<book>/`:

| File | Description |
|------|-------------|
| `cover.pdf` | Cover page (e.g., "Inglês Adulto Básico 4") |
| `manual.pdf` | Student manual (rights, duties, schedule, contacts) |

The summary / table of contents is at `content/<book>/summary.html`.

### Output

Final PDFs go to `output/<book>/workbook-<book>-<variant>.pdf`.

### Requirements

- **Ghostscript** (`gs`): `brew install ghostscript` — for PDF compression
- **Poppler** (`pdfunite`): `brew install poppler` — for PDF merging

### Notes

- Page numbers in `summary.html` must match the content PDF's own footer numbering (starting at 1), not the final merged page count.
- If you add/remove chapters or change content significantly, re-check that the summary page numbers still match by opening the final PDF.
- The cover and manual pages have no page numbers; the content pages start numbering at 1.

---

## Image Generation

Use the generic `gen-image.js` CLI to generate or replace any illustration. No per-chapter scripts needed.

### Usage

```bash
# Generate/replace an image (Gemini, default — auto-wraps prompt with workbook style)
node scripts/gen-image.js <output-path> "<prompt>"

# Use OpenAI DALL-E 3 instead
node scripts/gen-image.js <output-path> "<prompt>" --provider openai

# Skip the auto style prefix/suffix (send prompt as-is)
node scripts/gen-image.js <output-path> "<prompt>" --raw
```

### Examples

```bash
# Replace the chapter 02 header image
node scripts/gen-image.js assets/images/b4/ch02-future-header.png "A student sitting at a desk, looking up thoughtfully with a single thought bubble containing a simple road stretching into the horizon"

# Generate a brand new image
node scripts/gen-image.js assets/images/b4/ch05-new-concept.png "Two people having a conversation at a bus stop"
```

### Prompt tips

- Describe **one clear scene** — don't overload with symbols
- The style wrapper is added automatically: "Black and white line art..." + "No shading, no gray tones..."
- For split panels: "split into two panels side by side, LEFT panel: [...], RIGHT panel: [...]"
- For grids: "showing 4 small scenes in a 2x2 grid"
- Keep it simple — Gemini handles clean compositions better than cluttered ones

### After generating

Always re-render the chapter and verify the image appears correctly:

```bash
node scripts/build.js content/b4/chapters/<chapter>.html -v student -o output/review.pdf && open output/review.pdf
```

---

### Chapter Inventory (B4)

| # | File | Topic |
|---|------|-------|
| 01 | `chapter-01-tenses.html` | Tenses |
| 02 | `chapter-02-future-modals-prepositions.html` | Future Simple, Modal Verbs, Prepositions |
| 03 | `chapter-03-present-perfect.html` | Present Perfect |
| 04 | `chapter-04-present-perfect-reported-speech.html` | Present Perfect & Reported Speech |
| 05 | `chapter-05-past-perfect.html` | Past Perfect |
| 06 | `chapter-06-passive-voice.html` | Passive Voice |
| 07 | `chapter-07-relative-clauses.html` | Relative Clauses |
| 08 | `chapter-08-phrasal-verbs-collocations.html` | Phrasal Verbs & Collocations |
