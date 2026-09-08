/**
 * Removes all operational and seeded demo content.
 * Keeps: staff user accounts, site definitions (JKW/MPP/GZ2/GZ3), user↔site assignments.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

export type PurgeDemoDataResult = {
  deleted: Record<string, number>;
  uploadsCleared: boolean;
};

const UPLOAD_SUBDIRS = ['site-logs', 'payments', 'fcda', 'documents'] as const;

function uploadsRoot(): string {
  const candidates = [
    path.join(process.cwd(), 'uploads'),
    path.join(process.cwd(), '..', '..', 'uploads'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return path.join(process.cwd(), 'uploads');
}

function clearUploadFiles(): boolean {
  const root = uploadsRoot();
  if (!fs.existsSync(root)) return false;

  for (const sub of UPLOAD_SUBDIRS) {
    const dir = path.join(root, sub);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isFile()) fs.unlinkSync(full);
    }
  }
  return true;
}

export async function purgeDemoData(prisma: PrismaClient): Promise<PurgeDemoDataResult> {
  const deleted: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    await tx.tenantApplication.updateMany({ data: { agencyFeeInvoiceId: null } });

    const steps: [string, () => Promise<{ count: number }>][] = [
      ['payments', () => tx.payment.deleteMany()],
      ['invoiceVariations', () => tx.invoiceVariation.deleteMany()],
      ['invoiceLines', () => tx.invoiceLine.deleteMany()],
      ['invoices', () => tx.invoice.deleteMany()],
      ['hseIncidents', () => tx.hseIncident.deleteMany()],
      ['materialRequests', () => tx.materialRequest.deleteMany()],
      ['dailySiteLogs', () => tx.dailySiteLog.deleteMany()],
      ['projectChangeLogs', () => tx.projectChangeLog.deleteMany()],
      ['documents', () => tx.document.deleteMany()],
      ['tenantApplications', () => tx.tenantApplication.deleteMany()],
      ['tenantProfiles', () => tx.tenantProfile.deleteMany()],
      ['estateTerrierRows', () => tx.estateTerrierRow.deleteMany()],
      ['rentalEstates', () => tx.rentalEstate.deleteMany()],
      ['clientProjects', () => tx.clientProject.deleteMany()],
      ['clients', () => tx.client.deleteMany()],
      ['leads', () => tx.lead.deleteMany()],
      ['listings', () => tx.listing.deleteMany()],
      ['milestones', () => tx.milestone.deleteMany()],
      ['projects', () => tx.project.deleteMany()],
      ['settlementEntities', () => tx.settlementEntity.deleteMany()],
      ['professionalLicences', () => tx.professionalLicence.deleteMany()],
      ['notifications', () => tx.notification.deleteMany()],
      ['auditEvents', () => tx.auditEvent.deleteMany()],
      ['passwordResetTokens', () => tx.passwordResetToken.deleteMany()],
    ];

    for (const [key, op] of steps) {
      const { count } = await op();
      deleted[key] = count;
    }
  });

  const uploadsCleared = clearUploadFiles();
  return { deleted, uploadsCleared };
}
