import { LeadStage, Prisma } from '@prisma/client';

export async function generateLeadRef(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = 'LED-';
  const latest = await tx.lead.findFirst({
    where: { leadRef: { startsWith: prefix } },
    orderBy: { leadRef: 'desc' },
    select: { leadRef: true },
  });

  let seq = 1;
  if (latest) {
    const parsed = parseInt(latest.leadRef.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export async function generateClientRef(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = 'CLT-';
  const latest = await tx.client.findFirst({
    where: { clientRef: { startsWith: prefix } },
    orderBy: { clientRef: 'desc' },
    select: { clientRef: true },
  });

  let seq = 1;
  if (latest) {
    const parsed = parseInt(latest.clientRef.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(4, '0')}`;
}

export const PIPELINE_STAGES: LeadStage[] = [
  LeadStage.INQUIRY,
  LeadStage.CONTACTED,
  LeadStage.VIEWING,
  LeadStage.NEGOTIATION,
  LeadStage.RESERVED,
  LeadStage.WON,
  LeadStage.LOST,
];

export function stageLabel(stage: LeadStage): string {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}

export function nextStages(current: LeadStage): LeadStage[] {
  const idx = PIPELINE_STAGES.indexOf(current);
  if (idx === -1) return [];
  if (current === LeadStage.LOST || current === LeadStage.WON) return [];
  const next = PIPELINE_STAGES[idx + 1];
  const options: LeadStage[] = [LeadStage.LOST];
  if (next && next !== LeadStage.WON) options.unshift(next);
  return options;
}
