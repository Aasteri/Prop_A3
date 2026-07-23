import { Prisma } from '@prisma/client';

export async function generateRequestRef(
  tx: Prisma.TransactionClient,
  siteCode: string,
): Promise<string> {
  const prefix = `MR-${siteCode}-`;
  const latest = await tx.materialRequest.findFirst({
    where: { requestRef: { startsWith: prefix } },
    orderBy: { requestRef: 'desc' },
    select: { requestRef: true },
  });

  let seq = 1;
  if (latest) {
    const part = latest.requestRef.slice(prefix.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function canAccessSite(userSiteIds: string[], siteId: string, role: string): boolean {
  if (role === 'CEO' || role === 'ADMIN') return true;
  return userSiteIds.includes(siteId);
}
