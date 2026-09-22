/** Full-system workflow map content for /workflow (not linked from menus). */

export type FlowStep = { label: string; href?: string; note?: string };

export type WorkflowFlow = {
  id: string;
  title: string;
  summary: string;
  steps: FlowStep[];
};

export type Pillar = {
  id: string;
  title: string;
  summary: string;
  hubs: { label: string; href: string }[];
  modules: { label: string; href: string; blurb: string }[];
};

export const ROLE_HOMES: {
  role: string;
  home: string;
  homeLabel: string;
  notes: string;
}[] = [
  {
    role: 'CLIENT',
    home: '/portal',
    homeLabel: 'Client portal',
    notes: 'Same login also reaches marketplace requests; payments, instalments, progress, documents.',
  },
  {
    role: 'ARTISAN',
    home: '/artisan',
    homeLabel: 'Artisan jobs',
    notes: 'Assigned marketplace / service jobs; profile via account menu.',
  },
  {
    role: 'MARKETPLACE_SEEKER',
    home: '/marketplace/requests',
    homeLabel: 'My requests',
    notes: 'Can be promoted to CLIENT in CRM (existing user) — keeps marketplace access.',
  },
  {
    role: 'CEO / ADMIN / FINANCE / PROJECT_MANAGER / FOREMAN / ENGINEER / ARCHITECT / STORE_MANAGER / SALES',
    home: '/dashboard',
    homeLabel: 'Staff dashboard',
    notes: 'Sidebar uses process groups (Projects / Property / Procurement) plus Sales & CRM. Marketplace admin: CEO, ADMIN, FINANCE, PM. Project pulse: /projects-hub.',
  },
];

export const PILLARS: Pillar[] = [
  {
    id: 'public',
    title: 'Public website',
    summary: 'Marketing surface that feeds CRM and marketplace.',
    hubs: [{ label: 'Home', href: '/' }],
    modules: [
      { label: 'Properties', href: '/properties', blurb: 'Public listings browse + detail + inquiry.' },
      { label: 'Projects', href: '/projects', blurb: 'Public project showcase.' },
      { label: 'Site map', href: '/estates', blurb: 'Estate / site map for visitors.' },
      { label: 'Artisan marketplace', href: '/marketplace', blurb: 'Catalog, post a job, register artisan.' },
      { label: 'Privacy', href: '/privacy', blurb: 'Legal.' },
    ],
  },
  {
    id: 'sales-crm',
    title: 'Sales & CRM',
    summary: 'Cross-cutting sales for all pillars — listings, leads, viewings (not nested under Property).',
    hubs: [{ label: 'CRM', href: '/crm' }],
    modules: [
      { label: 'Listings', href: '/listings', blurb: 'Staff sales inventory.' },
      { label: 'CRM pipeline', href: '/crm', blurb: 'Leads → client / portal link.' },
      { label: 'Viewings', href: '/viewings', blurb: 'Sales viewings & inspections.' },
    ],
  },
  {
    id: 'projects',
    title: 'Projects · five process groups',
    summary: 'Sidebar: Initiate → Plan → Execute → Monitor & Control → Close. Pulse tracks process group per project.',
    hubs: [
      { label: 'Project pulse', href: '/projects-hub' },
      { label: 'Initiate', href: '/projects/initiate' },
      { label: 'Plan', href: '/projects/plan' },
      { label: 'Execute', href: '/projects/execute' },
      { label: 'Monitor', href: '/projects/monitor' },
      { label: 'Close', href: '/projects/close' },
    ],
    modules: [
      { label: 'Charters', href: '/charters', blurb: 'Initiate — authority & kick-off.' },
      { label: 'Work schedule / milestones', href: '/work-schedule', blurb: 'Plan — WBS and stage gates.' },
      { label: 'Site tracker', href: '/site-tracker', blurb: 'Execute — daily logs.' },
      { label: 'Progress / inspections / IVCs', href: '/progress-reports', blurb: 'Monitor & Control.' },
      { label: 'Closeouts / retros', href: '/closeouts', blurb: 'Close — handover & lessons.' },
    ],
  },
  {
    id: 'property',
    title: 'Property · five process groups',
    summary: 'Onboard → Let → Occupy & Collect → Maintain → Exit.',
    hubs: [
      { label: 'Overview', href: '/properties-hub' },
      { label: 'Onboard', href: '/property/onboard' },
      { label: 'Let', href: '/property/let' },
      { label: 'Occupy', href: '/property/occupy' },
      { label: 'Maintain', href: '/property/maintain' },
      { label: 'Exit', href: '/property/exit' },
    ],
    modules: [
      { label: 'Assets / terrier', href: '/property-management', blurb: 'Onboard.' },
      { label: 'Applications / tenancies', href: '/tenant-applications', blurb: 'Let.' },
      { label: 'Charges / remittances', href: '/service-charges', blurb: 'Occupy & Collect.' },
      { label: 'Maintenance', href: '/maintenance', blurb: 'Maintain.' },
      { label: 'Inventories / exit', href: '/inventories', blurb: 'Exit check-out.' },
    ],
  },
  {
    id: 'procurement',
    title: 'Procurement · five process groups',
    summary: 'Plan → Request → Source → Fulfil → Close & Pay.',
    hubs: [
      { label: 'Overview', href: '/procurement' },
      { label: 'Plan', href: '/procurement/plan' },
      { label: 'Request', href: '/procurement/request' },
      { label: 'Source', href: '/procurement/source' },
      { label: 'Fulfil', href: '/procurement/fulfil' },
      { label: 'Close & Pay', href: '/procurement/close' },
    ],
    modules: [
      { label: 'Vendors', href: '/vendors', blurb: 'Plan.' },
      { label: 'Material / goods / services requests', href: '/material-requests', blurb: 'Request.' },
      { label: 'PO / works / artisans', href: '/procurement/goods', blurb: 'Source.' },
      { label: 'GRN / IVC', href: '/ivcs', blurb: 'Fulfil.' },
      { label: 'Payouts / invoices', href: '/payouts', blurb: 'Close & Pay.' },
    ],
  },
  {
    id: 'finance',
    title: 'Finance',
    summary: 'Invoices, receipts, instalments, landlord remittances, marketplace escrow.',
    hubs: [{ label: 'Invoices', href: '/invoices' }],
    modules: [
      { label: 'Invoices & payments', href: '/invoices', blurb: 'Create → send → pay → finance verify.' },
      { label: 'Money inflows', href: '/money-inflows', blurb: 'Cash / bank receipt capture.' },
      { label: 'Payouts', href: '/payouts', blurb: 'Outbound settlements.' },
      { label: 'Instalments', href: '/instalments', blurb: 'Purchaser instalment plans.' },
      { label: 'Service charges', href: '/service-charges', blurb: 'Estate service charge accounts.' },
      { label: 'Remittances', href: '/remittances', blurb: 'Landlord remittance runs.' },
      { label: 'Portal payments', href: '/portal/payments', blurb: 'Client-facing invoice payment.' },
    ],
  },
  {
    id: 'marketplace',
    title: 'Artisan marketplace',
    summary: 'Seekers post jobs; artisans quote; escrow unlocks chat address; staff moderate.',
    hubs: [
      { label: 'Marketplace', href: '/marketplace' },
      { label: 'Admin', href: '/marketplace-admin' },
    ],
    modules: [
      { label: 'Register / apply', href: '/marketplace/register', blurb: 'Seeker account or artisan application.' },
      { label: 'My requests', href: '/marketplace/requests', blurb: 'Seeker / client job list + chat.' },
      { label: 'Job detail', href: '/marketplace/jobs', blurb: 'Quotes, assign, escrow, complete.' },
      { label: 'Artisan home', href: '/artisan', blurb: 'Artisan role landing.' },
    ],
  },
  {
    id: 'portal',
    title: 'Client portal',
    summary: 'Purchaser / client view of progress, money, documents, maintenance.',
    hubs: [{ label: 'Portal', href: '/portal' }],
    modules: [
      { label: 'Payments', href: '/portal/payments', blurb: 'Outstanding invoices.' },
      { label: 'Instalments', href: '/portal/instalments', blurb: 'Plan schedule.' },
      { label: 'Progress', href: '/portal', blurb: 'Per-project milestone view.' },
      { label: 'Changes', href: '/portal/changes', blurb: 'Approved changes visible to client.' },
      { label: 'Documents', href: '/portal/documents', blurb: 'Shared docs.' },
      { label: 'Maintenance', href: '/portal/maintenance', blurb: 'Raise / track tickets.' },
    ],
  },
  {
    id: 'platform',
    title: 'Platform & admin',
    summary: 'Company settings, documents vault, audit, system admin.',
    hubs: [{ label: 'Dashboard', href: '/dashboard' }],
    modules: [
      { label: 'Documents', href: '/documents', blurb: 'Company document vault.' },
      { label: 'Settings', href: '/settings', blurb: 'Company profile / public contact.' },
      { label: 'Audit log', href: '/audit-log', blurb: 'Sensitive action trail.' },
      { label: 'Admin', href: '/admin', blurb: 'User / system admin (CEO/ADMIN).' },
      { label: 'Account', href: '/account', blurb: 'Profile for any signed-in user.' },
      { label: 'User guide', href: '/user-guide', blurb: 'Role-filtered how-to.' },
      { label: 'Workflow map', href: '/workflow', blurb: 'Full system map (URL only, not in menus).' },
    ],
  },
];

export const FLOWS: WorkflowFlow[] = [
  {
    id: 'construction',
    title: 'Construction progress (site log → milestone → FCDA → certify)',
    summary:
      'Operational heart of Projects. Approved daily work moves Foundation progress; FCDA permit unlocks 100%; engineer certifies stages.',
    steps: [
      { label: 'Foreman creates daily log', href: '/site-tracker/new' },
      { label: 'Submit log (photos / GPS / offline queue)' },
      { label: 'PM approves or rejects', href: '/site-tracker' },
      { label: 'API bumps Foundation % (capped 99% without FCDA)' },
      { label: 'PM uploads FCDA permit', href: '/milestones' },
      { label: 'PM may override stage %', href: '/milestones' },
      { label: 'Engineer certifies at 100%' },
      { label: 'Client sees progress in portal', href: '/portal' },
    ],
  },
  {
    id: 'materials',
    title: 'Site materials issue',
    summary: 'Store path separate from procurement PR/PO.',
    steps: [
      { label: 'Raise material request', href: '/material-requests/new' },
      { label: 'Optionally link to daily log' },
      { label: 'PM approves' },
      { label: 'Store manager issues', href: '/material-requests' },
    ],
  },
  {
    id: 'change',
    title: 'Change control → commercial',
    summary: 'Project changes can become invoice variations.',
    steps: [
      { label: 'Raise change', href: '/change-log/new' },
      { label: 'Review → approve / reject (CEO if high impact)' },
      { label: 'Optional invoice variation', href: '/invoices' },
      { label: 'Visible on portal changes', href: '/portal/changes' },
    ],
  },
  {
    id: 'crm',
    title: 'Inquiry → CRM → client portal',
    summary: 'Public forms create leads; conversion opens CLIENT portal access.',
    steps: [
      { label: 'Inquiry on home or property', href: '/' },
      { label: 'Lead in CRM (INQUIRY…)', href: '/crm' },
      { label: 'Viewing / offer', href: '/viewings' },
      { label: 'Convert / create client (+ link portal user)' },
      { label: 'User role CLIENT → /portal', href: '/portal' },
      { label: 'Attach ClientProject / instalments / invoices' },
    ],
  },
  {
    id: 'seeker-client',
    title: 'Marketplace seeker → CLIENT (dual-use account)',
    summary: 'One login can become a purchaser without losing marketplace requests.',
    steps: [
      { label: 'Register as seeker', href: '/marketplace/register' },
      { label: 'Post jobs / chat', href: '/marketplace/requests' },
      { label: 'CRM: Add client → Existing user', href: '/crm' },
      { label: 'Role promoted to CLIENT' },
      { label: 'Portal opens; marketplace still available', href: '/portal' },
    ],
  },
  {
    id: 'marketplace-job',
    title: 'Marketplace job lifecycle',
    summary: 'Escrow gates address sharing in chat.',
    steps: [
      { label: 'Browse catalog / post need', href: '/marketplace' },
      { label: 'Job created (seeker)' },
      { label: 'Artisans assigned / quote', href: '/marketplace-admin' },
      { label: 'Select quote → escrow payment' },
      { label: 'Chat unlocks site address', href: '/marketplace/jobs' },
      { label: 'Complete + rate' },
    ],
  },
  {
    id: 'invoice',
    title: 'Invoice → payment',
    summary: 'Staff billing and client Paystack / verify path.',
    steps: [
      { label: 'Create invoice (sales / variation / …)', href: '/invoices/new' },
      { label: 'Send to client' },
      { label: 'Client pays in portal', href: '/portal/payments' },
      { label: 'Finance verifies / money inflow', href: '/money-inflows' },
      { label: 'Status → PAID' },
    ],
  },
  {
    id: 'procurement-goods',
    title: 'Procurement · goods',
    summary: 'Classic PR → PO → GRN against vendors.',
    steps: [
      { label: 'Vendor directory', href: '/vendors' },
      { label: 'Purchase requisition', href: '/procurement/goods' },
      { label: 'Purchase order' },
      { label: 'Goods received note' },
    ],
  },
  {
    id: 'procurement-works',
    title: 'Procurement · works → IVC',
    summary: 'Subcontract sums valued via interim certificates.',
    steps: [
      { label: 'Works contract', href: '/procurement/works' },
      { label: 'Interim valuation (IVC)', href: '/ivcs' },
      { label: 'Payment / payouts', href: '/payouts' },
    ],
  },
  {
    id: 'lettings',
    title: 'Lettings / property management',
    summary: 'From applicant to remittance.',
    steps: [
      { label: 'Tenant application', href: '/tenant-applications/new' },
      { label: 'Approve → tenancy', href: '/tenancies' },
      { label: 'Inventory check-in', href: '/inventories' },
      { label: 'Maintenance tickets', href: '/maintenance' },
      { label: 'Service charges / remittances', href: '/remittances' },
      { label: 'Estate terrier occupancy', href: '/estate-terrier' },
    ],
  },
];

export const ENTITY_NOTES: { title: string; body: string }[] = [
  {
    title: 'User & roles',
    body: 'Every account is a User with a UserRole. CLIENT links via Client.portalUser; ARTISAN via ArtisanProfile; marketplace seeker may later become CLIENT.',
  },
  {
    title: 'Site → Project',
    body: 'Physical Site (JKW, GZ2, …) owns many Projects. Each Project has processGroup (INITIATE→CLOSE) shown on Project pulse. Construction modules hang off Project: milestones, daily logs, changes, material requests, schedules, IVCs, charters.',
  },
  {
    title: 'Milestones',
    body: 'Four stages: FOUNDATION, SHELL, FINISHING, HANDOVER. Foundation progress is gated by Project.fcdaPermitUrl. Certification is an Engineer action.',
  },
  {
    title: 'CRM graph',
    body: 'Listing → Lead → Client (converted). Client ties to portal User, ClientProject, Invoice, PurchaserInstalmentPlan.',
  },
  {
    title: 'Property assets',
    body: 'PropertyAsset → PropertyUnit → Tenancy / TenantApplication / Maintenance / Inventory / EstateTerrierRow / ServiceCharge / Remittance.',
  },
  {
    title: 'Marketplace graph',
    body: 'CatalogItem → Job (seeker User) → Assignment / Quote → EscrowPayment → ChatThread. Staff moderate in marketplace-admin.',
  },
];

export const CONNECT_SUMMARY = [
  'Staff nav uses process groups: Projects (Initiate→Close), Property (Onboard→Exit), Procurement (Plan→Close & Pay).',
  'Sales & CRM is a separate section shared across all pillars — not nested under Property.',
  'Project pulse (/projects-hub) tracks which PM process group each project is in; stage pages list modules chronologically.',
  'Public site and marketplace remain the open doors; construction OS still feeds portal progress.',
  'Finance sits under everything: invoices, instalments, remittances, payouts, marketplace escrow.',
];
