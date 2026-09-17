export type GuideTerm = { term: string; definition: string };

export type GuideStep = { title: string; body: string };

export type GuideSection = {
  id: string;
  title: string;
  summary: string;
  who: string;
  steps: GuideStep[];
  tips?: string[];
  related?: string[];
};

/** In-app staff user guide — keep aligned with live modules on main. */
export const GLOSSARY: GuideTerm[] = [
  {
    term: 'FM (Facility / property management)',
    definition:
      'Letting and management of rental properties: tenant applications, scoring, inventories, maintenance, service charges, and landlord remittances. Not “finance manager.”',
  },
  {
    term: 'JV (Joint venture)',
    definition:
      'A sales pathway where an owner partners with Triple A (or another company) on a property instead of a straight sale. Exact commercial share/return fields are still WAITING client confirmation.',
  },
  {
    term: 'Charter',
    definition:
      'Project initiation authority (Doc 1). Dual company + client sign-off approves the project and unlocks kick-off publish.',
  },
  {
    term: 'Kick-off',
    definition:
      'First planning meeting minutes (Doc 2): attendees, Doc 2 agenda, actions. Publish requires an APPROVED charter.',
  },
  {
    term: 'WBS / Work schedule',
    definition:
      'Work Breakdown Structure — numbered task list (Sheet 1) with owners, dates, % done, and payment-milestone (PMT) flags.',
  },
  {
    term: 'IVC',
    definition:
      'Interim Valuation Certificate (Doc 6). Measured % of works before paying a subcontractor. PM + supervisor sign-off before APPROVED.',
  },
  {
    term: 'PMT',
    definition: 'Payment milestone flag on a WBS task — links schedule progress to valuation / pay stages.',
  },
  {
    term: 'Terrier / Estate terrier',
    definition:
      'Unit register for an estate (plot/flat rows). Tenant approval links the applicant to a terrier unit.',
  },
  {
    term: 'Doc 10 vs Doc 12 fees',
    definition:
      'Doc 12 application clause uses combined Agency+Legal % (often 20%). Doc 10 offer letter splits Agency / Legal / Management (often 10%+5%+5%). Do not mix them.',
  },
  {
    term: 'Service charge (SC)',
    definition:
      'Levy collected for estate/facility upkeep. Available SC is the spending boundary for FM maintenance — not a free float.',
  },
  {
    term: 'Remittance',
    definition: 'Net rent (and related) paid out to the landlord after agreed deductions.',
  },
  {
    term: 'Instalment plan',
    definition:
      'Purchaser 6-month (or configured) payment schedule for property sales — staff ledger + client portal balance.',
  },
  {
    term: 'Pre-pour gate',
    definition:
      'QC rule: a Pre-pour / concrete pour inspection cannot PASS until checklist items are YES/NA and the section is signed.',
  },
  {
    term: 'BOQ',
    definition: 'Bill of Quantities — estimated materials/labour baseline for a project (often attached as a planning document).',
  },
  {
    term: 'GRN',
    definition: 'Goods Received Note — confirms materials arrived against a purchase order.',
  },
  {
    term: 'Works ~10% / Services 2.5%',
    definition:
      'CONFIRMED platform fees: ~10% of works contract sum; 2.5% on artisan/professional service fees (materials excluded from the 2.5% base).',
  },
  {
    term: 'Settlement entity',
    definition: 'Named bank account / payee used on invoices and offer letters (landlord, management, agency).',
  },
  {
    term: 'Override (tenant scoring)',
    definition:
      'Written reason allowing approval when the average score guidance is BORDERLINE or UNSUITABLE. Creates an audit trail.',
  },
];

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    summary: 'Sign in, choose the right hub, and know which role can do what.',
    who: 'All staff',
    steps: [
      {
        title: 'Sign in',
        body: 'Open the staff login. Your role (CEO, PROJECT_MANAGER, SALES, FINANCE, FOREMAN, etc.) controls menus and buttons.',
      },
      {
        title: 'Use the hubs',
        body: 'Projects hub, Properties hub, and Procurement hub group related screens. Prefer hubs when you are unsure where a feature lives.',
      },
      {
        title: 'Notifications',
        body: 'The bell shows items needing attention (IVC submitted, charter review, missing daily log, instalment, etc.).',
      },
      {
        title: 'This user guide',
        body: 'Keep /user-guide open in a second tab. Search the glossary for any acronym before asking the team.',
      },
    ],
    tips: [
      'CLIENT users use the Client Portal (/portal), not staff hubs.',
      'Never invent fees or legal clauses — use PM engagement schedules and EXTRACTED docs.',
    ],
  },
  {
    id: 'projects-initiation',
    title: 'Projects — initiation (charter & kick-off)',
    summary: 'Authorize the project before planning and site work.',
    who: 'PM, CEO, Admin',
    steps: [
      {
        title: 'Create charter (Doc 1)',
        body: 'Projects → Charters & kick-off → New charter. Fill summary, goals, deliverables, risks, scope, team. Save draft.',
      },
      {
        title: 'Submit & dual sign',
        body: 'Submit for review → Company sign → Client sign. When both are signed the charter becomes APPROVED and PLANNING projects can flip to ACTIVE.',
      },
      {
        title: 'Kick-off (Doc 2)',
        body: 'Create kick-off minutes (attendees Name|Role|Email|Phone; actions Action|Owner|Due). Publish only after charter is APPROVED.',
      },
    ],
    related: ['/charters'],
  },
  {
    id: 'projects-planning',
    title: 'Projects — planning (WBS, labour, D/W/M, docs)',
    summary: 'Turn authority into a controllable plan.',
    who: 'PM, Engineer, Foreman (view)',
    steps: [
      {
        title: 'Work schedule (Sheet 1)',
        body: 'Add WBS rows: number, title, owner, dates, % done, PMT if payment-linked.',
      },
      {
        title: 'Labour schedule (Sheet 5)',
        body: 'Create a sheet with gang lines: trade, leader, size, dates, cost/day or hour, supervised/paid by.',
      },
      {
        title: 'Planning cycles (Doc 3)',
        body: 'Daily / Weekly / Monthly checklists. Complete when the period’s activities are done.',
      },
      {
        title: 'Planning documents',
        body: 'Upload TDP, C of O, drawings, BOQ, material schedule, etc. to the project library.',
      },
      {
        title: 'Milestones',
        body: 'Track coarse stages (Foundation → Handover). Foundation certification respects FCDA permit gate where configured.',
      },
    ],
    related: ['/work-schedule', '/labour-schedules', '/planning-cycles', '/planning-docs', '/milestones'],
  },
  {
    id: 'projects-execution',
    title: 'Projects — execution (site log, inspections, ethics)',
    summary: 'Daily control and quality gates on site.',
    who: 'Foreman, Engineer, PM',
    steps: [
      {
        title: 'Site tracker',
        body: 'Create the daily site log: manpower, activities, materials, HSE. Submit for PM approval.',
      },
      {
        title: 'Inspections (Doc 4)',
        body: 'Pick a section checklist, mark each item Yes/No/NA, add remarks, sign the section. Pre-pour cannot PASS without complete YES/NA + sign-off.',
      },
      {
        title: 'Change log',
        body: 'Record variations with cost/time impact and route for approval before treating as scope.',
      },
      {
        title: 'Professional ethics',
        body: 'Supervisors/PMs should acknowledge the 10 ethics principles (/ethics) before leading site work.',
      },
    ],
    related: ['/site-tracker', '/inspections', '/change-log', '/ethics'],
  },
  {
    id: 'projects-monitoring',
    title: 'Projects — monitoring (progress, IVC)',
    summary: 'Report status and pay only for measured work.',
    who: 'PM, Finance, Foreman',
    steps: [
      {
        title: 'Progress report (Sheet 3)',
        body: 'Write summary, team, completed / upcoming tasks, risks. Publish PDF for stakeholders.',
      },
      {
        title: 'IVC (Doc 6)',
        body: 'Link a works contract if available. Enter measured % and amounts per stage (mobilisation + milestones). Submit → Finance notified → PM + supervisor sign → APPROVED.',
      },
    ],
    related: ['/progress-reports', '/ivcs', '/procurement/works'],
  },
  {
    id: 'projects-closure',
    title: 'Projects — closure (closeout & retrospective)',
    summary: 'Hand over the building and capture lessons.',
    who: 'PM, Client (ack), CEO',
    steps: [
      {
        title: 'Closeout (Doc 7)',
        body: 'Zone accomplishments, open items, schedule/budget flags. Issue then capture client acknowledgement.',
      },
      {
        title: 'Retrospective (Doc 8)',
        body: 'Went well / improve / lucky, actions, optional client testimonial. Publish archives lessons; may mark project COMPLETE.',
      },
    ],
    related: ['/closeouts', '/retrospectives'],
  },
  {
    id: 'property-management',
    title: 'Properties — management (letting & FM)',
    summary: 'From application to remittance.',
    who: 'Sales agent, PM, Finance, Admin',
    steps: [
      {
        title: 'Estate terrier',
        body: 'Maintain estate units before assigning applicants.',
      },
      {
        title: 'Tenant application (Doc 12)',
        body: 'Capture bio-data and clauses. Agency+Legal % comes from the PM engagement schedule (not Doc 10 split).',
      },
      {
        title: 'Evaluate (4 parameters × 0–10)',
        body: 'Staff scores Compatibility, Ability to pay, Vacating reason, Guarantor. System averages only. Tenant never self-scores. Approve/Reject is a human decision; override reason required if average < 6.0.',
      },
      {
        title: 'Offer letter (Doc 10)',
        body: 'After acceptance path, issue offer with rent, caution, and Doc 10 fee split + settlement entities. Download PDF.',
      },
      {
        title: 'Inventories (Doc 9)',
        body: 'Move-in / move-out room condition matrix and deposit settlement fields.',
      },
      {
        title: 'Maintenance & service charges',
        body: 'Log requests; keep SC spend within available levy. Remit net to landlord via Remittances.',
      },
      {
        title: 'PM fee schedules (Doc 10/11/12)',
        body: 'Configure per-property or default engagement %. Download Doc 11 proposal summary PDF from the engagement.',
      },
    ],
    related: [
      '/tenant-applications',
      '/estate-terrier',
      '/inventories',
      '/tenancies',
      '/maintenance',
      '/service-charges',
      '/remittances',
      '/pm-engagements',
    ],
  },
  {
    id: 'property-sales',
    title: 'Properties — sales (listings, CRM, instalments)',
    summary: 'Market, inspect interest, and collect purchaser payments.',
    who: 'Sales, PM, Finance',
    steps: [
      {
        title: 'Listings & CRM',
        body: 'Publish listings; capture leads and viewings/inspections.',
      },
      {
        title: 'Sales offers',
        body: 'Issue sales offer documents and track responses.',
      },
      {
        title: 'Purchaser instalments (Sheet 2)',
        body: 'Create the schedule; record receipts; client sees balance on /portal/instalments.',
      },
      {
        title: 'JV listings',
        body: 'Mark partnership interest where needed. Do not invent equity/share fields until Abraham confirms JV commercials.',
      },
    ],
    related: ['/listings', '/crm', '/viewings', '/instalments'],
  },
  {
    id: 'procurement',
    title: 'Procurement (goods, services, works, vendors)',
    summary: 'Buy materials, engage artisans, contract works.',
    who: 'PM, Store, Finance, Foreman',
    steps: [
      {
        title: 'Goods',
        body: 'PR → PO → GRN flow for materials. Prefer approved vendors.',
      },
      {
        title: 'Services / artisans',
        body: 'Register artisans; service requests with photos. Platform fee 2.5% on labour/service only.',
      },
      {
        title: 'Works',
        body: 'Works contracts on projects (~10% platform fee). Feed into IVCs for payment.',
      },
      {
        title: 'Vendors (Sheet 7)',
        body: 'Record business name, products/services, price notes, location, contact, reliability stars (1–5), notes.',
      },
    ],
    related: ['/procurement', '/material-requests', '/vendors'],
  },
  {
    id: 'finance',
    title: 'Finance (invoices, payments, KPIs)',
    summary: 'Money in, money out, with proof.',
    who: 'Finance, CEO, Admin',
    steps: [
      {
        title: 'Invoices & payments',
        body: 'Raise invoices against settlement entities. Clients/staff upload payment proof; Finance verifies. Phase 1 = bank transfer + proof (no auto bank verify yet).',
      },
      {
        title: 'Dashboard KPIs',
        body: 'Use the staff dashboard for arrears, remittances, and project health signals.',
      },
    ],
    related: ['/invoices', '/dashboard'],
  },
  {
    id: 'platform',
    title: 'Platform (documents, audit, admin)',
    summary: 'Shared files, compliance, and system control.',
    who: 'Admin, CEO, Finance (audit)',
    steps: [
      {
        title: 'Documents',
        body: 'Central file store linked to projects/properties where applicable.',
      },
      {
        title: 'Audit log',
        body: 'Who changed what — use for disputes and compliance.',
      },
      {
        title: 'System admin',
        body: 'Users, sites, and operational settings. Restrict to CEO/Admin.',
      },
    ],
    related: ['/documents', '/audit-log', '/admin', '/ethics'],
  },
  {
    id: 'portal',
    title: 'Client portal',
    summary: 'What external clients can do.',
    who: 'CLIENT role',
    steps: [
      {
        title: 'Payments',
        body: 'View invoices and upload payment proof.',
      },
      {
        title: 'Instalments',
        body: 'See purchaser schedule and outstanding balance.',
      },
      {
        title: 'Maintenance & documents',
        body: 'Raise maintenance where enabled; download shared documents.',
      },
    ],
    related: ['/portal'],
  },
];
