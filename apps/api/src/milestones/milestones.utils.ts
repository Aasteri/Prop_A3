import { BadRequestException } from '@nestjs/common';
import { MilestoneStage } from '@prisma/client';

export function capMilestoneProgress(
  stage: MilestoneStage,
  progressPct: number,
  hasFcdaPermit: boolean,
): number {
  const capped = Math.min(Math.max(progressPct, 0), 100);
  if (stage === MilestoneStage.FOUNDATION && !hasFcdaPermit && capped >= 100) {
    throw new BadRequestException(
      'FCDA permit required before Foundation can reach 100%. Upload permit on the project first.',
    );
  }
  return capped;
}

export function gateFoundationProgress(
  stage: MilestoneStage,
  progressPct: number,
  hasFcdaPermit: boolean,
): number {
  if (stage === MilestoneStage.FOUNDATION && !hasFcdaPermit) {
    return Math.min(progressPct, 99);
  }
  return Math.min(progressPct, 100);
}

export const STAGE_ORDER: MilestoneStage[] = [
  MilestoneStage.FOUNDATION,
  MilestoneStage.SHELL,
  MilestoneStage.FINISHING,
  MilestoneStage.HANDOVER,
];

export function stageLabel(stage: MilestoneStage): string {
  return stage.charAt(0) + stage.slice(1).toLowerCase();
}
