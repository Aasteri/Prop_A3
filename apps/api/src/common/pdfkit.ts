// pdfkit exports the constructor directly under CommonJS (no .default at runtime).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

export default PDFDocument;
