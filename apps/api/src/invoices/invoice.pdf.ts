import PDFDocument from '../common/pdfkit';

type InvoicePdfData = {
  invoiceNumber: string;
  clientName: string;
  issueDate: Date;
  status: string;
  invoiceType: string;
  revisedTotal: number;
  paidTotal: number;
  outstanding: number;
  lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

export function buildInvoicePdf(data: InvoicePdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).fillColor('#1a2744').text('Propa3 — Invoice', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Invoice: ${data.invoiceNumber}`);
    doc.text(`Client: ${data.clientName}`);
    doc.text(`Type: ${data.invoiceType} · Status: ${data.status}`);
    doc.text(`Issue date: ${data.issueDate.toLocaleDateString('en-NG')}`);
    doc.moveDown();
    doc.fontSize(12).text('Lines');
    for (const line of data.lines) {
      doc
        .fontSize(10)
        .text(
          `${line.description} — ${line.quantity} × ₦${line.unitPrice.toLocaleString()} = ₦${line.lineTotal.toLocaleString()}`,
        );
    }
    doc.moveDown();
    doc.fontSize(11).text(`Revised total: ₦${data.revisedTotal.toLocaleString()}`);
    doc.text(`Paid: ₦${data.paidTotal.toLocaleString()}`);
    doc.text(`Outstanding: ₦${data.outstanding.toLocaleString()}`);
    doc.end();
  });
}
