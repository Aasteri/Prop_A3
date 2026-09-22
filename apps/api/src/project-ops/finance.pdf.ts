import PDFDocument from '../common/pdfkit';

type FinanceData = {
  project: {
    name: string;
    budgetAmount: number | null;
    budgetRange: string | null;
    site: { code: string; name: string };
  };
  sections: { label: string; amount: number }[];
  spendTotal: number;
  budgetRemaining: number | null;
};

export function buildFinancePdf(data: FinanceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Project finance report', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`${data.project.name} · ${data.project.site.code}`);
    if (data.project.budgetRange) doc.text(`Charter budget range: ${data.project.budgetRange}`);
    if (data.project.budgetAmount != null) {
      doc.text(`Budget amount: ₦${data.project.budgetAmount.toLocaleString()}`);
    }
    doc.moveDown();
    doc.fontSize(12).text('Cost by section');
    doc.moveDown(0.3);
    for (const s of data.sections) {
      doc.fontSize(10).text(`${s.label}: ₦${s.amount.toLocaleString()}`);
    }
    doc.moveDown();
    doc.fontSize(12).text(`Spend total: ₦${data.spendTotal.toLocaleString()}`);
    if (data.budgetRemaining != null) {
      doc.text(`Budget remaining: ₦${data.budgetRemaining.toLocaleString()}`);
    }
    doc.end();
  });
}
