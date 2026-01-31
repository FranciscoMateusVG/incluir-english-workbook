# Incluir English Workbook - Gotchas & Common Pitfalls

This document lists known issues, edge cases, and things that can go wrong. Read this before debugging problems.

---

## Fonts

### Gotcha: Font Not Rendering

**Symptom:** Text appears in default serif font instead of specified font.

**Causes:**
1. Font file not found
2. `@font-face` path incorrect
3. Font-family name mismatch

**Solution:**
```css
/* Ensure path is relative to CSS file location */
@font-face {
    font-family: 'CustomFont';  /* This exact name must match usage */
    src: url('../assets/fonts/CustomFont.woff2') format('woff2');
}

body {
    font-family: 'CustomFont', Georgia, serif;  /* Fallback is important */
}
```

### Gotcha: Font Looks Different in PDF vs Browser

**Symptom:** Font rendering differs between browser preview and PDF.

**Cause:** Playwright uses different text rendering than desktop browsers.

**Solution:** Use common web-safe fonts for maximum consistency:
- Serif: Georgia, Times New Roman
- Sans-serif: Arial, Helvetica

---

## Images

### Gotcha: Image Path Works in Browser but Not PDF

**Symptom:** Images show in browser but appear broken in PDF.

**Cause:** Playwright loads from `file://` URL, paths must be relative to HTML file.

**Wrong:**
```html
<img src="/assets/images/photo.png">  <!-- Absolute path fails -->
```

**Right:**
```html
<img src="../../assets/images/photo.png">  <!-- Relative to HTML file -->
```

### Gotcha: Large Images Cause Memory Issues

**Symptom:** Build script crashes or PDF is huge.

**Cause:** Images over 2000px or uncompressed PNGs.

**Solution:**
- Resize images to max 1500px width
- Use JPEG for photos (quality 80)
- Use PNG only for graphics/diagrams
- Optimal DPI for print: 150 (not 300)

### Gotcha: SVG Not Rendering

**Symptom:** SVG appears as empty box.

**Cause:** SVG uses external fonts or linked resources.

**Solution:** Embed all fonts/styles in SVG, or convert to PNG.

---

## Page Breaks

### Gotcha: page-break-inside: avoid Not Working

**Symptom:** Element still splits across pages.

**Cause:** Element is taller than page content area.

**Solution:** If element is taller than ~247mm (A4 content height), it MUST break. Split content into smaller chunks.

```html
<!-- Instead of this -->
<div class="exercise no-break">
    <!-- 30 items that can't fit on one page -->
</div>

<!-- Do this -->
<div class="exercise">
    <h4>Part A</h4>
    <!-- Items 1-15 -->
</div>
<div class="exercise">
    <h4>Part B</h4>
    <!-- Items 16-30 -->
</div>
```

### Gotcha: Unwanted Blank Pages

**Symptom:** Random blank pages in output.

**Causes:**
1. Double page breaks (before AND after)
2. Element with margin pushing to next page
3. Hidden content still taking space

**Debug:** Add temporary visible border to find culprit:
```css
* { border: 1px solid red !important; }
```

### Gotcha: Heading Alone at Page Bottom

**Symptom:** `<h2>` at bottom of page, content on next page.

**Cause:** `page-break-after: avoid` doesn't work if following element forces break.

**Solution:** Already handled in CSS, but for custom headings:
```css
.custom-heading {
    page-break-after: avoid;
    page-break-inside: avoid;
}
```

---

## CSS

### Gotcha: Styles Not Applying

**Symptom:** CSS class has no effect.

**Causes:**
1. Typo in class name
2. More specific rule overriding
3. CSS file not linked

**Debug:**
```bash
node scripts/build.js input.html -d  # Debug mode
# Inspect element in browser DevTools
```

### Gotcha: display: none Still Takes Space

**Symptom:** Hidden element creates blank space.

**Wrong:**
```css
.hidden { visibility: hidden; }  /* Still takes space */
```

**Right:**
```css
.hidden { display: none; }  /* Completely removed */
```

### Gotcha: CSS Variables Not Working in Print

**Symptom:** Colors/sizes wrong in PDF.

**Cause:** Some browsers don't support CSS variables in `@page` rules.

**Solution:** Use literal values in `@page`:
```css
@page {
    margin: 20mm 15mm 25mm 15mm;  /* Not var(--margin) */
}
```

---

## Variant System (Student/Teacher)

### Gotcha: Answers Visible in Student Version

**Symptom:** `.answer` elements showing in student PDF.

**Causes:**
1. Missing or wrong class on `<html>`
2. CSS specificity issue
3. Wrong variant flag in build

**Check:**
```html
<html class="student-version">  <!-- Must be present -->
```

**Verify build command:**
```bash
node scripts/build.js input.html -v student  # Not -v teacher
```

### Gotcha: Answer Key Split Weirdly

**Symptom:** Answer key starting mid-page or breaking badly.

**Cause:** `page-break-before: always` on `.answer-key`.

**Solution:** This is intentional - answer key always starts on new page. If you want it to flow naturally, remove the rule:
```css
.answer-key {
    page-break-before: auto;  /* Remove 'always' */
}
```

---

## HTML Content

### Gotcha: Nested Components Breaking Layout

**Symptom:** Weird visual glitches or overlapping.

**Cause:** Components nested in forbidden ways.

**Example of WRONG nesting:**
```html
<div class="callout">
    <div class="rule-box">  <!-- FORBIDDEN -->
    </div>
</div>
```

**Solution:** Check nesting rules in TEMPLATING.md.

### Gotcha: IDs Not Unique

**Symptom:** Links not working, JavaScript errors.

**Cause:** Same `id` used multiple times.

**Convention:**
- Chapters: `id="chapter-1"`, `id="chapter-2"`
- Units: `id="unit-1-1"`, `id="unit-1-2"`
- Exercises: `id="exercise-1-1"`, `id="exercise-1-2"`

### Gotcha: Special Characters Breaking HTML

**Symptom:** HTML parsing errors.

**Cause:** Unescaped `<`, `>`, `&` in content.

**Wrong:**
```html
<p>Use < and > for comparison</p>
```

**Right:**
```html
<p>Use &lt; and &gt; for comparison</p>
```

---

## Playwright/PDF

### Gotcha: Playwright Not Installed

**Symptom:** `Cannot find module 'playwright'`

**Solution:**
```bash
npm install playwright
npx playwright install chromium
```

### Gotcha: PDF Generation Hangs

**Symptom:** Script runs forever without output.

**Causes:**
1. Infinite CSS animation
2. Waiting for network resource that doesn't exist
3. JavaScript error in page

**Solution:** Run in debug mode to investigate:
```bash
node scripts/build.js input.html -d
```

### Gotcha: Header/Footer Not Appearing

**Symptom:** No headers/footers in PDF even though configured.

**Cause:** `displayHeaderFooter: true` required AND template must be valid.

**Check `build.js`:**
```javascript
{
    displayHeaderFooter: true,  // Must be true
    headerTemplate: `<div>...</div>`,  // Must have root element
    footerTemplate: `<div>...</div>`
}
```

### Gotcha: Page Numbers Wrong

**Symptom:** Page 1 of 3, Page 1 of 3, Page 1 of 3...

**Cause:** Template syntax error.

**Right:**
```html
<span class="pageNumber"></span> / <span class="totalPages"></span>
```

**Wrong:**
```html
<span class="page-number"></span>  <!-- Wrong class name -->
```

---

## File System

### Gotcha: Output Directory Not Created

**Symptom:** `ENOENT: no such file or directory`

**Cause:** `output/` directory doesn't exist.

**Solution:** The build script creates it automatically, but if manually specifying path:
```bash
mkdir -p output/chapters
node scripts/build.js input.html -o output/chapters/ch1.pdf
```

### Gotcha: Permission Denied

**Symptom:** Cannot write to output file.

**Causes:**
1. File is open in another program
2. Directory is read-only
3. Running without proper permissions

**Solution:** Close PDF viewers, check permissions.

---

## Performance

### Gotcha: Build Taking Too Long

**Symptom:** Each PDF takes 30+ seconds.

**Causes:**
1. Very large images
2. Complex CSS (many shadows, gradients)
3. External resources being fetched

**Solutions:**
- Optimize images
- Simplify CSS effects for print
- Ensure all resources are local

### Gotcha: Memory Error

**Symptom:** `JavaScript heap out of memory`

**Cause:** Processing too many large files at once.

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" node scripts/build.js input.html
```

---

## Debugging Checklist

When something goes wrong:

1. [ ] Run in debug mode: `node scripts/build.js input.html -d`
2. [ ] Check browser console for errors
3. [ ] Verify HTML is valid (no unclosed tags)
4. [ ] Verify CSS is linked correctly
5. [ ] Check file paths are relative
6. [ ] Test with minimal content first
7. [ ] Check this document for known gotchas
