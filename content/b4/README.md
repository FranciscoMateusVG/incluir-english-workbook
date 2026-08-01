# B4 content map

The B4 source is organized by purpose so active course content, exams, and older material do not become mixed together. Every level (b0–b4) uses the same buckets.

```text
content/b4/
├── workbooks/                 Active Chapters 1–8 used by the full workbook build
├── exercises/                 Standalone chapter practice and homework pack
├── exams/                     Foundation Tests 1–2 and the Speaking Mission Exam
├── complementary-material/    Previous review worksheet, its review-parts/, and the superseded end-of-level test
├── summary.html               Full-workbook contents page (stays at level root — publish.js hardcodes this path)
└── README.md                  This map
```

## Build commands

- Full B4 workbooks: `npm run publish:b4`
- Exercise and exam PDFs: `npm run publish:b4:materials`

The B4-specific publisher lives at `scripts/b4/publish-materials.js`. Older review assembly helpers are isolated under `scripts/b4/legacy/`.

The materials publisher writes current PDFs to matching folders under `portal/downloads/b4/`:

```text
portal/downloads/b4/
├── workbooks/
├── exercises/
├── exams/
└── complementary-material/
```

Files under `complementary-material/` are retained for reference and are not linked from the current coordinator portal.
