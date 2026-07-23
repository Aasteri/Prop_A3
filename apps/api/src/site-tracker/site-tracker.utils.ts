import { Prisma } from '@prisma/client';

const MONTHS = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
] as const;

export async function generateRefCode(
  tx: Prisma.TransactionClient,
  siteCode: string,
  projectNumber: string | null | undefined,
  date: Date,
): Promise<string> {
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const projectNum = projectNumber ?? '000';
  const prefix = `AAA/${siteCode}/${projectNum}/${month}/${year}/`;

  const latest = await tx.dailySiteLog.findFirst({
    where: { refCode: { startsWith: prefix } },
    orderBy: { refCode: 'desc' },
    select: { refCode: true },
  });

  let seq = 1;
  if (latest) {
    const part = latest.refCode.slice(prefix.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(2, '0')}`;
}

export function canAccessSite(userSiteIds: string[], siteId: string, role: string): boolean {
  if (role === 'CEO' || role === 'ADMIN') return true;
  return userSiteIds.includes(siteId);
}

export function averageProgress(
  activities: { progressPercent: number }[],
): number {
  if (!activities.length) return 0;
  const sum = activities.reduce((acc, a) => acc + a.progressPercent, 0);
  return Math.round((sum / activities.length) * 100) / 100;
}
