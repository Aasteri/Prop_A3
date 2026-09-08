#!/usr/bin/env node
/**
 * Propa3 Document Exporter v3
 * High-fidelity markdown → HTML → PDF with professional tables & mermaid diagrams.
 * v3: fixes diagram pagination/overlap (wide LR swimlanes, SVG sizing).
 */

import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_INPUT = path.join(__dirname, '..', 'ABRAHAM_MASTER_BUILD_DOCUMENT.md');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'output');

const MERMAID_CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

function parseArgs(argv) {
  const args = { input: DEFAULT_INPUT, htmlOnly: false, output: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--html-only') args.htmlOnly = true;
    else if (a === '--output' || a === '-o') args.output = argv[++i];
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-')) args.input = path.resolve(a);
  }
  return args;
}

function printHelp() {
  console.log(`
Propa3 Document Exporter v3

  node export.mjs [input.md] [--html-only] [-o path]

Examples:
  npm run export:master
  node export.mjs ../ABRAHAM_MASTER_BUILD_DOCUMENT.md --html-only
`);
}

function extractTitle(markdown) {
  const m = markdown.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Planning Document';
}

function extractSubtitle(markdown) {
  const block = markdown.match(/^>\s+\*\*Single .+?\*\*[^\n]*/m);
  if (block) return block[0].replace(/^>\s*/gm, '').replace(/\*\*/g, '');
  const line = markdown.match(/^>\s+(.+)$/m);
  return line ? line[1].replace(/\*\*/g, '') : 'Triple A Realty Projects Ltd. — Planning Export';
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert wide LR flowcharts to TB/TD so they fit A4 print width */
function optimizeMermaidForPrint(code) {
  let c = code.trim();
  const isMasterSwimlane =
    /flowchart\s+LR/i.test(c) &&
    /subgraph\s+INIT/i.test(c) &&
    /subgraph\s+(CLOSE|MON)/i.test(c);
  if (isMasterSwimlane) {
    c = c.replace(/flowchart\s+LR/i, 'flowchart TB');
  } else if (/flowchart\s+LR/i.test(c)) {
    c = c.replace(/flowchart\s+LR/i, 'flowchart TD');
  }
  return c;
}

/** Preserve mermaid blocks; convert details to always-visible sections */
function preprocessMarkdown(md) {
  const mermaidBlocks = [];
  let out = md.replace(/```mermaid\n([\s\S]*?)```/g, (_, code) => {
    const idx = mermaidBlocks.length;
    mermaidBlocks.push(optimizeMermaidForPrint(code));
    return `\n\n<!--MERMAID_${idx}-->\n\n`;
  });

  // Force all embedded docs visible — convert details → section
  out = out.replace(
    /<details(?:\s+open)?>\s*<summary>([\s\S]*?)<\/summary>/gi,
    (_, title) => `\n<section class="embedded-doc"><h4 class="embedded-doc-title">${title.trim()}</h4><div class="embedded-doc-body">\n`
  );
  out = out.replace(/<\/details>/gi, '\n</div></section>\n');

  return { markdown: out, mermaidBlocks };
}

function wrapTables(html) {
  return html.replace(/<table>([\s\S]*?)<\/table>/g, (full, inner) => {
    const colCount = (inner.match(/<th[^>]*>/g) || inner.match(/<tr[^>]*>\s*<td/g) || []).length;
    const wideClass = colCount >= 7 ? ' table-wide' : '';
    return `<div class="table-wrap${wideClass}"><table class="data-table">${inner}</table></div>`;
  });
}


/** Keep headings with their diagrams on the same page when possible */
function groupDiagramSections(html) {
  let out = html.replace(
    /(<h3[^>]*>[\s\S]*?<\/h3>)\s*(<div class="diagram-block" data-mermaid-idx="\d+">[\s\S]*?<\/div>\s*<\/div>)/g,
    '<section class="diagram-section">$1$2</section>'
  );

  out = out.replace(
    /(<h1[^>]*>B\.\d+[^<]*<\/h1>)\s*((?:<p>[\s\S]*?<\/p>\s*)+)(<div class="diagram-block" data-mermaid-idx="\d+">[\s\S]*?<\/div>\s*<\/div>)/g,
    '<section class="diagram-section">$1<div class="phase-intro-block">$2</div>$3</section>'
  );

  return out;
}

function restoreMermaidPlaceholders(html, mermaidBlocks) {
  let out = html;
  mermaidBlocks.forEach((code, idx) => {
    const placeholder = `<!--MERMAID_${idx}-->`;
    const escaped = escapeHtml(code);
    out = out.replace(
      placeholder,
      `<div class="diagram-block" data-mermaid-idx="${idx}"><div class="diagram-label">Workflow diagram ${idx + 1}</div><pre class="mermaid-source" style="display:none">${escaped}</pre><div class="mermaid">${code}</div></div>`
    );
    // marked may wrap comment in <p>
    out = out.replace(`<p>${placeholder}</p>`, `<div class="diagram-block" data-mermaid-idx="${idx}"><div class="diagram-label">Workflow diagram ${idx + 1}</div><div class="mermaid">${code}</div></div>`);
  });
  return out;
}

function buildHtml({ title, subtitle, bodyHtml, generatedAt }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <section class="cover-page">
    <div class="cover-brand">Triple A Realty Projects Ltd.</div>
    <h1 class="cover-title">${escapeHtml(title)}</h1>
    <p class="cover-subtitle">${escapeHtml(subtitle)}</p>
    <div class="cover-meta">
      <p><strong>Generated:</strong> ${escapeHtml(generatedAt)}</p>
      <p><strong>Export engine:</strong> Propa3 Document Exporter v3</p>
      <p><strong>Classification:</strong> Internal — Planning &amp; System Specification</p>
    </div>
  </section>
  <main class="document-body">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

async function inlineCss(html) {
  const css = await readFile(path.join(__dirname, 'styles', 'document.css'), 'utf8');
  return html.replace('</head>', `<style>${css}</style>\n</head>`);
}

/** Render each mermaid diagram sequentially for reliability on large docs */
async function renderMermaidInPage(page) {
  const count = await page.evaluate(() => document.querySelectorAll('.mermaid').length);
  if (count === 0) return { total: 0, rendered: 0 };

  console.log(`Rendering ${count} mermaid diagram(s)…`);

  await page.addScriptTag({ url: MERMAID_CDN });

  const result = await page.evaluate(async (diagramCount) => {
    // eslint-disable-next-line no-undef
    mermaid.initialize({
      startOnLoad: false,
      theme: 'base',
      themeVariables: {
        primaryColor: '#e87722',
        primaryTextColor: '#1a2744',
        primaryBorderColor: '#1a2744',
        lineColor: '#64748b',
        secondaryColor: '#f1f5f9',
        tertiaryColor: '#fff',
        fontFamily: 'Segoe UI, Calibri, sans-serif',
        fontSize: '13px',
      },
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 12,
        nodeSpacing: 40,
        rankSpacing: 45,
      },
      securityLevel: 'loose',
    });

    const nodes = Array.from(document.querySelectorAll('.mermaid'));
    let rendered = 0;
    const errors = [];

    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      const source = el.textContent.trim();
      if (!source) continue;
      const id = `mermaid-diagram-${i}-${Date.now()}`;
      try {
        // eslint-disable-next-line no-undef
        const { svg } = await mermaid.render(id, source);
        el.innerHTML = svg;
        el.classList.add('mermaid-rendered');
        rendered++;
      } catch (err) {
        errors.push(String(err.message || err));
        el.innerHTML = `<div class="mermaid-fallback">Diagram render error:\n${String(err.message || err)}\n\nSource:\n${source.substring(0, 500)}</div>`;
      }
    }

    document.body.dataset.mermaidRendered = String(rendered);
    return { total: diagramCount, rendered, errors };
  }, count);

  console.log(`Mermaid: ${result.rendered}/${result.total} rendered`);
  if (result.errors?.length) {
    console.warn('Mermaid warnings:', result.errors.slice(0, 3).join('; '));
  }
  return result;
}

/** Scale SVGs to content width and reserve explicit height so PDF flow does not overlap */
async function normalizeDiagramLayout(page) {
  return page.evaluate(() => {
    const body = document.querySelector('.document-body');
    const contentWidth = body ? body.clientWidth : 680;
    const maxHeight = 420;

    document.querySelectorAll('.diagram-block').forEach((block) => {
      const svg = block.querySelector('svg');
      if (!svg) return;
      if (block.querySelector('.diagram-canvas')) return;

      svg.removeAttribute('height');
      svg.style.cssText = 'display:block;max-width:none;';

      const vb = svg.viewBox?.baseVal;
      if (!vb || vb.width <= 0 || vb.height <= 0) return;

      let displayW = vb.width;
      let displayH = vb.height;

      if (displayW > contentWidth) {
        const s = contentWidth / displayW;
        displayW = contentWidth;
        displayH = displayH * s;
      }
      if (displayH > maxHeight) {
        const s = maxHeight / displayH;
        displayH = maxHeight;
        displayW = displayW * s;
      }

      const scale = displayW / vb.width;

      const canvas = document.createElement('div');
      canvas.className = 'diagram-canvas';
      canvas.style.width = '100%';
      canvas.style.height = `${Math.ceil(displayH)}px`;
      canvas.style.overflow = 'hidden';
      canvas.style.position = 'relative';

      const host = svg.parentElement;
      host.insertBefore(canvas, svg);
      canvas.appendChild(svg);

      svg.style.width = `${vb.width}px`;
      svg.style.height = `${vb.height}px`;
      svg.style.transform = `scale(${scale})`;
      svg.style.transformOrigin = 'top left';

      block.style.overflow = 'hidden';
      block.style.clear = 'both';
    });
  });
}

async function exportDocument(args) {
  const inputPath = args.input;
  const baseName = path.basename(inputPath, path.extname(inputPath));
  await mkdir(DEFAULT_OUTPUT_DIR, { recursive: true });

  const pdfPath = args.output?.endsWith('.pdf')
    ? args.output
    : args.output ?? path.join(DEFAULT_OUTPUT_DIR, `${baseName}.pdf`);
  const htmlPath = args.output?.endsWith('.html')
    ? args.output
    : path.join(DEFAULT_OUTPUT_DIR, `${baseName}.html`);

  console.log('Reading:', inputPath);
  const raw = await readFile(inputPath, 'utf8');
  const { markdown: preprocessed, mermaidBlocks } = preprocessMarkdown(raw);

  marked.setOptions({ gfm: true, breaks: false });

  let bodyHtml = marked.parse(preprocessed);
  bodyHtml = restoreMermaidPlaceholders(bodyHtml, mermaidBlocks);
  bodyHtml = groupDiagramSections(bodyHtml);
  bodyHtml = wrapTables(bodyHtml);

  const generatedAt = new Date().toLocaleString('en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'Africa/Lagos',
  });

  let html = buildHtml({
    title: extractTitle(raw),
    subtitle: extractSubtitle(raw),
    bodyHtml,
    generatedAt,
  });

  html = await inlineCss(html);

  if (args.htmlOnly) {
    await writeFile(htmlPath, html, 'utf8');
    console.log('Wrote HTML:', htmlPath);
    return { htmlPath };
  }

  console.log('Launching browser…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 2 });

    // setContent avoids file:// protocol issues with CDN scripts
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 180000,
    });

    await renderMermaidInPage(page);
    await normalizeDiagramLayout(page);

    // Let layout settle after SVG normalization (no scroll — avoids print overlap bugs)
    await page.evaluate(() => document.body.offsetHeight);
    await new Promise((r) => setTimeout(r, 1500));

    // Snapshot final HTML with rendered SVGs for audit
    const finalHtml = await page.content();
    await writeFile(htmlPath, finalHtml, 'utf8');
    console.log('Wrote HTML:', htmlPath);

    await page.emulateMediaType('print');

    console.log('Generating PDF (large document — may take several minutes)…');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;font-size:7.5px;padding:0 14mm;color:#64748b;font-family:Segoe UI,sans-serif;border-bottom:1px solid #e2e8f0;padding-bottom:2px;">
          <span style="color:#e87722;font-weight:700;">TRIPLE A REALTY</span>
          <span style="margin-left:8px;">Master Build Document</span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;font-size:7.5px;padding:0 14mm;color:#64748b;font-family:Segoe UI,sans-serif;display:flex;justify-content:space-between;">
          <span>Confidential — Internal Planning Specification</span>
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      margin: { top: '24mm', right: '12mm', bottom: '28mm', left: '12mm' },
      timeout: 600000,
    });

    const stats = await page.evaluate(() => ({
      tables: document.querySelectorAll('table.data-table').length,
      diagrams: document.querySelectorAll('.mermaid-rendered, .diagram-block svg').length,
      sections: document.querySelectorAll('.embedded-doc').length,
      headings: document.querySelectorAll('h1,h2,h3').length,
    }));

    console.log('Content stats:', stats);
    console.log('Wrote PDF:', pdfPath);
    return { htmlPath, pdfPath, stats };
  } finally {
    await browser.close();
  }
}

const args = parseArgs(process.argv);
if (args.help) {
  printHelp();
  process.exit(0);
}

exportDocument(args).catch((err) => {
  console.error('Export failed:', err);
  process.exit(1);
});
