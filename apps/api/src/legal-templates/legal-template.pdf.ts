import PDFDocument from '../common/pdfkit';
import { PassThrough } from 'stream';

export function buildFilledMarkdownPdf(opts: {
  title: string;
  subtitle?: string;
  body: string;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    doc.fontSize(16).fillColor('#1a2744').text(opts.title, { align: 'center' });
    if (opts.subtitle) {
      doc.fontSize(9).fillColor('#666').text(opts.subtitle, { align: 'center' });
    }
    doc.moveDown();
    doc.fontSize(9).fillColor('#333');

    const lines = opts.body.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith('# ')) {
        doc.moveDown(0.4);
        doc.fontSize(13).fillColor('#1a2744').text(line.replace(/^#\s+/, ''), { continued: false });
        doc.fontSize(9).fillColor('#333');
      } else if (line.startsWith('## ')) {
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('#1a2744').text(line.replace(/^##\s+/, ''));
        doc.fontSize(9).fillColor('#333');
      } else if (line.startsWith('### ')) {
        doc.moveDown(0.2);
        doc.fontSize(10).fillColor('#1a2744').text(line.replace(/^###\s+/, ''));
        doc.fontSize(9).fillColor('#333');
      } else if (line.startsWith('> ')) {
        doc.fillColor('#666').text(line.replace(/^>\s+/, ''), { indent: 10 });
        doc.fillColor('#333');
      } else if (line.startsWith('```')) {
        continue;
      } else if (line.trim() === '---') {
        doc.moveDown(0.2);
        doc
          .strokeColor('#ccc')
          .moveTo(doc.page.margins.left, doc.y)
          .lineTo(doc.page.width - doc.page.margins.right, doc.y)
          .stroke();
        doc.moveDown(0.4);
      } else {
        doc.text(line || ' ', { width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
      }
    }

    doc
      .fontSize(8)
      .fillColor('#666')
      .text('propA3 standard form · superseded when client-specific template uploaded', 50, doc.page.height - 40, {
        align: 'center',
        width: doc.page.width - 100,
      });

    doc.end();
  });
}
