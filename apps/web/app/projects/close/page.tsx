'use client';

import { HubPage } from '@/components/ModulePage';
import { getProjectStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

const SLUG = 'close';

export default function ProjectsClosePage() {
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
