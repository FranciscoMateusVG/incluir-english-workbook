#!/usr/bin/env node

/**
 * ============================================================================
 * INCLUIR ENGLISH WORKBOOK - PUBLISH SCRIPT
 * ============================================================================
 *
 * Full pipeline: builds both student and teacher workbooks with cover,
 * student manual, summary (with page numbers), and all chapters — then
 * compresses for B&W printing.
 *
 * USAGE:
 *   node scripts/publish.js -b <book> [options]
 *
 * OPTIONS:
 *   --book, -b       Book level (required): "b1", "b2", "b3", or "b4"
 *   --variant, -v    Build only one variant: "student" or "teacher" (default: both)
 *   --no-compress    Skip Ghostscript compression (keep full-color, high-res)
 *   --color          Compress but keep color (don't convert to grayscale)
 *   --dpi <n>        Image resolution for compression (default: 150)
 *   --format, -f     Page format: "A4" or "Letter" (default: A4)
 *
 * EXAMPLES:
 *   node scripts/publish.js -b b4                    # Both variants, compressed B&W
 *   node scripts/publish.js -b b4 -v student         # Student only
 *   node scripts/publish.js -b b4 --no-compress      # Full quality, color
 *   node scripts/publish.js -b b4 --color --dpi 200  # Compressed but color
 *
 * REQUIREMENTS:
 *   - Node.js 18+
 *   - Playwright: npm install playwright
 *   - Ghostscript (gs): brew install ghostscript
 *   - Poppler (pdfunite): brew install poppler
 *
 * FRONT MATTER:
 *   Place these files in assets/frontmatter/<book>/:
 *     - cover.pdf    — Cover page
 *     - manual.pdf   — Student manual (rights, duties, etc.)
 *   Place the summary HTML in content/<book>/summary.html
 *
 * ============================================================================
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        book: null,
        variant: null, // null = both
        compress: true,
        grayscale: true,
        dpi: 150,
        format: 'A4'
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--book' || arg === '-b') options.book = args[++i];
        else if (arg === '--variant' || arg === '-v') options.variant = args[++i];
        else if (arg === '--no-compress') options.compress = false;
        else if (arg === '--color') options.grayscale = false;
        else if (arg === '--dpi') options.dpi = parseInt(args[++i], 10);
        else if (arg === '--format' || arg === '-f') options.format = args[++i];
    }

    if (!options.book) {
        console.error('Error: --book / -b is required (e.g., b1, b2, b3, b4)');
        process.exit(1);
    }

    if (!['b0', 'b1', 'b2', 'b3', 'b4'].includes(options.book)) {
        console.error('Error: Book must be one of: b0, b1, b2, b3, b4');
        process.exit(1);
    }

    if (options.variant && !['student', 'teacher'].includes(options.variant)) {
        console.error('Error: Variant must be "student" or "teacher"');
        process.exit(1);
    }

    return options;
}

// =============================================================================
// HELPERS
// =============================================================================

function run(cmd, label) {
    console.log(`  ${label}...`);
    try {
        execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'pipe', timeout: 300000 });
    } catch (err) {
        console.error(`  FAILED: ${label}`);
        console.error(err.stderr?.toString() || err.message);
        process.exit(1);
    }
}

function fileSize(filePath) {
    const stats = fs.statSync(filePath);
    const mb = stats.size / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(stats.size / 1024).toFixed(0)} KB`;
}

function checkDependency(cmd, name, installHint) {
    try {
        execSync(`which ${cmd}`, { stdio: 'pipe' });
    } catch {
        console.error(`Error: ${name} is not installed.`);
        console.error(`  Install with: ${installHint}`);
        process.exit(1);
    }
}

// =============================================================================
// PIPELINE
// =============================================================================

function publish(options) {
    const book = options.book;
    const bookLabel = book.toUpperCase();
    const variants = options.variant ? [options.variant] : ['student', 'teacher'];
    const outputDir = path.join(PROJECT_ROOT, 'output', book);
    const frontmatterDir = path.join(PROJECT_ROOT, 'assets', 'frontmatter', book);
    const summaryHtml = path.join(PROJECT_ROOT, 'content', book, 'summary.html');

    console.log('');
    console.log('='.repeat(60));
    console.log(`  PUBLISH — ${bookLabel}`);
    console.log('='.repeat(60));
    console.log(`  Variants:  ${variants.join(', ')}`);
    console.log(`  Compress:  ${options.compress ? `yes (${options.grayscale ? 'grayscale' : 'color'}, ${options.dpi} DPI)` : 'no'}`);
    console.log('='.repeat(60));
    console.log('');

    // --- Check dependencies ---
    checkDependency('pdfunite', 'pdfunite (poppler)', 'brew install poppler');
    if (options.compress) {
        checkDependency('gs', 'Ghostscript', 'brew install ghostscript');
    }

    // --- Check front matter files ---
    const coverPdf = path.join(frontmatterDir, 'cover.pdf');
    const manualPdf = path.join(frontmatterDir, 'manual.pdf');

    const hasCover = fs.existsSync(coverPdf);
    const hasManual = fs.existsSync(manualPdf);
    const hasSummary = fs.existsSync(summaryHtml);

    if (!hasCover) console.log(`  ⚠ No cover found at ${coverPdf} — skipping`);
    if (!hasManual) console.log(`  ⚠ No manual found at ${manualPdf} — skipping`);
    if (!hasSummary) console.log(`  ⚠ No summary found at ${summaryHtml} — skipping`);

    // Ensure output dir
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // --- Step 1: Build summary PDF (if exists) ---
    const summaryPdf = path.join(outputDir, 'summary.pdf');
    if (hasSummary) {
        console.log('[1/4] Building summary page...');
        run(
            `node scripts/build.js "${summaryHtml}" -o "${summaryPdf}"`,
            'Rendering summary HTML to PDF'
        );
        console.log(`  ✓ Summary: ${fileSize(summaryPdf)}`);
    }
    console.log('');

    // --- Step 2: Build content PDFs ---
    console.log('[2/4] Building chapter content...');
    for (const variant of variants) {
        const contentPdf = path.join(outputDir, `content-${variant}.pdf`);
        run(
            `node scripts/build-all.js -b ${book} -v ${variant} -o "${contentPdf}"`,
            `Building ${variant} content`
        );
        console.log(`  ✓ ${variant} content: ${fileSize(contentPdf)}`);
    }
    console.log('');

    // --- Step 3: Merge PDFs ---
    console.log('[3/4] Merging front matter + content...');
    for (const variant of variants) {
        const contentPdf = path.join(outputDir, `content-${variant}.pdf`);
        const mergedPdf = path.join(outputDir, `merged-${variant}.pdf`);

        // Build the list of PDFs to merge in order
        const parts = [];
        if (hasCover) parts.push(`"${coverPdf}"`);
        if (hasManual) parts.push(`"${manualPdf}"`);
        if (hasSummary) parts.push(`"${summaryPdf}"`);
        parts.push(`"${contentPdf}"`);

        run(
            `pdfunite ${parts.join(' ')} "${mergedPdf}"`,
            `Merging ${variant} book`
        );
        console.log(`  ✓ ${variant} merged: ${fileSize(mergedPdf)}`);
    }
    console.log('');

    // --- Step 4: Compress (optional) ---
    console.log('[4/4] Finalizing...');
    for (const variant of variants) {
        const mergedPdf = path.join(outputDir, `merged-${variant}.pdf`);
        const finalPdf = path.join(outputDir, `workbook-${book}-${variant}.pdf`);

        if (options.compress) {
            const gsArgs = [
                'gs',
                '-sDEVICE=pdfwrite',
                '-dCompatibilityLevel=1.4',
                '-dPDFSETTINGS=/ebook',
                `-dDownsampleColorImages=true -dColorImageResolution=${options.dpi}`,
                `-dDownsampleGrayImages=true -dGrayImageResolution=${options.dpi}`,
                `-dDownsampleMonoImages=true -dMonoImageResolution=${options.dpi * 2}`,
                '-dNOPAUSE -dBATCH -dQUIET',
            ];

            if (options.grayscale) {
                gsArgs.push('-dColorConversionStrategy=/Gray');
                gsArgs.push('-dProcessColorModel=/DeviceGray');
            }

            gsArgs.push(`-sOutputFile="${finalPdf}"`);
            gsArgs.push(`"${mergedPdf}"`);

            run(gsArgs.join(' '), `Compressing ${variant} (${options.grayscale ? 'grayscale' : 'color'}, ${options.dpi} DPI)`);
        } else {
            // No compression — just rename
            fs.renameSync(mergedPdf, finalPdf);
        }

        console.log(`  ✓ ${variant} final: ${fileSize(finalPdf)}`);
    }

    // --- Cleanup temp files ---
    console.log('');
    console.log('Cleaning up intermediate files...');
    for (const variant of variants) {
        const contentPdf = path.join(outputDir, `content-${variant}.pdf`);
        const mergedPdf = path.join(outputDir, `merged-${variant}.pdf`);
        if (fs.existsSync(contentPdf)) fs.unlinkSync(contentPdf);
        if (fs.existsSync(mergedPdf)) fs.unlinkSync(mergedPdf);
    }

    // --- Done ---
    console.log('');
    console.log('='.repeat(60));
    console.log('  DONE');
    console.log('='.repeat(60));
    for (const variant of variants) {
        const finalPdf = path.join(outputDir, `workbook-${book}-${variant}.pdf`);
        console.log(`  📄 ${variant}: ${path.resolve(finalPdf)} (${fileSize(finalPdf)})`);
    }
    console.log('='.repeat(60));
    console.log('');
}

// =============================================================================
// ENTRY POINT
// =============================================================================

const options = parseArgs();
publish(options);
