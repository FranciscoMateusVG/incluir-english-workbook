#!/usr/bin/env node
// Stitch the B3 review-part fragments into one standalone chapter HTML
// that the existing build.js can render to student/teacher PDFs.
// Modeled on scripts/b4/legacy/assemble-review.js; B3 keeps all nine parts.
const fs = require('fs');
const path = require('path');

const PARTS_DIR = path.resolve(__dirname, '../../content/b3/complementary-material/review-parts');
const OUT = path.resolve(__dirname, '../../content/b3/complementary-material/review-worksheet.html');

const ORDER = [
  { src: 1, label: 'Settling In — Present Simple vs Present Continuous, Plurals & Quantifiers' },
  { src: 2, label: 'Modal Verbs — Advice, Obligation & Prohibition' },
  { src: 3, label: 'Rights and Duties' },
  { src: 4, label: 'Simple Future — Will vs Going To' },
  { src: 5, label: 'Future Conditions — Time Clauses & First Conditional' },
  { src: 6, label: 'Simple Past — Regular & Irregular Verbs' },
  { src: 7, label: 'Was / Were and Telling Stories' },
  { src: 8, label: 'Comparatives & Superlatives' },
  { src: 9, label: 'Intensifiers — Very, Really, Too & Enough' },
];

const sections = ORDER.map(({ src }, i) => {
  const display = i + 1;
  let frag = fs.readFileSync(path.join(PARTS_DIR, `rev-${src}.html`), 'utf8').trim();
  // Relabel the visible "Review N" tag to the sequential number.
  frag = frag.replace(/(<span class="unit-number">)Review \d+(<\/span>)/, `$1Review ${display}$2`);
  return frag;
}).join('\n\n');

const tocItems = ORDER.map((o) => `                        <li>${o.label}</li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en" class="student-version">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book 3 — Review Worksheet - Incluir English Workbook</title>
    <link rel="stylesheet" href="../../../styles/print.css">
    <link rel="stylesheet" href="../../../styles/components.css">
</head>
<body>
    <main class="workbook-content">

        <div class="chapter" id="chapter-review">
            <header class="chapter-header">
                <span class="chapter-number">Review Worksheet</span>
                <h1 class="chapter-title">Book 3 — Grammar Review</h1>
                <p class="chapter-intro">
                    A review of the grammar and vocabulary we have studied in
                    Inglês Adulto — Básico 3. Work through each section to revise.
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
