# Propa3 Document Exporter

Formats planning markdown (especially `ABRAHAM_MASTER_BUILD_DOCUMENT.md`) into a **styled HTML** and **print-ready PDF**.

## Setup (once)

```bash
cd planning/doc-export
npm install
```

## Export master build document to PDF

```bash
npm run export:master
```

**Outputs:**
- `planning/output/ABRAHAM_MASTER_BUILD_DOCUMENT.pdf`
- `planning/output/ABRAHAM_MASTER_BUILD_DOCUMENT.html` (preview)

## Other commands

```bash
# Custom file
node export.mjs ../ABRAHAM_FULL_EXTRACTION.md

# HTML only (faster preview, no Puppeteer PDF step)
node export.mjs ../ABRAHAM_MASTER_BUILD_DOCUMENT.md --html-only

# Custom output path
node export.mjs ../ABRAHAM_MASTER_BUILD_DOCUMENT.md -o ../output/my-export.pdf
```

## From repo root

```bash
npm run planning:export-pdf
```

## Features (v2)

- **Professional data tables** — bordered, striped, navy headers, repeating header rows on page breaks, wide-table mode for 7+ columns
- **Mermaid organograms** — rendered sequentially to SVG before PDF (Triple A theme colors)
- **Embedded documents** — all `<details>` blocks converted to visible sections (nothing hidden)
- Cover page, page numbers, branded header/footer
- Full HTML snapshot saved alongside PDF (includes rendered SVG diagrams)

## Quality checklist

After export, verify in the PDF:
- [ ] All Part B workflow steps visible with metadata tables
- [ ] Embedded Abraham docs (charter, kick-off, schedules) fully readable
- [ ] Mermaid diagrams in B.0 and phase sections render as charts (not raw code)
- [ ] WBS table (101 rows) present with all columns
- [ ] Page numbers on every page

## Tips

- First run downloads Chromium via Puppeteer (~150MB).
- Large documents (~5000 lines) may take 1–2 minutes to render.
- Open the `.html` file in a browser to preview before sharing the PDF.
