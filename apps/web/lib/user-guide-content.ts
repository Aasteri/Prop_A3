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

export type RoleGuide = {
  role: string;
  title: string;
  summary: string;
  dailyFocus: string[];
  doThis: { title: string; href?: string; body: string }[];
  neverDo?: string[];
  relatedGuideSectionIds?: string[];
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
        title: 'Open your role playbook',
        body: 'On this page, tap your role chip (CEO, Sales, Foreman, etc.). It shows only what you should do day to day, with links into the live screens.',
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

/** Matches prisma UserRole — used by role playbooks on /user-guide. */
export type UserRole =
  | 'CEO'
  | 'PROJECT_MANAGER'
  | 'FOREMAN'
  | 'ENGINEER'
  | 'ARCHITECT'
  | 'STORE_MANAGER'
  | 'FINANCE'
  | 'SALES'
  | 'CLIENT'
  | 'ADMIN';

export const ALL_ROLES: UserRole[] = [
  'CEO',
  'PROJECT_MANAGER',
  'FOREMAN',
  'ENGINEER',
  'ARCHITECT',
  'STORE_MANAGER',
  'FINANCE',
  'SALES',
  'CLIENT',
  'ADMIN',
];

export type RoleGuideAction = {
  title: string;
  href?: string;
  body: string;
};

export type RoleGuide = {
  role: UserRole;
  title: string;
  summary: string;
  dailyFocus: string[];
  doThis: RoleGuideAction[];
  neverDo?: string[];
  relatedGuideSectionIds?: string[];
};

export const ROLE_GUIDES: RoleGuide[] = [
  {
    role: 'CEO',
    title: 'CEO playbook',
    summary:
      'See portfolio health, unblock dual sign-offs, and keep commercial/compliance decisions on EXTRACTED facts.',
    dailyFocus: [
      'Dashboard KPIs: project health, arrears, remittances, and open approvals',
      'Charters waiting company or client sign',
      'IVCs / invoices that need executive visibility',
      'Audit signals and Admin changes that affect live operations',
    ],
    doThis: [
      {
        title: 'Scan the dashboard',
        href: '/dashboard',
        body: 'Start with arrears, remittance status, and project signals before diving into a single site.',
      },
      {
        title: 'Company-sign charters',
        href: '/charters',
        body: 'Complete company sign-off so dual-approved charters can unlock kick-off publish and ACTIVE status.',
      },
      {
        title: 'Review closeouts & retrospectives',
        href: '/closeouts',
        body: 'Confirm handover quality and lessons before marking projects complete.',
      },
      {
        title: 'Check audit / admin only when needed',
        href: '/audit-log',
        body: 'Use audit log for disputes; leave day-to-day user/site setup to Admin unless risk is high.',
      },
    ],
    neverDo: [
      'Invent JV equity/share fields or fee splits that are still WAITING from Abraham',
      'Bypass dual charter sign-off to rush a project live',
      'Approve tenant applications without an override reason when scoring guidance is BORDERLINE/UNSUITABLE',
    ],
    relatedGuideSectionIds: [
      'getting-started',
      'projects-initiation',
      'projects-closure',
      'finance',
      'platform',
    ],
  },
  {
    role: 'PROJECT_MANAGER',
    title: 'Project Manager playbook',
    summary:
      'Own initiation → planning → execution → monitoring → closure. You are the hub between site, client, store, and finance.',
    dailyFocus: [
      'Approve yesterday’s site logs and unblock inspections',
      'Charter / kick-off status for new projects',
      'WBS % and PMT tasks vs IVC readiness',
      'Material requests awaiting PM approval',
      'Progress report and change-log queue',
    ],
    doThis: [
      {
        title: 'Drive charters & kick-off',
        href: '/charters',
        body: 'Draft → submit → dual sign. Publish kick-off only after charter is APPROVED.',
      },
      {
        title: 'Keep WBS and labour current',
        href: '/work-schedule',
        body: 'Update owners, dates, % done, and PMT flags; align labour gangs to the plan.',
      },
      {
        title: 'Approve site logs & QC',
        href: '/site-tracker',
        body: 'Review daily logs; ensure Pre-pour inspections cannot PASS without complete YES/NA + sign-off.',
      },
      {
        title: 'Route IVCs to approval',
        href: '/ivcs',
        body: 'Link works contracts, measured stages, then PM + supervisor sign before Finance pays.',
      },
      {
        title: 'Close with Doc 7 / Doc 8',
        href: '/closeouts',
        body: 'Issue closeout, capture client ack, then retrospective for lessons.',
      },
    ],
    neverDo: [
      'Publish kick-off without an APPROVED charter',
      'Treat unsigned change-log variations as scope',
      'Issue materials or pay works without measured/approved trail (IVC / GRN as applicable)',
      'Mix Doc 12 Agency+Legal % with Doc 10 offer fee splits',
    ],
    relatedGuideSectionIds: [
      'projects-initiation',
      'projects-planning',
      'projects-execution',
      'projects-monitoring',
      'projects-closure',
      'procurement',
      'property-management',
    ],
  },
  {
    role: 'FOREMAN',
    title: 'Foreman playbook',
    summary:
      'Control the day on site: manpower, activities, HSE, materials asks, and inspection readiness.',
    dailyFocus: [
      'Submit today’s site log before leaving site',
      'Manpower vs labour schedule',
      'Open material requests / issues',
      'Inspection sections due (especially Pre-pour)',
      'HSE notes and blockers for the PM',
    ],
    doThis: [
      {
        title: 'Write the daily site log',
        href: '/site-tracker',
        body: 'Record manpower, activities, materials used, and HSE. Submit for PM approval.',
      },
      {
        title: 'Raise material needs early',
        href: '/material-requests',
        body: 'Request issues against project need; do not wait until pour day.',
      },
      {
        title: 'Complete inspection checklists',
        href: '/inspections',
        body: 'Mark Yes/No/NA, remarks, and section sign-off. Pre-pour is a hard gate.',
      },
      {
        title: 'Acknowledge ethics',
        href: '/ethics',
        body: 'Confirm the 10 professional ethics principles before leading crews.',
      },
    ],
    neverDo: [
      'Skip the daily log or backfill without facts',
      'Mark Pre-pour PASS with open NO items or missing sign-off',
      'Issue store stock yourself — that is Store Manager after PM approval',
      'Promise scope changes without a change-log entry',
    ],
    relatedGuideSectionIds: [
      'projects-execution',
      'projects-planning',
      'projects-monitoring',
      'procurement',
    ],
  },
  {
    role: 'ENGINEER',
    title: 'Engineer playbook',
    summary:
      'Protect technical quality: WBS accuracy, inspections, planning docs, and measured progress inputs.',
    dailyFocus: [
      'Inspection / QC queue for your sections',
      'WBS tasks you own — % and blockers',
      'Planning documents (drawings, BOQ, TDP) completeness',
      'Technical input to progress reports and IVC measured %',
    ],
    doThis: [
      {
        title: 'Own technical WBS rows',
        href: '/work-schedule',
        body: 'Keep engineering packages numbered, dated, and % truthful for PMT-linked tasks.',
      },
      {
        title: 'Run / sign inspections',
        href: '/inspections',
        body: 'Use Doc 4 section checklists; enforce Pre-pour gate before concrete.',
      },
      {
        title: 'Upload planning docs',
        href: '/planning-docs',
        body: 'Keep drawings, BOQ, and schedules in the project library so site and PM share one source.',
      },
      {
        title: 'Support progress & IVC facts',
        href: '/progress-reports',
        body: 'Feed completed/upcoming technical work and measured % — never estimate for payment without measure.',
      },
    ],
    neverDo: [
      'Pass QC with incomplete checklist items',
      'Change structural/scope intent without change control',
      'Leave BOQ / drawing revisions only on WhatsApp — file them in planning docs',
    ],
    relatedGuideSectionIds: [
      'projects-planning',
      'projects-execution',
      'projects-monitoring',
    ],
  },
  {
    role: 'ARCHITECT',
    title: 'Architect playbook',
    summary:
      'Guard design intent: drawings, planning library, change impact, and design-related inspections.',
    dailyFocus: [
      'Latest drawings / revisions in planning documents',
      'Change-log items that affect design or finishes',
      'Design-related inspection remarks',
      'Closeout zone accomplishments vs original intent',
    ],
    doThis: [
      {
        title: 'Maintain the drawing set',
        href: '/planning-docs',
        body: 'Upload revisioned drawings and related design docs so site never works from stale sheets.',
      },
      {
        title: 'Review design changes',
        href: '/change-log',
        body: 'Capture cost/time impact and route approval before treating variations as scope.',
      },
      {
        title: 'Support QC where design criteria apply',
        href: '/inspections',
        body: 'Add clear remarks when work diverges from drawings; do not verbal-only correct.',
      },
      {
        title: 'Input to closeout',
        href: '/closeouts',
        body: 'Confirm design zones and open items before client acknowledgement.',
      },
    ],
    neverDo: [
      'Issue informal sketch changes without a logged revision',
      'Approve site deviations that conflict with statutory or client brief without PM/change control',
    ],
    relatedGuideSectionIds: [
      'projects-planning',
      'projects-execution',
      'projects-closure',
    ],
  },
  {
    role: 'STORE_MANAGER',
    title: 'Store Manager playbook',
    summary:
      'Control stock movement: approved material requests, GRNs, vendor reliability, and site issues.',
    dailyFocus: [
      'Material requests approved and waiting issue',
      'Open POs needing GRN',
      'Vendor directory accuracy (Sheet 7)',
      'Site shortages flagged by Foreman / Engineer',
    ],
    doThis: [
      {
        title: 'Issue against approved requests',
        href: '/material-requests',
        body: 'Issue stock only after PM (or allowed role) approval — keep quantities auditable.',
      },
      {
        title: 'Complete GRNs for goods',
        href: '/procurement/goods',
        body: 'Confirm receipts against PO; do not book stock from informal delivery notes alone.',
      },
      {
        title: 'Keep vendors current',
        href: '/vendors',
        body: 'Business name, products, location, contact, reliability stars (1–5), and notes.',
      },
      {
        title: 'Use the procurement hub',
        href: '/procurement',
        body: 'Jump between goods, services, and works from one place when unsure.',
      },
    ],
    neverDo: [
      'Issue materials on verbal-only authority',
      'Skip GRN and still treat goods as received for payment',
      'Invent vendor prices or reliability scores without evidence',
    ],
    relatedGuideSectionIds: ['procurement', 'projects-execution'],
  },
  {
    role: 'FINANCE',
    title: 'Finance playbook',
    summary:
      'Money in/out with proof: invoices, payment verification, remittances, instalments, and IVC pay readiness.',
    dailyFocus: [
      'Payment proofs waiting verification',
      'IVCs approaching APPROVED / pay',
      'Landlord remittances due',
      'Purchaser instalment arrears',
      'Service charge vs maintenance spend boundary',
    ],
    doThis: [
      {
        title: 'Verify invoices & payments',
        href: '/invoices',
        body: 'Raise against settlement entities; verify bank-transfer proof (Phase 1 — no auto bank verify yet).',
      },
      {
        title: 'Track IVCs',
        href: '/ivcs',
        body: 'Pay only after measured stages and PM + supervisor sign-off to APPROVED.',
      },
      {
        title: 'Remit to landlords',
        href: '/remittances',
        body: 'Net rent after agreed deductions; keep SC spend within available levy.',
      },
      {
        title: 'Purchaser instalments',
        href: '/instalments',
        body: 'Record receipts; clients see balances on /portal/instalments.',
      },
      {
        title: 'Use audit when disputed',
        href: '/audit-log',
        body: 'Who changed what — especially fee schedules and approvals.',
      },
    ],
    neverDo: [
      'Pay works without APPROVED IVC trail',
      'Mix Doc 10 and Doc 12 fee bases',
      'Spend service charge beyond available levy',
      'Invent platform fee rates — works ~10%, services 2.5% (materials out of 2.5% base)',
    ],
    relatedGuideSectionIds: [
      'finance',
      'projects-monitoring',
      'property-management',
      'property-sales',
      'platform',
    ],
  },
  {
    role: 'SALES',
    title: 'Sales playbook',
    summary:
      'Fill the pipeline and close compliant lettings/sales: CRM, listings, viewings, tenant scoring, offers, instalments.',
    dailyFocus: [
      'Hot CRM leads and overdue viewings',
      'Tenant applications ready to score / decide',
      'Listings that need publish or price refresh',
      'Sales offers and purchaser instalment follow-ups',
    ],
    doThis: [
      {
        title: 'Work CRM & viewings',
        href: '/crm',
        body: 'Capture leads, book viewings/inspections, and advance stages with notes.',
      },
      {
        title: 'Publish listings',
        href: '/listings',
        body: 'Keep sales listings accurate; flag JV interest only — no invented equity fields.',
      },
      {
        title: 'Score tenant applications',
        href: '/tenant-applications',
        body: 'Staff score 4 parameters 0–10; system averages only. Override reason required if average < 6.0.',
      },
      {
        title: 'Issue Doc 10 offers when path is clear',
        href: '/tenant-applications',
        body: 'Use Doc 10 fee split + settlement entities after acceptance path — not Doc 12 combined %.',
      },
      {
        title: 'Follow purchaser instalments',
        href: '/instalments',
        body: 'Coordinate with Finance on receipts; client sees balance in the portal.',
      },
    ],
    neverDo: [
      'Let tenants self-score applications',
      'Approve BORDERLINE/UNSUITABLE without a written override',
      'Invent JV commercial share fields still WAITING confirmation',
      'Quote Agency/Legal from the wrong document (Doc 10 vs Doc 12)',
    ],
    relatedGuideSectionIds: [
      'property-management',
      'property-sales',
      'getting-started',
    ],
  },
  {
    role: 'CLIENT',
    title: 'Client portal playbook',
    summary:
      'External clients use /portal — payments, instalments, maintenance, shared documents — not staff hubs.',
    dailyFocus: [
      'Open invoices and upload payment proof',
      'Purchaser instalment balance',
      'Maintenance tickets you raised',
      'Shared project/property documents',
    ],
    doThis: [
      {
        title: 'Open the portal dashboard',
        href: '/portal',
        body: 'Start here for status cards and shortcuts; staff menus are not for CLIENT accounts.',
      },
      {
        title: 'Pay / upload proof',
        href: '/portal/payments',
        body: 'View invoices and upload bank-transfer proof for Finance to verify.',
      },
      {
        title: 'Check instalments',
        href: '/portal/instalments',
        body: 'See schedule and outstanding balance for purchaser plans.',
      },
      {
        title: 'Raise maintenance',
        href: '/portal/maintenance',
        body: 'Log facility issues where enabled; attach photos when helpful.',
      },
      {
        title: 'Download documents',
        href: '/portal/documents',
        body: 'Use shared files issued by the team — do not rely on email-only copies.',
      },
    ],
    neverDo: [
      'Expect staff hub screens (/dashboard, /charters, etc.) to work for CLIENT',
      'Assume payment is cleared before Finance verifies proof',
      'Treat informal WhatsApp instructions as a substitute for portal records',
    ],
    relatedGuideSectionIds: ['portal', 'getting-started'],
  },
  {
    role: 'ADMIN',
    title: 'Admin playbook',
    summary:
      'Keep the platform operable: users, sites, documents hygiene, ethics access, and controlled settings.',
    dailyFocus: [
      'New user / role / site assignment requests',
      'Inactive or wrong-role accounts',
      'Document store hygiene for projects/properties',
      'Escalations that need audit evidence',
    ],
    doThis: [
      {
        title: 'Manage users & sites',
        href: '/admin',
        body: 'Create/activate users, set roles, and primary sites. Restrict admin powers to CEO/Admin.',
      },
      {
        title: 'Watch the audit log',
        href: '/audit-log',
        body: 'Support Finance/CEO on disputes — who changed approvals, fees, or tenant decisions.',
      },
      {
        title: 'Documents library',
        href: '/documents',
        body: 'Keep central files linked to the right project/property where applicable.',
      },
      {
        title: 'Point staff to this guide',
        href: '/user-guide',
        body: 'Role chips + glossary reduce tribal knowledge; update WAITING notes when Abraham confirms.',
      },
    ],
    neverDo: [
      'Grant ADMIN/CEO casually',
      'Edit live commercial clauses outside EXTRACTED / engagement schedules',
      'Delete audit history or bypass role checks for convenience',
    ],
    relatedGuideSectionIds: ['platform', 'getting-started', 'finance'],
  },
];

/** One playbook per UserRole — so every role can operate without guessing. */
export const ROLE_GUIDES: RoleGuide[] = [
  {
    role: 'CEO',
    title: 'CEO playbook',
    summary:
      'Oversee authority gates, money, and exceptions. Review high-value charters, watch KPIs, and unblock borderline decisions when needed.',
    dailyFocus: [
      'Dashboard KPIs and unread notifications',
      'Charters awaiting company/client sign-off',
      'IVCs and remittances needing executive visibility',
      'Audit log for sensitive overrides',
    ],
    doThis: [
      {
        title: 'Start at the dashboard',
        href: '/dashboard',
        body: 'Scan pending logs, materials, HSE, and finance signals; open this guide if a term is unclear.',
      },
      {
        title: 'Review and sign charters',
        href: '/charters',
        body: 'High-value projects need CEO review before client sign-off. After dual sign, kick-off can publish.',
      },
      {
        title: 'Watch progress and closeouts',
        href: '/progress-reports',
        body: 'Published progress reports plus Doc 7/8 closeout/retrospective give status without WhatsApp.',
      },
      {
        title: 'Confirm money movement',
        href: '/invoices',
        body: 'Invoices, verified payments, remittances, instalments. Phase 1 is proof upload — not automatic bank verify.',
      },
      {
        title: 'Use audit when something looks wrong',
        href: '/audit-log',
        body: 'Check who changed scores, approvals, or fee schedules before escalating.',
      },
    ],
    neverDo: [
      'Do not invent JV equity/share fields until Abraham confirms commercials.',
      'Do not treat tenant guidance bands as automatic accept/reject — humans decide; overrides need reasons.',
    ],
    relatedGuideSectionIds: [
      'getting-started',
      'projects-initiation',
      'projects-monitoring',
      'projects-closure',
      'finance',
      'platform',
    ],
  },
  {
    role: 'ADMIN',
    title: 'Admin playbook',
    summary:
      'Keep the platform usable: users, sites, documents, and clean master data so other roles are not blocked.',
    dailyFocus: [
      'New user access and correct roles',
      'Sites / estates ready for projects and terrier',
      'Settlement entities and PM fee schedules accurate',
      'Point staff to role playbooks and ethics acknowledgement',
    ],
    doThis: [
      {
        title: 'Manage users and sites',
        href: '/admin',
        body: 'Create accounts, assign roles, attach primary sites, deactivate leavers.',
      },
      {
        title: 'Keep documents organised',
        href: '/documents',
        body: 'Ensure planning packs and signed PDFs land in Documents / planning-docs, not only WhatsApp.',
      },
      {
        title: 'Configure PM fee schedules',
        href: '/pm-engagements',
        body: 'Doc 10/11/12 percentages drive applications and offers. Download Doc 11 proposal PDF when engaging landlords.',
      },
      {
        title: 'Support terrier master data',
        href: '/estate-terrier',
        body: 'Estates and units must exist before Sales can approve applications onto a terrier row.',
      },
      {
        title: 'Point staff to this guide',
        href: '/user-guide',
        body: 'Onboard with role chips + glossary so people stop asking the same terminology questions.',
      },
    ],
    neverDo: [
      'Do not give CLIENT accounts staff-hub expectations — clients use /portal.',
      'Do not hard-code fee myths; always use engagement schedule values.',
    ],
    relatedGuideSectionIds: ['getting-started', 'platform', 'property-management', 'finance'],
  },
  {
    role: 'PROJECT_MANAGER',
    title: 'Project Manager playbook',
    summary:
      'Own the project lifecycle: charter → plan → site control → IVC → closeout, plus FM tenant work when assigned.',
    dailyFocus: [
      'Approve daily site logs and material requests',
      'Update WBS % and planning cycles',
      'Inspections / pre-pour gates',
      'IVC submit and sign-offs',
      'Tenant evaluation when acting as FM',
    ],
    doThis: [
      {
        title: 'Charter then kick-off',
        href: '/charters',
        body: 'Draft Doc 1, get dual sign-off, then publish Doc 2 kick-off only when charter is APPROVED.',
      },
      {
        title: 'Build the plan',
        href: '/work-schedule',
        body: 'WBS tasks, labour schedules, Doc 3 cycles, planning uploads, milestones.',
      },
      {
        title: 'Run the site day',
        href: '/site-tracker',
        body: 'Approve logs, chase missing submissions, raise change logs, complete Doc 4 inspections with section sign-off.',
      },
      {
        title: 'Measure before paying works',
        href: '/ivcs',
        body: 'Create IVC from works contract, record measured %, submit to Finance, PM + supervisor sign.',
      },
      {
        title: 'Report and close',
        href: '/progress-reports',
        body: 'Publish Sheet 3 progress PDFs; issue Doc 7 closeout; complete Doc 8 retrospective.',
      },
      {
        title: 'FM tenant scoring when required',
        href: '/tenant-applications',
        body: 'Score four parameters 0–10; save evaluation; approve/reject with override if average < 6.0.',
      },
      {
        title: 'Acknowledge ethics',
        href: '/ethics',
        body: 'Confirm the 10 professional ethics principles before leading site teams.',
      },
    ],
    neverDo: [
      'Do not publish kick-off without APPROVED charter.',
      'Do not PASS pre-pour without YES/NA checklist + section sign.',
      'Do not mix Doc 12 Agency+Legal % with Doc 10 offer fee split.',
    ],
    relatedGuideSectionIds: [
      'projects-initiation',
      'projects-planning',
      'projects-execution',
      'projects-monitoring',
      'projects-closure',
      'property-management',
      'procurement',
    ],
  },
  {
    role: 'FOREMAN',
    title: 'Foreman / site supervisor playbook',
    summary:
      'Execute today’s work safely and truthfully: daily log, manpower, materials, HSE, and inspection support.',
    dailyFocus: [
      'Submit today’s site log on time',
      'Record shortages / equipment / weather issues',
      'Support inspections and pre-pour readiness',
      'Request materials through the system',
    ],
    doThis: [
      {
        title: 'Fill the daily site log',
        href: '/site-tracker',
        body: 'Manpower, activities, materials, progress notes, HSE flags. Submit for PM approval — do not leave drafts overnight.',
      },
      {
        title: 'Raise material needs',
        href: '/material-requests',
        body: 'Request site issues so Store/PM can approve and issue stock.',
      },
      {
        title: 'Help with inspections',
        href: '/inspections',
        body: 'Walk Doc 4 checklists; ensure pre-pour items are ready before asking for PASS.',
      },
      {
        title: 'Follow planning rhythm',
        href: '/planning-cycles',
        body: 'Know today’s targets from the Daily planning checklist (TBT, materials, housekeeping).',
      },
      {
        title: 'Acknowledge ethics',
        href: '/ethics',
        body: 'Read and acknowledge the 10 supervisor ethics principles.',
      },
    ],
    neverDo: [
      'Do not falsify progress, cube results, or manpower counts.',
      'Do not pour concrete without cleared pre-pour inspection.',
      'Do not bypass change control for scope changes.',
    ],
    relatedGuideSectionIds: ['projects-execution', 'projects-planning', 'procurement'],
  },
  {
    role: 'ENGINEER',
    title: 'Engineer playbook',
    summary:
      'Protect structural/MEP quality: inspections, drawings, measured IVC inputs, and technical change notes.',
    dailyFocus: [
      'Doc 4 / pre-pour inspections',
      'Drawing versions in planning documents',
      'Technical review of change requests',
      'Support measured % for IVC stages',
    ],
    doThis: [
      {
        title: 'Run or co-sign inspections',
        href: '/inspections',
        body: 'Use section checklists. Pre-pour PASS needs full YES/NA + sign-off.',
      },
      {
        title: 'Keep approved drawings on the project',
        href: '/planning-docs',
        body: 'Upload/replace architectural, structural, M&E packs so site never works from WhatsApp photos.',
      },
      {
        title: 'Advise on changes',
        href: '/change-log',
        body: 'Add technical impact when variations affect structure, services, or sequence.',
      },
      {
        title: 'Support valuation truth',
        href: '/ivcs',
        body: 'Help PM/Foreman set honest measured % before Finance sees an IVC.',
      },
      {
        title: 'Track WBS ownership',
        href: '/work-schedule',
        body: 'Update % done on tasks you own; flag PMT tasks that need measurement.',
      },
    ],
    neverDo: [
      'Do not certify quality you have not inspected.',
      'Do not ignore soil/permit gates that block foundation milestones.',
    ],
    relatedGuideSectionIds: ['projects-planning', 'projects-execution', 'projects-monitoring'],
  },
  {
    role: 'ARCHITECT',
    title: 'Architect playbook',
    summary:
      'Keep design intent clear: planning documents, design-related change control, and progress narrative support.',
    dailyFocus: [
      'Latest approved drawing set on the project',
      'Design comments on change logs',
      'Support kick-off / progress narrative when asked',
    ],
    doThis: [
      {
        title: 'Maintain design library',
        href: '/planning-docs',
        body: 'Upload architectural packs and revisions. Site must always know which revision is approved.',
      },
      {
        title: 'Join initiation clarity',
        href: '/charters',
        body: 'Confirm scope in/out and deliverables on the charter so redesign fights are minimised later.',
      },
      {
        title: 'Respond to design changes',
        href: '/change-log',
        body: 'Document aesthetic/layout variations with cost/time notes for PM approval.',
      },
      {
        title: 'Support progress storytelling',
        href: '/progress-reports',
        body: 'Help PM describe completed vs upcoming design-sensitive milestones for client reports.',
      },
    ],
    neverDo: [
      'Do not leave the only drawing copy on personal chat — put it in planning docs.',
      'Do not instruct site verbally without a logged change when scope shifts.',
    ],
    relatedGuideSectionIds: ['projects-initiation', 'projects-planning', 'projects-monitoring'],
  },
  {
    role: 'STORE_MANAGER',
    title: 'Store Manager playbook',
    summary:
      'Control materials: vendors, purchase flow, GRN receipts, and site material issues so stock stays honest.',
    dailyFocus: [
      'Pending material requests from site',
      'PO / GRN for incoming goods',
      'Vendor directory accuracy (Sheet 7)',
      'Shortage flags from daily logs',
    ],
    doThis: [
      {
        title: 'Process site material requests',
        href: '/material-requests',
        body: 'Approve/issue quantities. Shortages must be visible, not hidden.',
      },
      {
        title: 'Run goods procurement',
        href: '/procurement/goods',
        body: 'Follow PR → PO → GRN. Do not mark received without checking deliveries.',
      },
      {
        title: 'Maintain vendors',
        href: '/vendors',
        body: 'Business name, products/services, price notes, location, contact, reliability stars, notes.',
      },
      {
        title: 'Watch site shortage signals',
        href: '/site-tracker',
        body: 'When logs flag material shortage, reconcile with stock and open requests.',
      },
    ],
    neverDo: [
      'Do not issue materials undocumented.',
      'Do not invent Goods fee % — WAITING if not configured; escalate to PM/Finance.',
    ],
    relatedGuideSectionIds: ['procurement', 'projects-execution'],
  },
  {
    role: 'FINANCE',
    title: 'Finance playbook',
    summary:
      'Protect cash and audit trail: invoices, payment proofs, remittances, instalments, IVC awareness, service charges.',
    dailyFocus: [
      'Unverified payment proofs',
      'Landlord remittances due',
      'Purchaser instalment arrears',
      'IVCs submitted for pay readiness',
      'Service charge vs maintenance spend',
    ],
    doThis: [
      {
        title: 'Verify payments',
        href: '/invoices',
        body: 'Match proof uploads to invoices/settlement entities. Phase 1 is manual verify — not Paystack auto-clear.',
      },
      {
        title: 'Process remittances',
        href: '/remittances',
        body: 'Compute landlord net after agreed deductions; keep PDF/preview trail.',
      },
      {
        title: 'Track purchaser instalments',
        href: '/instalments',
        body: 'Post receipts against Sheet 2 schedules; clients see balances on the portal.',
      },
      {
        title: 'Review IVCs before release',
        href: '/ivcs',
        body: 'Only push payment for SUBMITTED/APPROVED IVCs with measured stages — performance before pay.',
      },
      {
        title: 'Watch service charges',
        href: '/service-charges',
        body: 'SC is the FM spend boundary. Flag maintenance that would exceed available levy.',
      },
      {
        title: 'Use audit for disputes',
        href: '/audit-log',
        body: 'Fee schedule changes, overrides, and payment verifies belong in the audit trail.',
      },
    ],
    neverDo: [
      'Do not pay works on verbal % — require IVC measurement trail.',
      'Do not confuse Doc 12 application fees with Doc 10 offer splits.',
    ],
    relatedGuideSectionIds: [
      'finance',
      'projects-monitoring',
      'property-management',
      'property-sales',
    ],
  },
  {
    role: 'SALES',
    title: 'Sales / agent playbook',
    summary:
      'Win and qualify customers: listings, CRM, viewings, tenant applications, 0–10 evaluation, offers, instalments.',
    dailyFocus: [
      'New leads and follow-ups in CRM',
      'Tenant applications pending evaluation',
      'Offer letters to issue after accept path',
      'Listing / viewing pipeline',
    ],
    doThis: [
      {
        title: 'Capture leads and listings',
        href: '/crm',
        body: 'Log interest sources; keep listings current under Sales listings.',
      },
      {
        title: 'Schedule viewings / inspections',
        href: '/viewings',
        body: 'Record physical viewings so history is not only WhatsApp.',
      },
      {
        title: 'Create tenant applications',
        href: '/tenant-applications',
        body: 'Doc 12 bio-data + clauses. Agency+Legal % comes from PM engagement (often combined 20%).',
      },
      {
        title: 'Score applicants (you are allowed)',
        href: '/tenant-applications',
        body: 'Score Compatibility, Ability to pay, Vacating reason, Guarantor each 0–10. Tenant never self-scores. Override reason required if approving average < 6.0.',
      },
      {
        title: 'Issue Doc 10 offers',
        href: '/tenant-applications',
        body: 'After accept path, issue offer with rent, caution, Doc 10 fee split, settlement entities; download PDF.',
      },
      {
        title: 'Sales instalments',
        href: '/instalments',
        body: 'For purchasers, maintain Sheet 2 schedules with Finance.',
      },
    ],
    neverDo: [
      'Do not let applicants enter their own evaluation scores.',
      'Do not invent JV commercial share fields — WAITING.',
      'Do not promise Doc 10 fees using Doc 12 application wording.',
    ],
    relatedGuideSectionIds: ['property-management', 'property-sales', 'finance'],
  },
  {
    role: 'CLIENT',
    title: 'Client portal playbook',
    summary:
      'External client/purchaser/tenant user. Use the portal only — not staff hubs.',
    dailyFocus: [
      'Check invoices and upload payment proof',
      'Review instalment balance if purchasing',
      'Track maintenance tickets',
      'Download shared documents',
    ],
    doThis: [
      {
        title: 'Open the portal home',
        href: '/portal',
        body: 'This is your dashboard. Staff menus do not apply to CLIENT accounts.',
      },
      {
        title: 'Pay / prove payment',
        href: '/portal/payments',
        body: 'View invoices and upload bank-transfer proof for Finance to verify.',
      },
      {
        title: 'Purchaser instalments',
        href: '/portal/instalments',
        body: 'See schedule, paid amounts, and outstanding balance.',
      },
      {
        title: 'Maintenance',
        href: '/portal/maintenance',
        body: 'Raise or follow facility issues where enabled for your tenancy.',
      },
      {
        title: 'Documents',
        href: '/portal/documents',
        body: 'Download offers, statements, or files shared with you.',
      },
    ],
    neverDo: [
      'Do not expect to score your own tenant application — FM/Sales does that.',
      'Do not assume instant payment clearance — Finance verifies proofs.',
    ],
    relatedGuideSectionIds: ['portal'],
  },
];

export const ALL_ROLES = ROLE_GUIDES.map((r) => r.role);
