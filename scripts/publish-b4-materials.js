#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const materialsDir = path.join(projectRoot, 'content', 'b4', 'materials');
const outputDir = path.join(projectRoot, 'output', 'b4', 'materials');
const portalDir = path.join(projectRoot, 'portal', 'downloads');

const materials = [
    ['b4-chapter-practice-homework', 'b4-chapter-practice-homework.html'],
    ['b4-foundation-test-1', 'b4-foundation-test-1.html'],
    ['b4-foundation-test-2', 'b4-foundation-test-2.html'],
    ['b4-speaking-mission-exam', 'b4-speaking-mission-exam.html']
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

for (const [slug, sourceFile] of materials) {
    for (const variant of ['student', 'teacher']) {
        const source = path.join(materialsDir, sourceFile);
        const rawPdf = path.join(outputDir, `${slug}-${variant}-raw.pdf`);
        const finalPdf = path.join(portalDir, `${slug}-${variant}.pdf`);

        run(
            process.execPath,
            ['scripts/build.js', source, '-b', 'b4', '-v', variant, '-o', rawPdf],
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
