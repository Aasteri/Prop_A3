'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BuildingModulePage } from '@/components/ModulePage';

/** Old coming-soon URLs → live modules (bookmarks / stale links). */
const LIVE_REDIRECTS: Record<string, string> = {
  feasibility: '/feasibility',
  'qc-planning': '/qc-plans',
  workforce: '/workforce',
  'qc-execution': '/inspections',
};

export default function ProjectsComingSoonPage() {
  const params = useParams();
  const router = useRouter();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const live = LIVE_REDIRECTS[slug];

  useEffect(() => {
    if (live) router.replace(live);
  }, [live, router]);

  if (live) {
    return (
      <p className="p-8 text-center text-sm text-slate-600">Redirecting to the live module…</p>
    );
  }

  return (
    <BuildingModulePage
      title="Coming soon"
      description="This module is scheduled for a later phase of the process-group redesign."
      specRefs={['Process-group navigation']}
      backHref="/projects/initiate"
      backLabel="Projects"
    />
  );
}
