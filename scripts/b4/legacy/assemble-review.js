#!/usr/bin/env node
// Stitch the selected review-part fragments into one standalone chapter HTML
// that the existing build.js can render to student/teacher PDFs.
const fs = require('fs');
const path = require('path');

const PARTS_DIR = path.resolve(__dirname, '../../../content/b4/legacy/review-parts');
const OUT = path.resolve(__dirname, '../../../content/b4/legacy/review-worksheet.html');

// Source part -> display order. Reviews 4 (Reported Speech) and 7 (Relative
// Clauses & For vs To) were dropped per teacher; survivors renumber 1..6.
const ORDER = [
  { src: 1, label: 'Tenses Review — Present & Past Simple' },
  { src: 2, label: 'Future, Modals & Prepositions' },
  { src: 3, label: 'Present Perfect & Past Participles' },
  { src: 5, label: 'Past Perfect' },
  { src: 6, label: 'Passive Voice' },
  { src: 8, label: 'Phrasal Verbs' },
];

const sections = ORDER.map(({ src }, i) => {
  const display = i + 1;
  let frag = fs.readFileSync(path.join(PARTS_DIR, `rev-${src}.html`), 'utf8').trim();
  // Relabel the visible "Review N" tag to the new sequential number.
  frag = frag.replace(/(<span class="unit-number">)Review \d+(<\/span>)/, `$1Review ${display}$2`);
  return frag;
}).join('\n\n');

const tocItems = ORDER.map((o) => `                        <li>${o.label}</li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en" class="student-version">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book 4 — Review Worksheet - Incluir English Workbook</title>
    <link rel="stylesheet" href="../../../styles/print.css">
    <link rel="stylesheet" href="../../../styles/components.css">
</head>
<body>
    <main class="workbook-content">

        <div class="chapter" id="chapter-review">
            <header class="chapter-header">
                <span class="chapter-number">Review Worksheet</span>
                <h1 class="chapter-title">Book 4 — Grammar Review</h1>
                <p class="chapter-intro">
                    A review of the grammar and vocabulary we have studied in
                    Inglês Adulto — Básico 4. Work through each section to revise.
                    Good luck!
                </p>
            </header>

            <div class="callout note">
                <div class="callout-icon">📋</div>
                <div class="callout-content">
                    <strong class="callout-label">What's inside:</strong>
                    <ol>
${tocItems}
                    </ol>
                </div>
            </div>
        </div>

${sections}

    </main>
</body>
</html>
`;

fs.writeFileSync(OUT, html, 'utf8');
const exCount = (sections.match(/class="exercise"/g) || []).length;
console.log(`Wrote ${OUT}\n  ${ORDER.length} sections, ${exCount} exercises, ${html.length} bytes`);
