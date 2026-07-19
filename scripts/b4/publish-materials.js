#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const contentDir = path.join(projectRoot, 'content', 'b4');
const outputDir = path.join(projectRoot, 'output', 'b4', 'materials');
const portalDir = path.join(projectRoot, 'portal', 'downloads', 'b4');

const materials = [
    { slug: 'chapter-practice-homework', group: 'practice', source: 'practice/chapter-practice-homework.html' },
    { slug: 'foundation-test-1', group: 'assessments', source: 'assessments/foundation-test-1.html' },
    { slug: 'foundation-test-2', group: 'assessments', source: 'assessments/foundation-test-2.html' },
    { slug: 'speaking-mission-exam', group: 'assessments', source: 'assessments/speaking-mission-exam.html' }
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
            ['scripts/build.js', sourceFile, '-b', 'b4', '-v', variant, '-o', rawPdf],
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

console.log('B4 materials published successfully.');
