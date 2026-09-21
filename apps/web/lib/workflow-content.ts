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
    notes: 'Sidebar nav is role-filtered. Marketplace admin: CEO, ADMIN, FINANCE, PM.',
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
    id: 'crm',
    title: 'CRM & sales',
    summary: 'Inquiry → lead → viewing → offer → client → portal.',
    hubs: [{ label: 'CRM', href: '/crm' }],
    modules: [
      { label: 'Leads', href: '/crm/leads/new', blurb: 'Create / advance pipeline stages.' },
      { label: 'Viewings', href: '/viewings', blurb: 'Sales inspections & viewings.' },
      { label: 'Listings (staff)', href: '/listings', blurb: 'Sales inventory linked to leads.' },
      { label: 'Properties hub', href: '/properties-hub', blurb: 'Staff entry for sales + PM property work.' },
    ],
  },
  {
    id: 'projects',
    title: 'Projects · Construction OS',
    summary: 'Sites & projects: daily logs, milestones, changes, materials, planning, closeout.',
    hubs: [{ label: 'Projects hub', href: '/projects-hub' }],
    modules: [
      { label: 'Site tracker', href: '/site-tracker', blurb: 'Daily logs → submit → PM approve/reject (+ photos, offline).' },
      { label: 'Milestones', href: '/milestones', blurb: 'Foundation → Shell → Finishing → Handover; FCDA gate; engineer certify.' },
      { label: 'Work schedule', href: '/work-schedule', blurb: 'WBS / schedule tasks.' },
      { label: 'Labour schedules', href: '/labour-schedules', blurb: 'Crew planning.' },
      { label: 'Change log', href: '/change-log', blurb: 'Change control; high-impact needs CEO; can feed invoice variations.' },
      { label: 'Material requests', href: '/material-requests', blurb: 'Site store issues (approve → issue).' },
      { label: 'Inspections', href: '/inspections', blurb: 'QC / inspection logs.' },
      { label: 'Planning docs / cycles', href: '/planning-docs', blurb: 'Planning packs + weekly/monthly cycles.' },
      { label: 'Progress reports', href: '/progress-reports', blurb: 'Formal progress reporting.' },
      { label: 'Charters / closeouts / retros', href: '/charters', blurb: 'Kickoff charter → closeout → retrospective.' },
      { label: 'IVCs', href: '/ivcs', blurb: 'Interim valuation certificates on works contracts.' },
      { label: 'Ethics', href: '/ethics', blurb: 'Site supervisor ethics acknowledgements.' },
    ],
  },
  {
    id: 'procurement',
    title: 'Procurement',
    summary: 'Three tracks: goods (PR→PO→GRN), services (artisans), works (contracts→IVC).',
    hubs: [{ label: 'Procurement hub', href: '/procurement' }],
    modules: [
      { label: 'Goods', href: '/procurement/goods', blurb: 'Purchase requisition → order → goods receipt.' },
      { label: 'Vendors', href: '/vendors', blurb: 'Supplier directory.' },
      { label: 'Services', href: '/procurement/services', blurb: 'Service requests + artisan KYC/assign.' },
      { label: 'Works', href: '/procurement/works', blurb: 'Subcontractor works contracts.' },
      { label: 'Material requests', href: '/material-requests', blurb: 'Parallel site-issue path (not the same as PR/PO).' },
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
    id: 'pm',
    title: 'Property management',
    summary: 'Lettings lifecycle: application → tenancy → inventory → maintenance → remittance.',
    hubs: [{ label: 'Property management', href: '/property-management' }],
    modules: [
      { label: 'Tenant applications', href: '/tenant-applications', blurb: 'Screening → approve/reject.' },
      { label: 'Tenancies', href: '/tenancies', blurb: 'Active leases.' },
      { label: 'Inventories', href: '/inventories', blurb: 'Condition schedules.' },
      { label: 'Maintenance', href: '/maintenance', blurb: 'Work orders / tickets.' },
      { label: 'PM engagements', href: '/pm-engagements', blurb: 'Management fee schedules.' },
      { label: 'Estate terrier', href: '/estate-terrier', blurb: 'Unit occupancy matrix.' },
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
    body: 'Physical Site (JKW, GZ2, …) owns many Projects. Construction modules hang off Project: milestones, daily logs, changes, material requests, schedules, IVCs, charters.',
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
  'Public site and marketplace are the open doors; CRM and marketplace-admin are the staff funnels.',
  'Construction OS is the closed loop: Site Tracker feeds Milestones; Milestones (+ FCDA) feed Portal progress.',
  'Procurement goods/services/works are commercial supply tracks; Material Requests are site-store issues.',
  'Finance sits under everything: invoices, instalments, remittances, payouts, marketplace escrow.',
  'One person can be seeker + client; staff roles share /dashboard with role-gated sidebar items.',
];
