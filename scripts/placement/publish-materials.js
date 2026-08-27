#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const contentDir = path.join(projectRoot, 'content', 'placement');
const outputDir = path.join(projectRoot, 'output', 'placement');
const portalDir = path.join(projectRoot, 'portal', 'downloads', 'placement');

const materials = [
    { slug: 'exam', source: 'exam.html' }
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

for (const { slug, source } of materials) {
    for (const variant of ['student', 'teacher']) {
        const sourceFile = path.join(contentDir, source);
        const rawPdf = path.join(outputDir, `${slug}-${variant}-raw.pdf`);
        const finalPdf = path.join(portalDir, `${slug}-${variant}.pdf`);

        // Placement is cross-level, so no -b flag (build.js only accepts b0–b4).
        run(
            process.execPath,
            ['scripts/build.js', sourceFile, '-v', variant, '-o', rawPdf],
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

console.log('Placement materials published successfully.');
