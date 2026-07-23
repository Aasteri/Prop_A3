import { Prisma } from '@prisma/client';

export async function generateApplicationRef(
  tx: Prisma.TransactionClient,
  estateCode: string,
): Promise<string> {
  const prefix = `APP-${estateCode}-`;
  const latest = await tx.tenantApplication.findFirst({
    where: { applicationRef: { startsWith: prefix } },
    orderBy: { applicationRef: 'desc' },
    select: { applicationRef: true },
  });

  let seq = 1;
  if (latest) {
    const parsed = parseInt(latest.applicationRef.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function calcAgencyFee(rentAccepted: number): number {
  return Math.round(rentAccepted * 0.2 * 100) / 100;
}

export function calcNetRentalIncome(rentAmount: number, expenseAmount: number): number {
  return Math.round((rentAmount - expenseAmount) * 100) / 100;
}

export const CLAUSE_1 =
  'I understand that this application is not a rental agreement and does not create any obligation on Mgt or Landlord.';

export const CLAUSE_2 =
  'This form shall serve as an acceptance to pay a total of 20% of the rental value as Agency and Legal fee for the Professional services to be rendered.';
