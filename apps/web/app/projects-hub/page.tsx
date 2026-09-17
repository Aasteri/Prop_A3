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
          href: '/work-schedule',
          title: 'Work schedule (WBS)',
          description: 'Sheet 1 task list: owners, dates, % done, payment milestones.',
          icon: 'calendar',
          status: 'live',
        },
        {
          href: '/labour-schedules',
          title: 'Labour schedules',
          description: 'Sheet 5 gang lines: trades, leaders, sizes, dates, and cost.',
          icon: 'users',
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
          status: 'live',
        },
        {
          href: '/ethics',
          title: 'Professional ethics',
          description: '10 site ethics principles with v1 staff acknowledgement.',
          icon: 'shield',
          status: 'live',
        },
        {
          href: '/planning-docs',
          title: 'Planning documents',
          description: 'TDP, C of O, soil test, Arch/Structural/M&E, BOQ, schedules.',
          icon: 'file',
          status: 'live',
        },
        {
          href: '/progress-reports',
          title: 'Progress reports',
          description: 'Sheet 3 Rockvilla-style stakeholder reports with PDF publish.',
          icon: 'clipboard',
          status: 'live',
        },
        {
          href: '/planning-cycles',
          title: 'Planning cycles',
          description: 'Doc 3 daily / weekly / monthly checklists and rhythm.',
          icon: 'calendar',
          status: 'live',
        },
        {
          href: '/charters',
          title: 'Charters & kick-off',
          description: 'Doc 1 dual sign-off unlocks Doc 2 kick-off minutes.',
          icon: 'flag',
          status: 'live',
        },
        {
          href: '/retrospectives',
          title: 'Retrospectives',
          description: 'Doc 8 lessons learned and optional client testimonial.',
          icon: 'clipboard',
          status: 'live',
        },
        {
          href: '/ivcs',
          title: 'IVC certificates',
          description: 'Doc 6 measured % valuation before subcontractor payment.',
          icon: 'invoice',
          status: 'live',
        },
        {
          href: '/closeouts',
          title: 'Project closeouts',
          description: 'Doc 7 handover: floor/zone features, open items, client ack.',
          icon: 'check',
          status: 'live',
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
