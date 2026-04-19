#!/usr/bin/env node

/**
 * ============================================================================
 * INCLUIR ENGLISH WORKBOOK - PDF BUILD SCRIPT
 * ============================================================================
 *
 * This script converts HTML content to PDF using Playwright.
 *
 * USAGE:
 *   node scripts/build.js <input.html> [options]
 *
 * OPTIONS:
 *   --output, -o    Output PDF path (default: same name as input with .pdf)
 *   --variant, -v   Version variant: "student" or "teacher" (default: student)
 *   --book, -b      Book level: "b1", "b2", "b3", or "b4" (optional)
 *   --format, -f    Page format: "A4" or "Letter" (default: A4)
 *   --debug, -d     Keep browser open for debugging
 *
 * EXAMPLES:
 *   node scripts/build.js content/b4/chapters/chapter-01-tenses.html -b b4
 *   node scripts/build.js content/b4/chapters/chapter-01-tenses.html -b b4 -v teacher -o output/b4/ch1-teacher.pdf
 *   node scripts/build.js content/full-workbook.html --variant student --output output/workbook-student.pdf
 *
 * REQUIREMENTS:
 *   - Node.js 18+
 *   - Playwright: npm install playwright
 *
 * ============================================================================
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CONFIG = {
    // PDF settings
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
                <span style="float: right;"></span>
            </div>
        `,
        footerTemplate: `
            <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; text-align: center; color: #666;">
                <span class="pageNumber"></span> / <span class="totalPages"></span>
            </div>
        `
    },
    // Browser settings
    browser: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    // Viewport (affects rendering)
    viewport: {
        width: 794,  // A4 width at 96 DPI
        height: 1123 // A4 height at 96 DPI
    }
};

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        input: null,
        output: null,
        variant: 'student',
        book: null,
        format: 'A4',
        debug: false
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg === '--output' || arg === '-o') {
            options.output = args[++i];
        } else if (arg === '--variant' || arg === '-v') {
            options.variant = args[++i];
        } else if (arg === '--book' || arg === '-b') {
            options.book = args[++i];
        } else if (arg === '--format' || arg === '-f') {
            options.format = args[++i];
        } else if (arg === '--debug' || arg === '-d') {
            options.debug = true;
        } else if (!arg.startsWith('-')) {
            options.input = arg;
        }
    }

    if (options.book && !['b0', 'b1', 'b2', 'b3', 'b4'].includes(options.book)) {
        console.error('Error: Book must be one of: b0, b1, b2, b3, b4');
        process.exit(1);
    }

    // Validate
    if (!options.input) {
        console.error('Error: No input file specified');
        console.error('Usage: node build.js <input.html> [options]');
        process.exit(1);
    }

    if (!fs.existsSync(options.input)) {
        console.error(`Error: Input file not found: ${options.input}`);
        process.exit(1);
    }

    if (!['student', 'teacher'].includes(options.variant)) {
        console.error('Error: Variant must be "student" or "teacher"');
        process.exit(1);
    }

    // Default output path
    if (!options.output) {
        const inputPath = path.parse(options.input);
        const outputBase = options.book ? path.join('output', options.book) : 'output';
        options.output = path.join(
            outputBase,
            `${inputPath.name}-${options.variant}.pdf`
        );
    }

    return options;
}

// =============================================================================
// MAIN BUILD FUNCTION
// =============================================================================

async function buildPDF(options) {
    console.log('='.repeat(60));
    console.log('INCLUIR ENGLISH WORKBOOK - PDF BUILD');
    console.log('='.repeat(60));
    console.log(`Input:   ${options.input}`);
    console.log(`Output:  ${options.output}`);
    console.log(`Variant: ${options.variant}`);
    console.log(`Format:  ${options.format}`);
    console.log('='.repeat(60));

    // Ensure output directory exists
    const outputDir = path.dirname(options.output);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
        console.log(`Created output directory: ${outputDir}`);
    }

    // Launch browser
    console.log('\nLaunching browser...');
    const browser = await chromium.launch({
        headless: !options.debug,
        ...CONFIG.browser
    });

    try {
        const context = await browser.newContext({
            viewport: CONFIG.viewport
        });
        const page = await context.newPage();

        // Load the HTML file
        const inputPath = path.resolve(options.input);
        const fileUrl = `file://${inputPath}`;
        console.log(`Loading: ${fileUrl}`);

        await page.goto(fileUrl, {
            waitUntil: 'networkidle'
        });

        // Set the variant class on <html>
        console.log(`Setting variant: ${options.variant}-version`);
        await page.evaluate((variant) => {
            document.documentElement.classList.remove('student-version', 'teacher-version');
            document.documentElement.classList.add(`${variant}-version`);
        }, options.variant);

        // Wait for fonts and images to load
        console.log('Waiting for resources...');
        await page.waitForLoadState('networkidle');

        // Additional wait for any CSS transitions/renders
        await page.waitForTimeout(500);

        // Generate PDF
        console.log('Generating PDF...');
        const pdfOptions = {
            ...CONFIG.pdf,
            format: options.format,
            path: options.output
        };

        // Customize header with book level and/or teacher edition
        const headerTitle = options.book
            ? `Incluir English Workbook — ${options.book.toUpperCase()}`
            : 'Incluir English Workbook';

        if (options.variant === 'teacher') {
            pdfOptions.headerTemplate = `
                <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; padding: 0 15mm; color: #666;">
                    <span style="float: left;">${headerTitle}</span>
                    <span style="float: right; color: #f57c00; font-weight: bold;">TEACHER EDITION</span>
                </div>
            `;
        } else if (options.book) {
            pdfOptions.headerTemplate = `
                <div style="font-size: 9px; font-family: Arial, sans-serif; width: 100%; padding: 0 15mm; color: #666;">
                    <span style="float: left;">${headerTitle}</span>
                    <span style="float: right;"></span>
                </div>
            `;
        }

        await page.pdf(pdfOptions);

        console.log(`\nPDF generated successfully!`);
        console.log(`Output: ${path.resolve(options.output)}`);

        // Get file size
        const stats = fs.statSync(options.output);
        const fileSizeKB = (stats.size / 1024).toFixed(2);
        console.log(`Size: ${fileSizeKB} KB`);

        if (options.debug) {
            console.log('\nDebug mode: Browser left open. Press Ctrl+C to exit.');
            await new Promise(() => {}); // Keep running
        }

    } catch (error) {
        console.error('\nError during PDF generation:');
        console.error(error.message);
        process.exit(1);
    } finally {
        if (!options.debug) {
            await browser.close();
        }
    }
}

// =============================================================================
// BATCH BUILD FUNCTION
// =============================================================================

async function buildAll() {
    /**
     * Build all chapters into a single PDF.
     * This function can be extended to:
     * - Concatenate multiple HTML files
     * - Generate table of contents
     * - Add cover page
     */
    console.log('Batch build not yet implemented.');
    console.log('Use the single-file build for now.');
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const options = parseArgs();
buildPDF(options).catch(console.error);
