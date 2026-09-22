import type { HubLink } from '@/components/ModuleHub';

/** Chronological stage hubs for Projects · Property · Procurement */

export type ProcessStageDef = {
  slug: string;
  label: string;
  href: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  links: HubLink[];
};

export const PROJECT_PROCESS_GROUPS = [
  'INITIATE',
  'PLAN',
  'EXECUTE',
  'MONITOR',
  'CLOSE',
] as const;

export type ProjectProcessGroup = (typeof PROJECT_PROCESS_GROUPS)[number];

export const PROCESS_GROUP_META: Record<
  ProjectProcessGroup,
  { label: string; href: string; short: string }
> = {
  INITIATE: { label: 'Initiate', href: '/projects/initiate', short: '1 · Initiate' },
  PLAN: { label: 'Plan', href: '/projects/plan', short: '2 · Plan' },
  EXECUTE: { label: 'Execute', href: '/projects/execute', short: '3 · Execute' },
  MONITOR: { label: 'Monitor & Control', href: '/projects/monitor', short: '4 · Monitor' },
  CLOSE: { label: 'Close', href: '/projects/close', short: '5 · Close' },
};

export const PROJECT_STAGES: ProcessStageDef[] = [
  {
    slug: 'initiate',
    label: 'Initiate',
    href: '/projects/initiate',
    eyebrow: 'Projects · 1 of 5 · Initiate',
    title: 'Initiate',
    subtitle:
      'Should we build it? Charter, brief, ethics, and planning documents that authorize the project — in order.',
    links: [
      {
        href: '/charters',
        title: '1. Charters & kick-off',
        description: 'Project charter dual sign-off unlocks kick-off minutes.',
        icon: 'flag',
        status: 'live',
      },
      {
        href: '/planning-docs',
        title: '2. Planning documents',
        description: 'TDP, C of O, soil test, Arch/Structural/M&E, BOQ packages.',
        icon: 'file',
        status: 'live',
      },
      {
        href: '/ethics',
        title: '3. Professional ethics',
        description: 'Site supervisor ethics acknowledgement before works.',
        icon: 'shield',
        status: 'live',
      },
      {
        href: '/projects/coming-soon/feasibility',
        title: '4. Feasibility & stakeholders',
        description: 'Preliminary feasibility, budget band, and stakeholder register.',
        icon: 'users',
        status: 'building',
      },
    ],
  },
  {
    slug: 'plan',
    label: 'Plan',
    href: '/projects/plan',
    eyebrow: 'Projects · 2 of 5 · Plan',
    title: 'Plan',
    subtitle:
      'What are we building, how much will it cost, and how will we build it? Schedule and plans first.',
    links: [
      {
        href: '/work-schedule',
        title: '1. Work schedule (WBS)',
        description: 'Task list: owners, dates, % done, payment milestones.',
        icon: 'calendar',
        status: 'live',
      },
      {
        href: '/milestones',
        title: '2. Schedule & milestones',
        description: 'Foundation → Shell → Finishing → Handover with FCDA gate.',
        icon: 'calendar',
        status: 'live',
      },
      {
        href: '/labour-schedules',
        title: '3. Labour schedules',
        description: 'Gang lines: trades, leaders, sizes, dates, and cost.',
        icon: 'users',
        status: 'live',
      },
      {
        href: '/planning-cycles',
        title: '4. Planning cycles',
        description: 'Daily / weekly / monthly rhythm checklists.',
        icon: 'calendar',
        status: 'live',
      },
      {
        href: '/planning-docs',
        title: '5. Planning documents',
        description: 'Design packs, BOQ, and programme attachments.',
        icon: 'file',
        status: 'live',
      },
      {
        href: '/qc-plans',
        title: '6. Quality control · Planning',
        description: 'QC plan, inspection & test plan before execution.',
        icon: 'check',
        status: 'live',
      },
    ],
  },
  {
    slug: 'execute',
    label: 'Execute',
    href: '/projects/execute',
    eyebrow: 'Projects · 3 of 5 · Execute',
    title: 'Execute',
    subtitle: 'Build it. Site works, materials, subcontractors, and controlled changes.',
    links: [
      {
        href: '/site-tracker',
        title: '1. Site tracker',
        description: 'Daily site logs, manpower, materials, HSE, PM approval.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/material-requests',
        title: '2. Material requests',
        description: 'Foreman → PM → store issue against site demand.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/procurement/works',
        title: '3. Works / subcontractors',
        description: 'Works contracts linked to projects and IVCs.',
        icon: 'hardhat',
        status: 'live',
      },
      {
        href: '/change-log',
        title: '4. Change control',
        description: 'Scope variations with cost/time impact and approvals.',
        icon: 'changes',
        status: 'live',
      },
      {
        href: '/workforce',
        title: '5. Workforce form',
        description: 'Separate workforce time, attendance, and pay capture.',
        icon: 'users',
        status: 'live',
      },
      {
        href: '/cost-trackers',
        title: '6. Cost trackers',
        description: 'Materials, workforce, and subcontractor usage & cost roll-up.',
        icon: 'invoice',
        status: 'live',
      },
      {
        href: '/inspections',
        title: '7. Quality control · Execution',
        description: 'In-progress QC checks and inspection GPS during construction.',
        icon: 'check',
        status: 'live',
      },
    ],
  },
  {
    slug: 'monitor',
    label: 'Monitor & Control',
    href: '/projects/monitor',
    eyebrow: 'Projects · 4 of 5 · Monitor & Control',
    title: 'Monitor & Control',
    subtitle:
      'Are we on time, on budget, and to specification? Compare plan vs actual and correct course.',
    links: [
      {
        href: '/progress-reports',
        title: '1. Progress reports',
        description: 'Stakeholder progress packs with PDF publish.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/inspections',
        title: '2. Inspections & QC',
        description: 'Inspection log, pre-pour gates, snag closeout.',
        icon: 'check',
        status: 'live',
      },
      {
        href: '/ivcs',
        title: '3. IVC certificates',
        description: 'Measured % valuation before subcontractor payment.',
        icon: 'invoice',
        status: 'live',
      },
      {
        href: '/change-log',
        title: '4. Change control',
        description: 'Track approved variations against baseline.',
        icon: 'changes',
        status: 'live',
      },
      {
        href: '/milestones',
        title: '5. Milestone progress',
        description: 'Stage % complete, FCDA gate, engineer certification.',
        icon: 'calendar',
        status: 'live',
      },
      {
        href: '/project-finance',
        title: '6. Project finance',
        description: 'Budget vs spend with PDF/CSV export.',
        icon: 'invoice',
        status: 'live',
      },
      {
        href: '/project-analysis',
        title: '7. Project analysis',
        description: 'Plan vs actual: milestones, QC, changes, finance.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/field-map',
        title: '8. Field map',
        description: 'Sites, artisan pins, and inspection GPS on one map.',
        icon: 'map',
        status: 'live',
      },
    ],
  },
  {
    slug: 'close',
    label: 'Close',
    href: '/projects/close',
    eyebrow: 'Projects · 5 of 5 · Close',
    title: 'Close',
    subtitle: 'Complete, inspect, hand over, and close contracts — then capture lessons learned.',
    links: [
      {
        href: '/closeouts',
        title: '1. Project closeouts',
        description: 'Handover report: features, open items, client acknowledgement.',
        icon: 'check',
        status: 'live',
      },
      {
        href: '/retrospectives',
        title: '2. Retrospectives',
        description: 'Lessons learned and optional client testimonial.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/documents',
        title: '3. Documents archive',
        description: 'Company document vault for as-builts and O&M packs.',
        icon: 'file',
        status: 'live',
      },
    ],
  },
];

export const PROPERTY_STAGES: ProcessStageDef[] = [
  {
    slug: 'onboard',
    label: 'Onboard',
    href: '/property/onboard',
    eyebrow: 'Property · 1 of 5 · Onboard',
    title: 'Onboard',
    subtitle: 'Bring assets onto the books and set up estate occupancy tracking.',
    links: [
      {
        href: '/property-management',
        title: '1. Property assets',
        description: 'Register and manage property assets for letting.',
        icon: 'home',
        status: 'live',
      },
      {
        href: '/estate-terrier',
        title: '2. Estate terrier',
        description: 'Unit occupancy matrix and estate setup.',
        icon: 'map',
        status: 'live',
      },
      {
        href: '/inventories',
        title: '3. Inventories (check-in)',
        description: 'Condition schedules at handover into management.',
        icon: 'clipboard',
        status: 'live',
      },
    ],
  },
  {
    slug: 'let',
    label: 'Let',
    href: '/property/let',
    eyebrow: 'Property · 2 of 5 · Let',
    title: 'Let',
    subtitle: 'Screen applicants and create tenancies. Sales viewings live under Sales & CRM.',
    links: [
      {
        href: '/tenant-applications',
        title: '1. Tenant applications',
        description: 'Bio-data, screening, and FM evaluation.',
        icon: 'key',
        status: 'live',
      },
      {
        href: '/viewings',
        title: '2. Viewings (Sales & CRM)',
        description: 'Property viewings — also listed under Sales & CRM.',
        icon: 'eye',
        status: 'live',
      },
      {
        href: '/tenancies',
        title: '3. Create tenancies',
        description: 'Agreements, deposits, and lease start.',
        icon: 'contract',
        status: 'live',
      },
    ],
  },
  {
    slug: 'occupy',
    label: 'Occupy & Collect',
    href: '/property/occupy',
    eyebrow: 'Property · 3 of 5 · Occupy & Collect',
    title: 'Occupy & Collect',
    subtitle: 'Active leases, service charges, landlord remittances, and purchaser instalments.',
    links: [
      {
        href: '/tenancies',
        title: '1. Tenancies',
        description: 'Active leases and renewals.',
        icon: 'contract',
        status: 'live',
      },
      {
        href: '/service-charges',
        title: '2. Service charges',
        description: 'Estate service charge accounts.',
        icon: 'wallet',
        status: 'live',
      },
      {
        href: '/remittances',
        title: '3. Landlord remittances',
        description: 'Remittance runs to property owners.',
        icon: 'transfer',
        status: 'live',
      },
      {
        href: '/instalments',
        title: '4. Purchaser instalments',
        description: 'Instalment plans for purchasers.',
        icon: 'invoice',
        status: 'live',
      },
    ],
  },
  {
    slug: 'maintain',
    label: 'Maintain',
    href: '/property/maintain',
    eyebrow: 'Property · 4 of 5 · Maintain',
    title: 'Maintain',
    subtitle: 'Keep assets serviceable under management fee schedules.',
    links: [
      {
        href: '/maintenance',
        title: '1. Maintenance',
        description: 'Tickets and work orders.',
        icon: 'wrench',
        status: 'live',
      },
      {
        href: '/inventories',
        title: '2. Inventories (ongoing)',
        description: 'Periodic condition updates.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/pm-engagements',
        title: '3. PM fee schedules',
        description: 'Management fee % per owner engagement.',
        icon: 'contract',
        status: 'live',
      },
    ],
  },
  {
    slug: 'exit',
    label: 'Exit',
    href: '/property/exit',
    eyebrow: 'Property · 5 of 5 · Exit',
    title: 'Exit',
    subtitle: 'Check-out, end tenancy, and settle deposits.',
    links: [
      {
        href: '/inventories',
        title: '1. Inventories (check-out)',
        description: 'Exit condition schedule vs check-in.',
        icon: 'clipboard',
        status: 'live',
      },
      {
        href: '/tenancies',
        title: '2. End tenancy',
        description: 'Close or renew the lease record.',
        icon: 'contract',
        status: 'live',
      },
      {
        href: '/property/coming-soon/deposit-settlement',
        title: '3. Deposit settlement',
        description: 'Caution / deposit reconciliation at exit.',
        icon: 'wallet',
        status: 'building',
      },
    ],
  },
];

export const PROCUREMENT_STAGES: ProcessStageDef[] = [
  {
    slug: 'plan',
    label: 'Plan',
    href: '/procurement/plan',
    eyebrow: 'Procurement · 1 of 5 · Plan',
    title: 'Plan',
    subtitle: 'Vendors and category strategy before raising demands.',
    links: [
      {
        href: '/vendors',
        title: '1. Vendors & suppliers',
        description: 'Supplier/OEM registry and performance.',
        icon: 'store',
        status: 'live',
      },
      {
        href: '/procurement',
        title: '2. Procurement overview',
        description: 'Goods · Services · Works fee rules and hubs.',
        icon: 'cart',
        status: 'live',
      },
    ],
  },
  {
    slug: 'request',
    label: 'Request',
    href: '/procurement/request',
    eyebrow: 'Procurement · 2 of 5 · Request',
    title: 'Request',
    subtitle: 'Raise demand: site materials, goods PR, and service requests.',
    links: [
      {
        href: '/material-requests',
        title: '1. Material requests',
        description: 'Site indent / issue flow.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/procurement/goods',
        title: '2. Goods (PR)',
        description: 'Purchase requisitions for warehouse/external supply.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/procurement/services',
        title: '3. Service requests',
        description: 'Artisan / labour service demands.',
        icon: 'users',
        status: 'live',
      },
    ],
  },
  {
    slug: 'source',
    label: 'Source',
    href: '/procurement/source',
    eyebrow: 'Procurement · 3 of 5 · Source',
    title: 'Source',
    subtitle: 'Commit supply: POs, works contracts, artisan assignment.',
    links: [
      {
        href: '/procurement/goods',
        title: '1. Purchase orders',
        description: 'PO against approved requisitions.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/procurement/works',
        title: '2. Works contracts',
        description: 'Subcontractor works packages.',
        icon: 'hardhat',
        status: 'live',
      },
      {
        href: '/procurement/services',
        title: '3. Assign artisans',
        description: 'KYC artisans, estimate, and assign.',
        icon: 'users',
        status: 'live',
      },
    ],
  },
  {
    slug: 'fulfil',
    label: 'Fulfil',
    href: '/procurement/fulfil',
    eyebrow: 'Procurement · 4 of 5 · Fulfil',
    title: 'Fulfil',
    subtitle: 'Receive goods, issue to site, and value works in progress.',
    links: [
      {
        href: '/procurement/goods',
        title: '1. GRN / delivery',
        description: 'Goods received against PO.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/material-requests',
        title: '2. Site issue',
        description: 'Issue approved material requests to site.',
        icon: 'package',
        status: 'live',
      },
      {
        href: '/ivcs',
        title: '3. IVC in progress',
        description: 'Interim valuations on works contracts.',
        icon: 'invoice',
        status: 'live',
      },
    ],
  },
  {
    slug: 'close',
    label: 'Close & Pay',
    href: '/procurement/close',
    eyebrow: 'Procurement · 5 of 5 · Close & Pay',
    title: 'Close & Pay',
    subtitle: 'Complete valuations and settle suppliers / subcontractors.',
    links: [
      {
        href: '/ivcs',
        title: '1. Complete IVCs',
        description: 'Final measured valuations.',
        icon: 'invoice',
        status: 'live',
      },
      {
        href: '/payouts',
        title: '2. Payouts',
        description: 'Outbound settlements to vendors and works.',
        icon: 'transfer',
        status: 'live',
      },
      {
        href: '/invoices',
        title: '3. Invoices',
        description: 'Client / commercial invoices linked to works and sales.',
        icon: 'invoice',
        status: 'live',
      },
    ],
  },
];

export function getProjectStage(slug: string): ProcessStageDef | undefined {
  return PROJECT_STAGES.find((s) => s.slug === slug);
}

export function getPropertyStage(slug: string): ProcessStageDef | undefined {
  return PROPERTY_STAGES.find((s) => s.slug === slug);
}

export function getProcurementStage(slug: string): ProcessStageDef | undefined {
  return PROCUREMENT_STAGES.find((s) => s.slug === slug);
}
