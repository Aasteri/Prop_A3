'use client';

import { HubPage } from '@/components/ModulePage';
import { getPropertyStage } from '@/lib/process-stages';
import { notFound } from 'next/navigation';

function PropertyStagePage({ slug }: { slug: string }) {
  const stage = getPropertyStage(slug);
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

export default function PropertyOnboardPage() {
  return <PropertyStagePage slug="onboard" />;
}
