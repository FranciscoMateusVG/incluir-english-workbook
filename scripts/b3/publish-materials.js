#!/usr/bin/env node
// Publish all B3 materials to portal/downloads/b3/ as student+teacher PDFs.
// Modeled on scripts/b4/publish-materials.js, extended to cover the
// complementary material (review worksheet + end-of-level test), which for
// B4 was produced via the legacy scripts/b4/legacy/assemble-review.js flow.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const contentDir = path.join(projectRoot, 'content', 'b3');
const outputDir = path.join(projectRoot, 'output', 'b3', 'materials');
const portalDir = path.join(projectRoot, 'portal', 'downloads', 'b3');

const materials = [
    { slug: 'chapter-practice-homework', group: 'exercises', source: 'exercises/chapter-practice-homework.html' },
    { slug: 'review-worksheet', group: 'complementary-material', source: 'complementary-material/review-worksheet.html' },
    { slug: 'end-of-level-test', group: 'complementary-material', source: 'complementary-material/end-of-level-test.html' }
];

fs.mkdirSync(outputDir, { recursive: true });
fs.mkdirSync(portalDir, { recursive: true });

function run(command, args, label) {
    process.stdout.write(`${label}... `);
    const result = spawnSync(command, args, {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
    });

    if (result.status !== 0) {
        process.stdout.write('FAILED\n');
        process.stderr.write(result.stderr || result.stdout || `Command exited with ${result.status}\n`);
        process.exit(result.status || 1);
    }

    process.stdout.write('done\n');
}

// Re-assemble the review worksheet from its parts before rendering.
run(process.execPath, ['scripts/b3/assemble-review.js'], 'Assemble review worksheet');

for (const { slug, group, source } of materials) {
    for (const variant of ['student', 'teacher']) {
        const sourceFile = path.join(contentDir, source);
        const groupOutputDir = path.join(outputDir, group);
        const groupPortalDir = path.join(portalDir, group);
        const rawPdf = path.join(groupOutputDir, `${slug}-${variant}-raw.pdf`);
        const finalPdf = path.join(groupPortalDir, `${slug}-${variant}.pdf`);

        fs.mkdirSync(groupOutputDir, { recursive: true });
        fs.mkdirSync(groupPortalDir, { recursive: true });

        run(
            process.execPath,
            ['scripts/build.js', sourceFile, '-b', 'b3', '-v', variant, '-o', rawPdf],
            `Build ${slug} (${variant})`
        );

        const ghostscript = spawnSync('which', ['gs'], { encoding: 'utf8' });
        if (ghostscript.status === 0) {
            run(
                'gs',
                [
                    '-sDEVICE=pdfwrite',
                    '-dCompatibilityLevel=1.4',
                    '-dPDFSETTINGS=/ebook',
                    '-dDownsampleColorImages=true',
                    '-dColorImageResolution=150',
                    '-dDownsampleGrayImages=true',
                    '-dGrayImageResolution=150',
                    '-dColorConversionStrategy=/Gray',
                    '-dProcessColorModel=/DeviceGray',
                    '-dNOPAUSE',
                    '-dBATCH',
                    '-dQUIET',
                    `-sOutputFile=${finalPdf}`,
                    rawPdf
                ],
                `Compress ${slug} (${variant})`
            );
            fs.unlinkSync(rawPdf);
        } else {
            fs.copyFileSync(rawPdf, finalPdf);
            fs.unlinkSync(rawPdf);
        }

        const sizeKb = Math.round(fs.statSync(finalPdf).size / 1024);
        console.log(`  ${path.relative(projectRoot, finalPdf)} · ${sizeKb} KB`);
    }
}

console.log('B3 materials published successfully.');
