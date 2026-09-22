'use client';

import { HubPage } from '@/components/ModulePage';
import { getPropertyStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

export default function PropertyExitPage() {
  const stage = getPropertyStage('exit');
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
