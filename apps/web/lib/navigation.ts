export type NavItem = {
  href: string;
  label: string;
  icon: string;
  match?: (pathname: string) => boolean;
  roles?: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/**
 * Staff IA aligned to Master BRD pillars:
 * Projects · Properties (Management + Sales) · Procurement · Finance · Platform
 */
export const STAFF_NAV: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      {
        href: '/dashboard',
        label: 'Dashboard',
        icon: 'dashboard',
        match: (p) => p === '/dashboard',
      },
    ],
  },
  {
    title: 'Projects',
    items: [
      {
        href: '/projects-hub',
        label: 'Projects hub',
        icon: 'flag',
        match: (p) => p === '/projects-hub' || p.startsWith('/projects-hub/'),
      },
      {
        href: '/site-tracker',
        label: 'Site tracker',
        icon: 'clipboard',
        match: (p) => p.startsWith('/site-tracker'),
      },
      {
        href: '/milestones',
        label: 'Schedule & milestones',
        icon: 'calendar',
        match: (p) => p.startsWith('/milestones'),
      },
      {
        href: '/change-log',
        label: 'Change control',
        icon: 'changes',
        match: (p) => p.startsWith('/change-log'),
      },
      {
        href: '/inspections',
        label: 'Inspections & QC',
        icon: 'check',
        match: (p) => p.startsWith('/inspections'),
      },
      {
        href: '/planning-docs',
        label: 'Planning documents',
        icon: 'file',
        match: (p) => p.startsWith('/planning-docs'),
      },
    ],
  },
  {
    title: 'Properties',
    items: [
      {
        href: '/properties-hub',
        label: 'Properties hub',
        icon: 'building',
        match: (p) => p === '/properties-hub',
      },
      {
        href: '/property-management',
        label: 'Property management',
        icon: 'home',
        match: (p) => p.startsWith('/property-management'),
      },
      {
        href: '/tenant-applications',
        label: 'Tenant applications',
        icon: 'key',
        match: (p) => p.startsWith('/tenant-applications'),
      },
      {
        href: '/tenancies',
        label: 'Tenancies',
        icon: 'contract',
        match: (p) => p.startsWith('/tenancies'),
      },
      {
        href: '/maintenance',
        label: 'Maintenance',
        icon: 'wrench',
        match: (p) => p.startsWith('/maintenance'),
      },
      {
        href: '/estate-terrier',
        label: 'Estate terrier',
        icon: 'map',
        match: (p) => p.startsWith('/estate-terrier'),
      },
      {
        href: '/listings',
        label: 'Sales listings',
        icon: 'tag',
        match: (p) => p.startsWith('/listings'),
      },
      {
        href: '/crm',
        label: 'Sales CRM',
        icon: 'users',
        match: (p) => p.startsWith('/crm'),
      },
      {
        href: '/viewings',
        label: 'Viewings & inspections',
        icon: 'eye',
        match: (p) => p.startsWith('/viewings'),
      },
    ],
  },
  {
    title: 'Procurement',
    items: [
      {
        href: '/procurement',
        label: 'Procurement hub',
        icon: 'cart',
        match: (p) => p === '/procurement',
      },
      {
        href: '/procurement/goods',
        label: 'Goods (PR → PO → GRN)',
        icon: 'package',
        match: (p) => p.startsWith('/procurement/goods'),
      },
      {
        href: '/material-requests',
        label: 'Site material issues',
        icon: 'package',
        match: (p) => p.startsWith('/material-requests'),
      },
      {
        href: '/procurement/services',
        label: 'Services & artisans',
        icon: 'users',
        match: (p) => p.startsWith('/procurement/services'),
      },
      {
        href: '/procurement/works',
        label: 'Works / subcontractors',
        icon: 'hardhat',
        match: (p) => p.startsWith('/procurement/works'),
      },
      {
        href: '/vendors',
        label: 'Vendors & suppliers',
        icon: 'store',
        match: (p) => p.startsWith('/vendors'),
      },
    ],
  },
  {
    title: 'Finance',
    items: [
      {
        href: '/invoices',
        label: 'Invoices & payments',
        icon: 'invoice',
        match: (p) => p.startsWith('/invoices'),
      },
      {
        href: '/service-charges',
        label: 'Service charges',
        icon: 'wallet',
        match: (p) => p.startsWith('/service-charges'),
      },
      {
        href: '/remittances',
        label: 'Landlord remittances',
        icon: 'transfer',
        match: (p) => p.startsWith('/remittances'),
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      {
        href: '/documents',
        label: 'Documents',
        icon: 'file',
        match: (p) => p.startsWith('/documents'),
      },
      {
        href: '/audit-log',
        label: 'Audit log',
        icon: 'shield',
        match: (p) => p.startsWith('/audit-log'),
        roles: ['CEO', 'FINANCE', 'ADMIN'],
      },
      {
        href: '/admin',
        label: 'System admin',
        icon: 'settings',
        match: (p) => p.startsWith('/admin'),
        roles: ['CEO', 'ADMIN'],
      },
    ],
  },
];

export const PORTAL_NAV: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: 'dashboard', match: (p) => p === '/portal' },
  {
    href: '/portal/payments',
    label: 'Payments',
    icon: 'invoice',
    match: (p) => p.startsWith('/portal/payments'),
  },
  {
    href: '/portal/maintenance',
    label: 'Maintenance',
    icon: 'wrench',
    match: (p) => p.startsWith('/portal/maintenance'),
  },
  {
    href: '/portal/changes',
    label: 'Changes',
    icon: 'changes',
    match: (p) => p.startsWith('/portal/changes'),
  },
  {
    href: '/portal/documents',
    label: 'Documents',
    icon: 'file',
    match: (p) => p.startsWith('/portal/documents'),
  },
];
