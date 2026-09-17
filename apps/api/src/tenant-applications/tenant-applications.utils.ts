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

export function calcAgencyFee(rentAccepted: number, pct = 20): number {
  // Doc 12 application clause: combined Agency+Legal (default 20% of rental value).
  // Configurable per PM engagement — Doc 10 offer split stays separate.
  return Math.round(rentAccepted * (pct / 100) * 100) / 100;
}

export function calcEvaluationAverage(c1: number, c2: number, c3: number, c4: number): number {
  return Math.round(((c1 + c2 + c3 + c4) / 4) * 10) / 10;
}

/** Advisory guidance labels only — final accept/reject is a human decision (G.5.2 / G.5.3). */
export function evaluationBand(average: number): 'PREFERRED' | 'ACCEPTABLE' | 'BORDERLINE' | 'UNSUITABLE' {
  if (average >= 7.5) return 'PREFERRED';
  if (average >= 6.0) return 'ACCEPTABLE';
  if (average >= 4.0) return 'BORDERLINE';
  return 'UNSUITABLE';
}

export const TENANT_EVALUATION_CRITERIA = [
  {
    key: 'c1' as const,
    label: 'Compatibility of tenant/use with property',
    help: 'Family size vs property size, intended use, suitability, pressure on facilities. Example: ~10 people for a 2-bed → low score.',
  },
  {
    key: 'c2' as const,
    label: 'Ability to pay',
    help: 'Income, employment/business, and expenses vs rent. May use market knowledge; company may investigate. Example: low income vs ₦5m/year rent → low score.',
  },
  {
    key: 'c3' as const,
    label: 'Reason for vacating previous property',
    help: 'Based on information obtained about why they left their last residence.',
  },
  {
    key: 'c4' as const,
    label: 'Guarantor',
    help: 'Guarantor’s ability to attest character, reliability, care of property, and meeting obligations.',
  },
];


export function calcNetRentalIncome(rentAmount: number, expenseAmount: number): number {
  return Math.round((rentAmount - expenseAmount) * 100) / 100;
}

export const CLAUSE_1 =
  'I understand that this application is not a rental agreement and does not create any obligation on Mgt or Landlord.';

export function clause2Text(pct = 20): string {
  return `This form shall serve as an acceptance to pay a total of ${pct}% of the rental value as Agency and Legal fee for the Professional services to be rendered.`;
}

/** @deprecated Prefer clause2Text(pct) for engagement-aware wording */
export const CLAUSE_2 = clause2Text(20);
