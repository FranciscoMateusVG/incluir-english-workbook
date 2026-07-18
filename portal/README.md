# Incluir English Portal

Small static portal for curriculum documents and apostila downloads.

## Preview locally

From this folder:

```bash
python3 -m http.server 4177
```

Then open:

```text
http://127.0.0.1:4177
```

## Contents

- `index.html` - portal page
- `styles.css` - visual design
- `app.js` - markdown document reader
- `assets/docs/` - copied curriculum docs for browser preview/download
- `downloads/` - PDF apostilas and tests available through the portal

## Updating docs

When a source doc in `../docs/` changes, copy the updated file into `assets/docs/`.

## Updating downloads

When new apostilas are published, copy the PDF into `downloads/` and add a download card in `index.html`.
