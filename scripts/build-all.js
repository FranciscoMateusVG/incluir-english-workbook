#!/usr/bin/env node

/**
 * ============================================================================
 * INCLUIR ENGLISH WORKBOOK - BUILD ALL CHAPTERS INTO ONE PDF
 * ============================================================================
 *
 * Combines all chapter HTML files into a single PDF workbook.
 *
 * USAGE:
 *   node scripts/build-all.js -b <book> [options]
 *
 * OPTIONS:
 *   --book, -b      Book level (required): "b1", "b2", "b3", or "b4"
 *   --output, -o    Output PDF path (default: output/<book>/workbook-<book>-<variant>.pdf)
 *   --variant, -v   Version variant: "student" or "teacher" (default: student)
 *   --format, -f    Page format: "A4" or "Letter" (default: A4)
 *
 * EXAMPLES:
 *   node scripts/build-all.js -b b4
 *   node scripts/build-all.js -b b4 -v teacher
 *   node scripts/build-all.js -b b4 -v student -o output/full-workbook.pdf
 *
 * ============================================================================
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PROJECT_ROOT = path.resolve(__dirname, '..');
const STYLES_DIR = path.join(PROJECT_ROOT, 'styles');
const VALID_BOOKS = ['b0', 'b1', 'b2', 'b3', 'b4'];

const CONFIG = {
    pdf: {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
            top: '20mm',
            right: '15mm',
            bottom: '25mm',
            left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: `
            <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; padding: 0 15mm; color: #666;">
                <span style="float: left;">Incluir English Workbook</span>
            </div>
        `,
        // Note: headerTemplate is overridden in buildAll() with book-specific text
        footerTemplate: `
            <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; text-align: center; color: #666;">
                <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
        `
    },
    browser: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    viewport: {
        width: 794,
        height: 1123
    }
};

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        book: null,
        output: null,
        variant: 'student',
        format: 'A4'
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--book' || arg === '-b') {
            options.book = args[++i];
        } else if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        } else if (arg === '--variant' || arg === '-v') {
            options.variant = args[++i];
        } else if (arg === '--format' || arg === '-f') {
            options.format = args[++i];
        }
    }

    if (!options.book) {
        console.error('Error: --book / -b is required (e.g., b1, b2, b3, b4)');
        process.exit(1);
    }

    if (!VALID_BOOKS.includes(options.book)) {
        console.error(`Error: Book must be one of: ${VALID_BOOKS.join(', ')}`);
        process.exit(1);
    }

    if (!['student', 'teacher'].includes(options.variant)) {
        console.error('Error: Variant must be "student" or "teacher"');
        process.exit(1);
    }

    const outputDir = path.join(PROJECT_ROOT, 'output', options.book);
    if (!options.output) {
        options.output = path.join(outputDir, `workbook-${options.book}-${options.variant}.pdf`);
    }

    return options;
}

// =============================================================================
// CHAPTER DISCOVERY & CONTENT EXTRACTION
// =============================================================================

function getChapterFiles(book) {
    const chaptersDir = path.join(PROJECT_ROOT, 'content', book, 'chapters');
    if (!fs.existsSync(chaptersDir)) {
        console.error(`Error: Chapters directory not found: ${chaptersDir}`);
        process.exit(1);
    }

    const files = fs.readdirSync(chaptersDir)
        .filter(f => f.match(/^chapter-\d+-.*\.html$/))
        .sort();

    if (files.length === 0) {
        console.error('Error: No chapter files found in', chaptersDir);
        process.exit(1);
    }

    return files.map(f => path.join(chaptersDir, f));
}

function extractBodyContent(html) {
    // Extract everything inside <main class="workbook-content">...</main>
    const mainMatch = html.match(/<main\s+class="workbook-content">([\s\S]*?)<\/main>/);
    if (mainMatch) {
        return mainMatch[1].trim();
    }
    // Fallback: extract <body> content
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
    return bodyMatch ? bodyMatch[1].trim() : html;
}

// =============================================================================
// COMBINED HTML GENERATION
// =============================================================================

function buildCombinedHTML(chapterFiles, variant) {
    const printCSS = fs.readFileSync(path.join(STYLES_DIR, 'print.css'), 'utf-8');
    const componentsCSS = fs.readFileSync(path.join(STYLES_DIR, 'components.css'), 'utf-8');

    const chapterContents = chapterFiles.map((filePath, index) => {
        const html = fs.readFileSync(filePath, 'utf-8');
        const content = extractBodyContent(html);
        const fileName = path.basename(filePath);
        // Add a page break before each chapter (except the first)
        const pageBreak = index > 0 ? '<div style="page-break-before: always;"></div>' : '';
        return `${pageBreak}\n<!-- ${fileName} -->\n${content}`;
    });

    return `<!DOCTYPE html>
<html lang="en" class="${variant}-version">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Incluir English Workbook</title>
    <style>${printCSS}</style>
    <style>${componentsCSS}</style>
</head>
<body>
    <main class="workbook-content">
        ${chapterContents.join('\n')}
    </main>
</body>
</html>`;
}

// =============================================================================
// MAIN BUILD FUNCTION
// =============================================================================

async function buildAll(options) {
    const bookLabel = options.book.toUpperCase();
    console.log('='.repeat(60));
    console.log(`INCLUIR ENGLISH WORKBOOK — ${bookLabel} - FULL WORKBOOK BUILD`);
    console.log('='.repeat(60));
    console.log(`Book:    ${options.book}`);
    console.log(`Variant: ${options.variant}`);
    console.log(`Format:  ${options.format}`);
    console.log(`Output:  ${options.output}`);
    console.log('='.repeat(60));

    // Discover chapters
    const chapterFiles = getChapterFiles(options.book);
    console.log(`\nFound ${chapterFiles.length} chapters:`);
    chapterFiles.forEach(f => console.log(`  - ${path.basename(f)}`));

    // Build combined HTML
    console.log('\nCombining chapters...');
    const combinedHTML = buildCombinedHTML(chapterFiles, options.variant);

    // Write temp file next to chapter sources so ../../../assets/... image paths resolve
    // (same base URL as single-chapter builds; project-root temp file broke relative src)
    const chaptersDir = path.join(PROJECT_ROOT, 'content', options.book, 'chapters');
    const tempFile = path.join(chaptersDir, `.tmp-workbook-${options.book}.html`);
    fs.writeFileSync(tempFile, combinedHTML, 'utf-8');

    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Launch browser and generate PDF
    console.log('Launching browser...');
    const browser = await chromium.launch(CONFIG.browser);

    try {
        const context = await browser.newContext({ viewport: CONFIG.viewport });
        const page = await context.newPage();

        const fileUrl = `file://${tempFile}`;
        console.log('Loading combined HTML...');
        await page.goto(fileUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(500);

        console.log('Generating PDF...');
        const pdfOptions = {
            ...CONFIG.pdf,
            format: options.format,
            path: options.output
        };

        // Always include book level in header
        if (options.variant === 'teacher') {
            pdfOptions.headerTemplate = `
                <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; padding: 0 15mm; color: #666;">
                    <span style="float: left;">Incluir English Workbook — ${bookLabel}</span>
                    <span style="float: right; color: #f57c00; font-weight: bold;">TEACHER EDITION</span>
                </div>
            `;
        } else {
            pdfOptions.headerTemplate = `
                <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; padding: 0 15mm; color: #666;">
                    <span style="float: left;">Incluir English Workbook — ${bookLabel}</span>
                </div>
            `;
        }

        await page.pdf(pdfOptions);

        const stats = fs.statSync(options.output);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`\nPDF generated successfully!`);
        console.log(`Output: ${path.resolve(options.output)}`);
        console.log(`Size: ${fileSizeMB} MB`);

    } catch (error) {
        console.error('\nError during PDF generation:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await browser.close();
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }
    }
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const options = parseArgs();
buildAll(options).catch(console.error);
