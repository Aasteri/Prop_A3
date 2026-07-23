import { InvoiceType, Prisma } from '@prisma/client';

const TYPE_CODES: Record<InvoiceType, string> = {
  SALES: 'SOL',
  VARIATION: 'VAR',
  AGENCY: 'AGY',
  SERVICE: 'SVC',
  RENTAL: 'RNT',
};

export async function generateInvoiceNumber(
  tx: Prisma.TransactionClient,
  invoiceType: InvoiceType,
  year: number,
): Promise<string> {
  const typeCode = TYPE_CODES[invoiceType];
  const prefix = `AAA/${year}/${typeCode}-`;
  const latest = await tx.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let seq = 1;
  if (latest) {
    const part = latest.invoiceNumber.slice(prefix.length);
    const parsed = parseInt(part, 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export async function nextVariationCode(
  tx: Prisma.TransactionClient,
  invoiceId: string,
): Promise<string> {
  const latest = await tx.invoiceVariation.findFirst({
    where: { invoiceId },
    orderBy: { variationCode: 'desc' },
    select: { variationCode: true },
  });

  let seq = 1;
  if (latest) {
    const parsed = parseInt(latest.variationCode.replace('V-', ''), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `V-${String(seq).padStart(2, '0')}`;
}

export async function generateReceiptNumber(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const prefix = `RCP/${year}/`;
  const latest = await tx.payment.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });

  let seq = 1;
  if (latest?.receiptNumber) {
    const parsed = parseInt(latest.receiptNumber.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export function calcLineTotal(quantity: number, unitPrice: number): number {
  return Math.round(quantity * unitPrice * 100) / 100;
}

export function recalcInvoiceTotals(
  baseTotal: number,
  variationTotal: number,
  paidTotal: number,
) {
  const revisedTotal = Math.round((baseTotal + variationTotal) * 100) / 100;
  const outstanding = Math.round((revisedTotal - paidTotal) * 100) / 100;
  return { revisedTotal, outstanding };
}
