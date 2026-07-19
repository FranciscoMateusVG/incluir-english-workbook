# B4 content map

The B4 source is organized by purpose so active course content, assessments, and older material do not become mixed together.

```text
content/b4/
├── chapters/       Active Chapters 1–8 used by the full workbook build
├── practice/       Standalone chapter practice and homework pack
├── assessments/    Foundation Tests 1–2 and the Speaking Mission Exam
├── legacy/         Previous review worksheet and end-of-level test
├── summary.html    Full-workbook contents page
└── README.md       This map
```

## Build commands

- Full B4 workbooks: `npm run publish:b4`
- Practice and assessment PDFs: `npm run publish:b4:materials`

The B4-specific publisher lives at `scripts/b4/publish-materials.js`. Older review assembly helpers are isolated under `scripts/b4/legacy/`.

The materials publisher writes current PDFs to matching folders under `portal/downloads/b4/`:

```text
portal/downloads/b4/
├── workbooks/
├── practice/
├── assessments/
└── legacy/
```

Files under `legacy/` are retained for reference and are not linked from the current coordinator portal.
