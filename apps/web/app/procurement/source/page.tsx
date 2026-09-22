'use client';

import { HubPage } from '@/components/ModulePage';
import { getProcurementStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

export default function ProcurementSourceStagePage() {
  const stage = getProcurementStage('source');
  if (!stage) notFound();
  return (
    <HubPage
      eyebrow={stage.eyebrow}
      title={stage.title}
      subtitle={stage.subtitle}
      links={stage.links}
    />
  );
}
