import { Prisma } from '@prisma/client';

export async function generateChangeId(
  tx: Prisma.TransactionClient,
  siteCode: string,
): Promise<string> {
  const prefix = `CHG-${siteCode}-`;
  const latest = await tx.projectChangeLog.findFirst({
    where: { changeId: { startsWith: prefix } },
    orderBy: { changeId: 'desc' },
    select: { changeId: true },
  });

  let seq = 1;
  if (latest) {
    const part = latest.changeId.slice(prefix.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function canAccessSite(userSiteIds: string[], siteId: string, role: string): boolean {
  if (role === 'CEO' || role === 'ADMIN') return true;
  return userSiteIds.includes(siteId);
}
