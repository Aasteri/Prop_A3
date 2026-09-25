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
  charters: '/charters',
  'work-schedule': '/work-schedule',
  'planning-docs': '/planning-docs',
  'cost-trackers': '/cost-trackers',
  'project-finance': '/project-finance',
  'labour-schedules': '/labour-schedules',
  'plant-equipment-schedules': '/plant-equipment-schedules',
  'project-cashbooks': '/project-cashbooks',
  'planning-cycles': '/planning-cycles',
  'progress-reports': '/progress-reports',
  retrospectives: '/retrospectives',
  closeouts: '/closeouts',
  inspections: '/inspections',
  'site-tracker': '/site-tracker',
  'material-requests': '/material-requests',
  'change-log': '/change-log',
  ivcs: '/ivcs',
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
