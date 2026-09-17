import PDFDocument from '../common/pdfkit';
import { PassThrough } from 'stream';

export type IvcStage = {
  sn: number;
  stage: string;
  measuredPct?: number | null;
  amountPaid?: number | null;
  pctPaid?: number | null;
  datePaid?: string | null;
  performanceComment?: string;
};

export function buildIvcPdf(data: {
  number: string;
  projectName: string;
  workDescription: string;
  subcontractorName: string;
  accountDetails: string | null;
  scopeOfWork: string;
  contractReference: string | null;
  contractAmount: number;
  deliveryPeriod: string | null;
  startDate: Date | null;
  endDate: Date | null;
  stages: IvcStage[];
  recommendation: string | null;
  status: string;
  preparedBy: string | null;
  pmSignedBy: string | null;
  supervisorSignedBy: string | null;
  subcontractorSignedBy: string | null;
  createdAt: Date;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 45, size: 'A4' });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    const d = (v: Date | null) => (v ? v.toLocaleDateString('en-NG') : '—');
    const n = (v: number | null | undefined) =>
      v == null ? '—' : Number(v).toLocaleString('en-NG', { maximumFractionDigits: 2 });

    doc
      .fontSize(16)
      .fillColor('#1a2744')
      .text('Completion / Milestone Interim Valuation Certificate', { align: 'center' });
    doc.fontSize(9).fillColor('#666').text('Triple A Realty — Document 6 / FORM_IVC', {
      align: 'center',
    });
    doc.moveDown();
    doc.fontSize(10).fillColor('#333');
    doc.text(`IVC No: ${data.number} · Status: ${data.status}`);
    doc.text(`Project: ${data.projectName}`);
    doc.text(`Date: ${d(data.createdAt)}`);
    if (data.preparedBy) doc.text(`Prepared by: ${data.preparedBy}`);
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a2744').text('Project details', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    doc.text(`Description of work: ${data.workDescription}`);
    doc.text(`Subcontractor: ${data.subcontractorName}`);
    if (data.accountDetails) doc.text(`Account details: ${data.accountDetails}`);
    doc.text(`Scope / SOW: ${data.scopeOfWork}`);
    if (data.contractReference) doc.text(`Contract reference: ${data.contractReference}`);
    doc.text(`Contract amount (NGN): ${n(data.contractAmount)}`);
    if (data.deliveryPeriod) doc.text(`Delivery period: ${data.deliveryPeriod}`);
    doc.text(`Start: ${d(data.startDate)} · End: ${d(data.endDate)}`);
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a2744').text('Payment details', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(8).fillColor('#333');
    for (const s of data.stages) {
      doc.text(
        `${s.sn}. ${s.stage} · measured ${n(s.measuredPct)}% · paid NGN ${n(s.amountPaid)} (${n(
          s.pctPaid,
        )}%) · ${s.datePaid ?? '—'} · ${s.performanceComment || '—'}`,
      );
      doc.moveDown(0.15);
    }
    doc.moveDown(0.4);

    if (data.recommendation) {
      doc.fontSize(12).fillColor('#1a2744').text('General recommendation', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text(data.recommendation);
      doc.moveDown();
    }

    doc.fontSize(12).fillColor('#1a2744').text('Signatures', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333');
    doc.text(`PROJECT MGR: ${data.pmSignedBy ?? '________________'}`);
    doc.text(`SUPERVISOR: ${data.supervisorSignedBy ?? '________________'}`);
    doc.text(`SUB-CONTRACTOR: ${data.subcontractorSignedBy ?? '________________'}`);

    doc.end();
  });
}
