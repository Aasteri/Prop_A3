'use client';

import { HubPage } from '@/components/ModulePage';

export default function ProjectsHubPage() {
  return (
    <HubPage
      eyebrow="Pillar · Projects"
      title="Construction project management"
      subtitle="Initiation through closure: site works, schedule, change control, inspections, and planning documents — controlled workflow, not a tracker."
      links={[
        {
          href: '/site-tracker',
          title: 'Site tracker',
          description: 'Daily site logs, manpower, materials, HSE flags, PM approval.',
          icon: 'clipboard',
          status: 'live',
        },
        {
          href: '/milestones',
          title: 'Schedule & milestones',
          description: 'WBS progress, milestone certification, project timeline.',
          icon: 'calendar',
          status: 'live',
        },
        {
          href: '/change-log',
          title: 'Change control',
          description: 'Scope variations with cost/time impact and approvals.',
          icon: 'changes',
          status: 'live',
        },
        {
          href: '/inspections',
          title: 'Inspections & QC',
          description: '20-category inspection log, pre-pour gates, snag closeout.',
          icon: 'check',
          status: 'building',
        },
        {
          href: '/planning-docs',
          title: 'Planning documents',
          description: 'TDP, C of O, soil test, Arch/Structural/M&E, BOQ, schedules.',
          icon: 'file',
          status: 'building',
        },
        {
          href: '/material-requests',
          title: 'Site material issues',
          description: 'Foreman → PM → store issue against site demand.',
          icon: 'package',
          status: 'live',
        },
      ]}
    />
  );
}
