import PDFDocument from '../common/pdfkit';
import { PassThrough } from 'stream';

/** Doc 11 service headings — used when engagement has no narrative fields. */
export const DEFAULT_PM_SERVICES = [
  'Tenant Acquisition and Screening — advertising, showings, lease preparation, and background checks.',
  'Rental Collection and Financial Management — rent collection, financial reporting, and remittance.',
  'Property Maintenance and Repairs — routine maintenance oversight and repair coordination.',
  'Tenancy / Lease Administration and Renewals — lease admin, inspections, and renewals.',
  'Comprehensive Financial Analysis and Reporting — income, balance, and cash-flow style reporting.',
];

export const DEFAULT_MARKETING_POINTS = [
  'Digital Advertising — listing on high-traffic rental platforms and social channels.',
  'Targeted Outreach — network of pre-screened prospects and local agents.',
  'On-Site Signage — professional “For Lease” banner or signage on the premises.',
];

export type PmEngagementPdfData = {
  ownerName: string;
  ownerPhone: string | null;
  status: string;
  lettingFeePct: number;
  agencyFeePct: number;
  legalFeePct: number;
  managementFeePct: number;
  applicationAgencyLegalPct: number;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  propertyNames: string[];
  /** Optional narrative override; falls back to Doc 11 defaults */
  servicesOffered?: string[] | null;
  marketingPoints?: string[] | null;
};

export function buildPmEngagementPdf(data: PmEngagementPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    const d = (v: Date) => v.toLocaleDateString('en-NG');
    const pct = (n: number) => `${n}%`;
    const services = data.servicesOffered?.length ? data.servicesOffered : DEFAULT_PM_SERVICES;
    const marketing = data.marketingPoints?.length
      ? data.marketingPoints
      : DEFAULT_MARKETING_POINTS;

    doc
      .fontSize(18)
      .fillColor('#1a2744')
      .text('Property Management Engagement Proposal Summary', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#666')
      .text('Triple A Realty / A. A. Laucarie Consulting — Doc 11 style summary', {
        align: 'center',
      });
    doc.moveDown();

    doc.fontSize(10).fillColor('#333');
    doc.text(`Prepared: ${d(new Date())}`);
    doc.text(`Owner / landlord: ${data.ownerName}`);
    if (data.ownerPhone) doc.text(`Owner phone: ${data.ownerPhone}`);
    doc.text(`Engagement status: ${data.status}`);
    if (data.startDate || data.endDate) {
      doc.text(
        `Term: ${data.startDate ? d(data.startDate) : '—'} to ${data.endDate ? d(data.endDate) : '—'}`,
      );
    }
    doc.text(
      `Properties: ${data.propertyNames.length ? data.propertyNames.join(', ') : 'none linked'}`,
    );
    doc.moveDown();

    doc
      .fontSize(11)
      .fillColor('#333')
      .text(
        'This summary outlines proposed property management services and the fee schedule configured for this engagement. It is an operational proposal summary, not a signed legal agreement.',
      );
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a2744').text('1. Services offered', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333');
    for (const s of services) {
      doc.text(`• ${s}`);
    }
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor('#1a2744').text('2. Marketing and advertising strategy', {
      underline: true,
    });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333');
    for (const m of marketing) {
      doc.text(`• ${m}`);
    }
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor('#1a2744').text('3. Proposed professional fees', {
      underline: true,
    });
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor('#333');
    doc.text(
      `• Letting fee: ${pct(data.lettingFeePct)} of gross rent for securing a new tenant (covers advertising, showings, and screening).`,
    );
    doc.text(
      `• Management fee: ${pct(data.managementFeePct)} of gross yearly rent collected (day-to-day operations, rent collection, maintenance coordination).`,
    );
    doc.text(`• Agency fee (offer split): ${pct(data.agencyFeePct)}`);
    doc.text(`• Legal fee (offer split): ${pct(data.legalFeePct)}`);
    doc.text(
      `• Application Agency + Legal combined: ${pct(data.applicationAgencyLegalPct)}`,
    );

    if (data.notes) {
      doc.moveDown(0.6);
      doc.fontSize(12).fillColor('#1a2744').text('Notes', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text(data.notes);
    }

    doc.moveDown(1.5);
    doc
      .fontSize(9)
      .fillColor('#666')
      .text(
        'Fee percentages are taken from this PM engagement record (Doc 10 / 11 / 12 defaults where not overridden). Formal acceptance and authorization remain outside this summary PDF.',
      );
    doc.moveDown();
    doc.text('Generated by Propa3', { align: 'center' });

    doc.end();
  });
}
