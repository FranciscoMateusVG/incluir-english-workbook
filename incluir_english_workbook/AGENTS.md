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

- **[content/chapters/chapter-01-greetings.html](content/chapters/chapter-01-greetings.html)** - Reference implementation showing all components

---

## Project Structure

```
incluir_english_workbook/
├── templates/           # Base HTML templates
│   ├── base.html       # Standard page template
│   ├── cover.html      # Cover page template
│   └── toc.html        # Table of contents template
├── content/            # Workbook content (this is where you work)
│   ├── chapters/       # Chapter HTML files
│   └── units/          # Standalone units
├── styles/             # CSS stylesheets (DO NOT MODIFY unless necessary)
│   ├── print.css       # Page setup, typography, breaks
│   └── components.css  # Component definitions
├── assets/             # Static assets
│   ├── images/         # Content images
│   ├── icons/          # UI icons
│   └── fonts/          # Custom fonts
├── scripts/            # Build tooling
│   └── build.js        # HTML→PDF conversion
├── output/             # Generated PDFs (gitignored)
├── docs/               # Documentation
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
node scripts/build.js content/chapters/chapter-01-greetings.html

# Teacher version
node scripts/build.js content/chapters/chapter-01-greetings.html -v teacher

# Custom output
node scripts/build.js input.html -o output/custom-name.pdf
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

1. [ ] Create `content/chapters/chapter-XX-name.html`
2. [ ] Copy structure from `chapter-01-greetings.html`
3. [ ] Use only components from `components.css`
4. [ ] Include `.answer` spans for all exercise items
5. [ ] Include `.answer-key` at end of chapter
6. [ ] Include `.teacher-note` where appropriate
7. [ ] Test build: `node scripts/build.js content/chapters/chapter-XX.html -v student`
8. [ ] Test build: `node scripts/build.js content/chapters/chapter-XX.html -v teacher`

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
