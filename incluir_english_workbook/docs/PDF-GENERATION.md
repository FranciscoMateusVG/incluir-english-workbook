# Incluir English Workbook - PDF Generation Guide

## Quick Start

### 1. Install Dependencies

```bash
cd incluir_english_workbook
npm install
npm run install:playwright
```

### 2. Generate a PDF

```bash
# Student version (default)
node scripts/build.js content/chapters/chapter-01-greetings.html

# Teacher version
node scripts/build.js content/chapters/chapter-01-greetings.html -v teacher

# Custom output path
node scripts/build.js content/chapters/chapter-01-greetings.html -o output/my-chapter.pdf
```

### 3. Output Location

PDFs are saved to `output/` directory by default:
- `output/chapter-01-greetings-student.pdf`
- `output/chapter-01-greetings-teacher.pdf`

---

## Build Script Reference

### Command Syntax

```bash
node scripts/build.js <input.html> [options]
```

### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output PDF path | `output/<filename>-<variant>.pdf` |
| `--variant` | `-v` | Version: `student` or `teacher` | `student` |
| `--format` | `-f` | Page format: `A4` or `Letter` | `A4` |
| `--debug` | `-d` | Keep browser open for debugging | `false` |

### Examples

```bash
# Basic usage
node scripts/build.js content/chapters/chapter-01.html

# Teacher edition
node scripts/build.js content/chapters/chapter-01.html -v teacher

# Custom output
node scripts/build.js content/chapters/chapter-01.html -o ~/Desktop/workbook.pdf

# US Letter format
node scripts/build.js content/chapters/chapter-01.html -f Letter

# Debug mode (browser stays open)
node scripts/build.js content/chapters/chapter-01.html -d
```

---

## PDF Configuration

The build script uses these settings (defined in `scripts/build.js`):

### Page Setup

```javascript
{
    format: 'A4',              // or 'Letter'
    printBackground: true,      // Include background colors
    preferCSSPageSize: true,    // Respect @page CSS rules
    margin: {
        top: '20mm',
        right: '15mm',
        bottom: '25mm',
        left: '15mm'
    }
}
```

### Headers and Footers

Headers and footers are rendered by Playwright, not CSS:

```javascript
headerTemplate: `
    <div style="font-size: 9px; width: 100%; padding: 0 15mm;">
        <span style="float: left;">Incluir English Workbook</span>
    </div>
`,
footerTemplate: `
    <div style="font-size: 9px; width: 100%; text-align: center;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
    </div>
`
```

**Special variables in templates:**
- `<span class="pageNumber"></span>` - Current page
- `<span class="totalPages"></span>` - Total pages
- `<span class="title"></span>` - Document title
- `<span class="url"></span>` - Document URL
- `<span class="date"></span>` - Current date

---

## Pagination Best Practices

### Preventing Page Breaks Inside Elements

These components automatically avoid splitting:

```css
.exercise { page-break-inside: avoid; }
.callout { page-break-inside: avoid; }
.rule-box { page-break-inside: avoid; }
.example { page-break-inside: avoid; }
.dialogue-block { page-break-inside: avoid; }
```

**For custom elements:**
```html
<div class="no-break">
    <!-- Content that should stay together -->
</div>
```

### Forcing Page Breaks

```html
<!-- Force break before -->
<section class="unit page-break-before">

<!-- Force break after -->
<div class="page-break-after">
```

### Handling Long Tables

Tables can break across pages by default. To keep rows together:

```css
tr { page-break-inside: avoid; }
thead { display: table-header-group; }  /* Repeat header on each page */
```

For tables that MUST stay on one page:
```html
<div class="no-break">
    <table>...</table>
</div>
```

### Orphans and Widows

CSS controls minimum lines at page breaks:

```css
p {
    orphans: 3;  /* Min lines at bottom of page */
    widows: 3;   /* Min lines at top of page */
}
```

---

## Troubleshooting

### Problem: Fonts Look Wrong

**Cause:** System fonts not available
**Solution:** Use web-safe fonts or embed custom fonts

```css
@font-face {
    font-family: 'CustomFont';
    src: url('../assets/fonts/custom.woff2') format('woff2');
    font-weight: normal;
    font-style: normal;
}
```

### Problem: Images Not Appearing

**Cause:** Incorrect path or image not found
**Solution:** Use relative paths from HTML file location

```html
<!-- If HTML is in content/chapters/ -->
<img src="../../assets/images/photo.png" alt="Description">
```

### Problem: Content Cut Off at Page Edge

**Cause:** Margins too small or content too wide
**Solution:** Check PDF margins match CSS `@page` margins

```css
@page {
    margin: 20mm 15mm 25mm 15mm;
}
```

### Problem: Exercise Split Across Pages

**Cause:** Element too tall for `page-break-inside: avoid`
**Solution:** Split into smaller logical chunks

```html
<!-- Instead of one giant exercise -->
<div class="exercise"><!-- 20 items --></div>

<!-- Split into parts -->
<div class="exercise"><!-- Items 1-10 --></div>
<div class="exercise"><!-- Items 11-20 --></div>
```

### Problem: Blank Pages Appearing

**Cause:** `page-break-before: always` followed by `page-break-after: always`
**Solution:** Only use one or the other

### Problem: Colors Look Different in Print

**Cause:** RGB colors not CMYK-safe
**Solution:** Use CMYK-safe colors defined in CSS variables

```css
:root {
    --color-accent: #2c5aa0;  /* Safe blue */
    --color-success: #2e7d32; /* Safe green */
}
```

---

## Debug Mode

Run with `-d` flag to troubleshoot:

```bash
node scripts/build.js chapter.html -d
```

This keeps the browser open so you can:
1. Inspect the DOM
2. Check CSS application
3. See console errors
4. Test different viewport sizes

Press `Ctrl+C` to close when done.

---

## Batch Building

For building multiple chapters:

```bash
# Simple loop
for file in content/chapters/*.html; do
    node scripts/build.js "$file" -v student
    node scripts/build.js "$file" -v teacher
done
```

Or create a batch script:

```javascript
// scripts/build-all.js
const { execSync } = require('child_process');
const glob = require('glob');

const chapters = glob.sync('content/chapters/*.html');
for (const chapter of chapters) {
    execSync(`node scripts/build.js "${chapter}" -v student`);
    execSync(`node scripts/build.js "${chapter}" -v teacher`);
}
```

---

## Performance Tips

1. **Optimize images** - Use 150 DPI for print (300 DPI unnecessary for workbooks)
2. **Limit custom fonts** - Each font adds loading time
3. **Avoid complex SVGs** - Can slow rendering
4. **Test incrementally** - Build chapters individually during development
