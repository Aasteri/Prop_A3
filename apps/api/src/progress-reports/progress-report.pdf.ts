import PDFDocument from '../common/pdfkit';
import { PassThrough } from 'stream';

type TeamMember = { role: string; name: string };
type Task = {
  description: string;
  date?: string;
  status?: string;
  owner?: string;
  comments?: string;
};
type Risk = { issue: string; impact?: string; action?: string; owner?: string };

export function buildProgressReportPdf(data: {
  number: string;
  projectName: string;
  reportDate: Date;
  preparedBy: string | null;
  summary: string;
  team: TeamMember[];
  completed: Task[];
  upcoming: Task[];
  risks: Risk[];
  status: string;
  notes: string | null;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
    doc.pipe(stream);

    const d = (v: Date) => v.toLocaleDateString('en-NG');

    doc.fontSize(18).fillColor('#1a2744').text('Progress Report', { align: 'center' });
    doc
      .fontSize(10)
      .fillColor('#666')
      .text('Triple A Realty / Sheet 3 — Rockvilla-style stakeholder report', {
        align: 'center',
      });
    doc.moveDown();
    doc.fontSize(10).fillColor('#333');
    doc.text(`Report No: ${data.number}`);
    doc.text(`Status: ${data.status}`);
    doc.text(`Project: ${data.projectName}`);
    doc.text(`Report date: ${d(data.reportDate)}`);
    if (data.preparedBy) doc.text(`Prepared by: ${data.preparedBy}`);
    doc.moveDown();

    doc.fontSize(12).fillColor('#1a2744').text('Summary', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333').text(data.summary);
    doc.moveDown(0.6);

    doc.fontSize(12).fillColor('#1a2744').text('Project team', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (!data.team.length) {
      doc.text('—');
    } else {
      for (const m of data.team) doc.text(`• ${m.role}: ${m.name}`);
    }
    doc.moveDown(0.6);

    const writeTasks = (title: string, tasks: Task[]) => {
      doc.fontSize(12).fillColor('#1a2744').text(title, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333');
      if (!tasks.length) {
        doc.text('—');
      } else {
        for (const t of tasks) {
          const bits = [
            t.description,
            t.date ? `date: ${t.date}` : null,
            t.status ? `status: ${t.status}` : null,
            t.owner ? `owner: ${t.owner}` : null,
            t.comments ? `comments: ${t.comments}` : null,
          ].filter(Boolean);
          doc.text(`• ${bits.join(' · ')}`);
        }
      }
      doc.moveDown(0.6);
    };

    writeTasks('Completed tasks and milestones', data.completed);
    writeTasks('Upcoming tasks and milestones', data.upcoming);

    doc.fontSize(12).fillColor('#1a2744').text('Top risks and issues', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#333');
    if (!data.risks.length) {
      doc.text('—');
    } else {
      for (const r of data.risks) {
        const bits = [
          r.issue,
          r.impact ? `impact: ${r.impact}` : null,
          r.action ? `action: ${r.action}` : null,
          r.owner ? `owner: ${r.owner}` : null,
        ].filter(Boolean);
        doc.text(`• ${bits.join(' · ')}`);
      }
    }
    doc.moveDown(0.6);

    if (data.notes) {
      doc.fontSize(12).fillColor('#1a2744').text('Notes', { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#333').text(data.notes);
    }

    doc.end();
  });
}
