'use client';

import { useParams } from 'next/navigation';
import { BuildingModulePage } from '@/components/ModulePage';

const SPECS: Record<
  string,
  { title: string; description: string; specRefs: string[]; backHref: string; backLabel: string }
> = {
  feasibility: {
    title: 'Feasibility & stakeholders',
    description:
      'Preliminary feasibility studies, budget band, and stakeholder register for project initiation.',
    specRefs: ['PM Initiate — feasibility', 'Project charter prerequisites'],
    backHref: '/projects/initiate',
    backLabel: 'Initiate',
  },
  'qc-planning': {
    title: 'Quality control · Planning',
    description: 'Inspection & test plan and QC planning artifacts before construction starts.',
    specRefs: ['QC Planning (review meeting)', 'Inspections module extension'],
    backHref: '/projects/plan',
    backLabel: 'Plan',
  },
  workforce: {
    title: 'Workforce form',
    description:
      'Dedicated workforce time, attendance, and pay capture — separate from materials and subcontractors.',
    specRefs: ['Workforce tracker (Phase 2)', 'Labour schedules (interim)'],
    backHref: '/projects/execute',
    backLabel: 'Execute',
  },
  'qc-execution': {
    title: 'Quality control · Execution',
    description: 'In-progress QC checks during construction, distinct from QC planning.',
    specRefs: ['QC Execution (review meeting)', 'Live Inspections module'],
    backHref: '/projects/execute',
    backLabel: 'Execute',
  },
};

export default function ProjectsComingSoonPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const spec = SPECS[slug] ?? {
    title: 'Coming soon',
    description: 'This module is scheduled for a later phase of the process-group redesign.',
    specRefs: ['Process-group navigation Phase 2'],
    backHref: '/projects/initiate',
    backLabel: 'Projects',
  };

  return (
    <BuildingModulePage
      title={spec.title}
      description={spec.description}
      specRefs={spec.specRefs}
      backHref={spec.backHref}
      backLabel={spec.backLabel}
    />
  );
}
