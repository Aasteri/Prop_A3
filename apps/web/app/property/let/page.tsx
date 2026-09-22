'use client';

import { HubPage } from '@/components/ModulePage';
import { getPropertyStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

export default function PropertyLetPage() {
  const stage = getPropertyStage('let');
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
