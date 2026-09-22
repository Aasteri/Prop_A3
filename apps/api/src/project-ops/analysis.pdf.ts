import PDFDocument from '../common/pdfkit';

type AnalysisData = {
  project: { name: string; processGroup: string; status: string; site: { code: string } };
  milestones: { stage: string; progressPct: number; certifiedAt: Date | null }[];
  dailyLogCount: number;
  openChanges: number;
  inspections: { total: number; fail: number };
  finance: { spendTotal: number; budgetAmount?: number | null; project: { budgetAmount: number | null } };
};

export function buildAnalysisPdf(data: AnalysisData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(16).text('Project analysis', { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(
        `${data.project.name} (${data.project.site.code}) · ${data.project.processGroup} · ${data.project.status}`,
      );
    doc.moveDown();
    doc.fontSize(12).text('Milestones');
    for (const m of data.milestones) {
      doc
        .fontSize(10)
        .text(
          `${m.stage}: ${m.progressPct.toFixed(0)}%${m.certifiedAt ? ' · certified' : ''}`,
        );
    }
    doc.moveDown();
    doc.text(`Daily logs: ${data.dailyLogCount}`);
    doc.text(`Open changes: ${data.openChanges}`);
    doc.text(`Inspections logged: ${data.inspections.total} (fails: ${data.inspections.fail})`);
    doc.moveDown();
    doc.text(`Spend total: ₦${data.finance.spendTotal.toLocaleString()}`);
    if (data.finance.project.budgetAmount != null) {
      doc.text(`Budget: ₦${data.finance.project.budgetAmount.toLocaleString()}`);
    }
    doc.end();
  });
}
