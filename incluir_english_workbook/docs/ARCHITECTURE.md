# Incluir English Workbook - Architecture

## Overview

This system generates professional, printable PDF workbooks from HTML content using a strict component-based approach. The architecture prioritizes:

1. **Simplicity** - Minimal dependencies, clear structure
2. **Determinism** - Same input always produces same output
3. **AI-Friendliness** - Clear rules that AI agents can follow
4. **Print Quality** - Output looks like a real workbook, not a webpage

## System Architecture

```
incluir_english_workbook/
├── templates/           # Base HTML templates
│   ├── base.html       # Standard page template
│   ├── cover.html      # Cover page template
│   └── toc.html        # Table of contents template
├── content/            # Actual workbook content
│   ├── chapters/       # Chapter HTML files
│   └── units/          # (Optional) standalone units
├── styles/             # CSS stylesheets
│   ├── print.css       # Page setup, typography, breaks
│   └── components.css  # Component definitions
├── assets/             # Static assets
│   ├── images/         # Content images
│   ├── icons/          # UI icons
│   └── fonts/          # Custom fonts (if any)
├── scripts/            # Build tooling
│   └── build.js        # HTML→PDF conversion
├── output/             # Generated PDFs
├── docs/               # Documentation
└── package.json        # Dependencies
```

## Data Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Agent      │────▶│   HTML Files    │────▶│   Playwright    │
│   (generates)   │     │   (content)     │     │   (renders)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   PDF Output    │◀────│   CSS Styles    │
                        │   (final)       │     │   (formatting)  │
                        └─────────────────┘     └─────────────────┘
```

## Key Design Decisions

### 1. HTML as Single Source of Truth

**Why HTML?**
- Universal, well-understood format
- AI models are highly trained on HTML
- Can be previewed in any browser
- CSS provides precise print control

**Why NOT other formats?**
- Markdown: Limited control over layout
- LaTeX: Steep learning curve, AI less familiar
- Word/DOCX: Binary format, hard to diff/merge

### 2. Playwright for PDF Generation

**Why Playwright over Puppeteer?**

| Feature | Playwright | Puppeteer |
|---------|------------|-----------|
| Maintenance | Microsoft-backed, active | Google-backed, slower updates |
| Browser support | Chromium, Firefox, WebKit | Chromium only |
| Auto-wait | Built-in smart waiting | Manual waits needed |
| Installation | Single command | More complex |
| API stability | More stable | Breaking changes |

**Recommendation: Use Playwright.**

### 3. CSS-Based Variant Toggle

Instead of generating two separate HTML files, we use a single HTML file with CSS classes to control visibility:

```html
<html class="student-version">  <!-- or "teacher-version" -->
```

**Benefits:**
- Single source of truth for content
- Impossible for versions to get out of sync
- Easy to toggle programmatically

### 4. Component-Based Content

All content uses predefined CSS classes from `components.css`. This provides:
- Consistent styling across all chapters
- Clear contract for AI content generation
- Easy to validate content correctness

## File Responsibilities

### templates/base.html
- Defines page structure (header, content, footer)
- Sets up CSS links
- Contains variant toggle documentation

### styles/print.css
- `@page` rules for A4 sizing
- Typography (fonts, sizes, line heights)
- Page break rules
- Header/footer positioning

### styles/components.css
- All component definitions
- Nesting rules documentation
- Variant visibility rules (student/teacher)

### scripts/build.js
- Command-line interface
- Playwright browser automation
- PDF generation with correct settings

## Variant System (Student vs Teacher)

The same HTML file generates both versions:

| Content | Student Version | Teacher Version |
|---------|-----------------|-----------------|
| Lessons | ✓ Visible | ✓ Visible |
| Exercises | ✓ Visible | ✓ Visible |
| `.answer` | ✗ Hidden | ✓ Visible |
| `.answer-key` | ✗ Hidden | ✓ Visible |
| `.teacher-note` | ✗ Hidden | ✓ Visible |

**Implementation:**
```css
/* In components.css */
html:not(.teacher-version) .answer { display: none !important; }
html.teacher-version .answer { display: inline; }
```

## Extension Points

### Adding New Components
1. Define in `components.css` with clear documentation
2. Add to component index
3. Document nesting rules
4. Update `TEMPLATING.md`

### Adding New Chapter
1. Create `content/chapters/chapter-XX-name.html`
2. Use components from `components.css`
3. Follow structure from existing chapters
4. Build with `node scripts/build.js`

### Custom Fonts
1. Add font files to `assets/fonts/`
2. Add `@font-face` rules to `print.css`
3. Update CSS variables

## Performance Considerations

- **PDF size:** Keep images optimized (150 DPI sufficient for print)
- **Build time:** Typically 2-5 seconds per chapter
- **Memory:** Playwright uses ~200MB during rendering

## Security Notes

- HTML files are local only (no external resources)
- No JavaScript execution in content (static HTML)
- Playwright runs in sandboxed mode
