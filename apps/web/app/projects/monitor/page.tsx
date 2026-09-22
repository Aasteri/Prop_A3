'use client';

import { HubPage } from '@/components/ModulePage';
import { getProjectStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

const SLUG = 'monitor';

export default function ProjectsMonitorPage() {
  const stage = getProjectStage(SLUG);
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
