import PDFDocument from '../common/pdfkit';
import { PassThrough } from 'stream';

function bullets(
  doc: InstanceType<typeof import('../common/pdfkit').default>,
  title: string,
  items: string[],
) {
  doc.fontSize(12).fillColor('#1a2744').text(title, { underline: true });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#333');
  if (!items.length) {
    doc.text('—');
  } else {
    for (const i of items) doc.text(`• ${i}`);
  }
  doc.moveDown(0.6);
}

export function buildRetrospectivePdf(data: {
  number: string;
  projectName: string;
  heldAt: Date | null;
  ownerName: string | null;
  collaborators: string | null;
  projectSummary: string;
  projectStatusNote: string | null;
  goalsObjectives: string | null;
  durationNote: string | null;
  teamNote: string | null;
  docsLink: string | null;
  methodology: string | null;
  resources: string | null;
  wentWell: string[];
  improvements: string[];
  lucky: string[];
  actions: { action: string; type?: string; owner?: string; links?: string }[];
  nextSteps: string | null;
  timeline: { dateAchieved: string; milestone: string }[];
  clientTestimonial: string | null;
  clientFeedbackBy: string | null;
  status: string;
  preparedBy: string | null;
  publishedAt: Date | null;
  createdAt: Date;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    const d = (v: Date | null) => (v ? v.toLocaleDateString('en-NG') : '—');

    doc.fontSize(18).fillColor('#1a2744').text('Project Retrospective', { align: 'center' });
    doc.fontSize(10).fillColor('#666').text('Triple A Realty / Document 8 — Lessons learned', {
      align: 'center',
    });
    doc.moveDown();
    doc.fontSize(10).fillColor('#333');
    doc.text(`Report No: ${data.number}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Project: ${data.projectName}`);
    doc.text(`Date: ${d(data.heldAt ?? data.publishedAt ?? data.createdAt)}`);
    if (data.ownerName) doc.text(`Owner: ${data.ownerName}`);
    if (data.collaborators) doc.text(`Collaborators: ${data.collaborators}`);
    if (data.preparedBy) doc.text(`Prepared by: ${data.preparedBy}`);
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a2744').text('Project summary', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333').text(data.projectSummary);
    doc.moveDown(0.6);

    const meta: [string, string | null][] = [
      ['Project status', data.projectStatusNote],
      ['Goals & objectives', data.goalsObjectives],
      ['Duration', data.durationNote],
      ['Team', data.teamNote],
      ['Project docs', data.docsLink],
      ['Methodology', data.methodology],
      ['Resources', data.resources],
    ];
    for (const [label, value] of meta) {
      if (!value) continue;
      doc.fontSize(10).fillColor('#1a2744').text(`${label}: `, { continued: true });
      doc.fillColor('#333').text(value);
    }
    doc.moveDown();

    bullets(doc, 'Things that went well', data.wentWell);
    bullets(doc, 'Things that need improvement', data.improvements);
    bullets(doc, 'Where we got lucky', data.lucky);

    doc.fontSize(12).fillColor('#1a2744').text('Action items', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (!data.actions.length) {
      doc.text('—');
    } else {
      for (const a of data.actions) {
        const bits = [
          a.action,
          a.type ? `type: ${a.type}` : null,
          a.owner ? `owner: ${a.owner}` : null,
          a.links ? `links: ${a.links}` : null,
        ].filter(Boolean);
        doc.text(`• ${bits.join(' · ')}`);
      }
    }
    doc.moveDown(0.6);

    if (data.nextSteps) {
      doc.fontSize(12).fillColor('#1a2744').text('Next steps & future considerations', {
        underline: true,
      });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text(data.nextSteps);
      doc.moveDown(0.6);
    }

    doc.fontSize(12).fillColor('#1a2744').text('Project timeline', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (!data.timeline.length) {
      doc.text('—');
    } else {
      for (const t of data.timeline) {
        doc.text(`• ${t.dateAchieved}: ${t.milestone}`);
      }
    }
    doc.moveDown(0.6);

    if (data.clientTestimonial) {
      doc.fontSize(12).fillColor('#1a2744').text('Client testimonial', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text(data.clientTestimonial);
      if (data.clientFeedbackBy) {
        doc.moveDown(0.2);
        doc.fillColor('#666').text(`— ${data.clientFeedbackBy}`);
      }
    }

    doc.end();
  });
}
