#!/usr/bin/env node
// Stitch the B1 review-part fragments into one standalone chapter HTML
// that the existing build.js can render to student/teacher PDFs.
// Modeled on scripts/b4/legacy/assemble-review.js.
const fs = require('fs');
const path = require('path');

const PARTS_DIR = path.resolve(__dirname, '../../content/b1/complementary-material/review-parts');
const OUT = path.resolve(__dirname, '../../content/b1/complementary-material/review-worksheet.html');

// One review part per B1 chapter, in chapter order.
const ORDER = [
  { src: 1, label: 'Verb To Be & Prepositions of Place' },
  { src: 2, label: 'Household Chores, Pronouns & Possessive Adjectives' },
  { src: 3, label: 'Plural Nouns & Simple Present' },
  { src: 4, label: 'Numbers Beyond 100, Ordinals & Dates' },
  { src: 5, label: 'Frequency Adverbs & Possessives' },
  { src: 6, label: 'Telling the Time & Time Prepositions' },
  { src: 7, label: 'Descriptions, Transportation & Directions' },
];

const sections = ORDER.map(({ src }, i) => {
  const display = i + 1;
  let frag = fs.readFileSync(path.join(PARTS_DIR, `rev-${src}.html`), 'utf8').trim();
  // Relabel the visible "Review N" tag to the sequential number (no-op while src order == display order).
  frag = frag.replace(/(<span class="unit-number">)Review \d+(<\/span>)/, `$1Review ${display}$2`);
  return frag;
}).join('\n\n');

const tocItems = ORDER.map((o) => `                        <li>${o.label}</li>`).join('\n');

const html = `<!DOCTYPE html>
<html lang="en" class="student-version">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Book 1 — Review Worksheet - Incluir English Workbook</title>
    <link rel="stylesheet" href="../../../styles/print.css">
    <link rel="stylesheet" href="../../../styles/components.css">
</head>
<body>
    <main class="workbook-content">

        <div class="chapter" id="chapter-review">
            <header class="chapter-header">
                <span class="chapter-number">Review Worksheet</span>
                <h1 class="chapter-title">Book 1 — Grammar &amp; Vocabulary Review</h1>
                <p class="chapter-intro">
                    A review of the grammar and vocabulary we have studied in
                    Inglês Adulto — Básico 1. Work through each section to revise.
                    Take your time — and good luck!
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
