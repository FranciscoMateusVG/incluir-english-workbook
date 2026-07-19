#!/usr/bin/env node
// One-shot helper: pull each review subagent's final HTML fragment out of its
// task transcript JSONL and write it to legacy/review-parts/rev-N.html (raw HTML).
const fs = require('fs');
const path = require('path');

const TASK_DIR = '/private/tmp/claude-501/-Users-franciscomateus-projects-aperture/a755368c-0be4-4511-a959-12be409a089c/tasks';
const OUT_DIR = path.resolve(__dirname, '../../../content/b4/legacy/review-parts');

// id -> review number (rev-1 was written by hand; extract 2..8)
const MAP = [
  { id: 'a4d9384cd2c2d26ea', n: 2 },
  { id: 'a6a2e54169112fe14', n: 3 },
  { id: 'a786746122e8a82f1', n: 4 },
  { id: 'aa23ceb79d71c2c9d', n: 5 },
  { id: 'a11444ed0dc07e345', n: 6 },
  { id: 'a8768a1c1e92f087f', n: 7 },
  { id: 'ab8a29271a6c99f54', n: 8 },
];

// Walk an arbitrary JSON value collecting every string that looks like the fragment.
function collectStrings(val, out) {
  if (typeof val === 'string') {
    if (val.includes('<section class="unit') && val.includes('</section>')) out.push(val);
  } else if (Array.isArray(val)) {
    for (const v of val) collectStrings(v, out);
  } else if (val && typeof val === 'object') {
    for (const k of Object.keys(val)) collectStrings(val[k], out);
  }
}

for (const { id, n } of MAP) {
  const file = path.join(TASK_DIR, `${id}.output`);
  const raw = fs.readFileSync(file, 'utf8');
  const candidates = [];
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { collectStrings(JSON.parse(t), candidates); } catch (_) {}
  }
  // Only the agent's FINAL answer carries the unique unit-rev-N id; chapter
  // tool-results use unit-1-1 etc., so this filter excludes them.
  const tagged = candidates.filter((s) => s.includes(`id="unit-rev-${n}"`));
  if (!tagged.length) { console.error(`rev-${n}: NO FRAGMENT FOUND in ${id}`); continue; }
  // Longest tagged string = the real final answer (the short one is my prompt,
  // which contains the example skeleton with the same id — a decoy).
  let text = tagged.sort((a, b) => b.length - a.length)[0];
  const start = text.indexOf(`<section class="unit page-break-before" id="unit-rev-${n}"`);
  const end = text.lastIndexOf('</section>') + '</section>'.length;
  const frag = text.slice(start, end).trim() + '\n';
  // Sanity: must reference the right rev id
  const ok = frag.includes(`id="unit-rev-${n}"`);
  const outPath = path.join(OUT_DIR, `rev-${n}.html`);
  fs.writeFileSync(outPath, frag, 'utf8');
  console.log(`rev-${n}: wrote ${frag.length} bytes  (id match: ${ok})`);
}
