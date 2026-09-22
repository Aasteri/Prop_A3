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
 * Staff IA: process-group stages for Projects · Property · Procurement,
 * plus Sales & CRM (cross-cutting), Finance, and Platform.
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
      {
        href: '/projects-hub',
        label: 'Project pulse',
        icon: 'flag',
        match: (p) => p === '/projects-hub' || p.startsWith('/projects-hub/'),
      },
    ],
  },
  {
    title: 'Projects',
    items: [
      {
        href: '/projects/initiate',
        label: 'Initiate',
        icon: 'flag',
        match: (p) => p.startsWith('/projects/initiate') || p.startsWith('/projects/coming-soon/feasibility'),
      },
      {
        href: '/projects/plan',
        label: 'Plan',
        icon: 'calendar',
        match: (p) =>
          p.startsWith('/projects/plan') ||
          p.startsWith('/qc-plans') ||
          p.startsWith('/projects/coming-soon/qc-planning'),
      },
      {
        href: '/projects/execute',
        label: 'Execute',
        icon: 'hardhat',
        match: (p) =>
          p.startsWith('/projects/execute') ||
          p.startsWith('/workforce') ||
          p.startsWith('/cost-trackers') ||
          p.startsWith('/projects/coming-soon/workforce') ||
          p.startsWith('/projects/coming-soon/qc-execution'),
      },
      {
        href: '/projects/monitor',
        label: 'Monitor & Control',
        icon: 'clipboard',
        match: (p) =>
          p.startsWith('/projects/monitor') ||
          p.startsWith('/project-finance') ||
          p.startsWith('/project-analysis') ||
          p.startsWith('/field-map'),
      },
      {
        href: '/projects/close',
        label: 'Close',
        icon: 'check',
        match: (p) => p.startsWith('/projects/close'),
      },
    ],
  },
  {
    title: 'Property',
    items: [
      {
        href: '/property/onboard',
        label: 'Onboard',
        icon: 'building',
        match: (p) => p.startsWith('/property/onboard'),
      },
      {
        href: '/property/let',
        label: 'Let',
        icon: 'key',
        match: (p) => p.startsWith('/property/let'),
      },
      {
        href: '/property/occupy',
        label: 'Occupy & Collect',
        icon: 'home',
        match: (p) => p.startsWith('/property/occupy'),
      },
      {
        href: '/property/maintain',
        label: 'Maintain',
        icon: 'wrench',
        match: (p) => p.startsWith('/property/maintain'),
      },
      {
        href: '/property/exit',
        label: 'Exit',
        icon: 'contract',
        match: (p) =>
          p.startsWith('/property/exit') || p.startsWith('/property/coming-soon'),
      },
    ],
  },
  {
    title: 'Procurement',
    items: [
      {
        href: '/procurement/plan',
        label: 'Plan',
        icon: 'store',
        match: (p) => p === '/procurement/plan' || p.startsWith('/procurement/plan/'),
      },
      {
        href: '/procurement/request',
        label: 'Request',
        icon: 'package',
        match: (p) => p.startsWith('/procurement/request'),
      },
      {
        href: '/procurement/source',
        label: 'Source',
        icon: 'cart',
        match: (p) => p.startsWith('/procurement/source'),
      },
      {
        href: '/procurement/fulfil',
        label: 'Fulfil',
        icon: 'package',
        match: (p) => p.startsWith('/procurement/fulfil'),
      },
      {
        href: '/procurement/close',
        label: 'Close & Pay',
        icon: 'invoice',
        match: (p) => p === '/procurement/close' || p.startsWith('/procurement/close/'),
      },
    ],
  },
  {
    title: 'Sales & CRM',
    items: [
      {
        href: '/listings',
        label: 'Listings',
        icon: 'tag',
        match: (p) => p.startsWith('/listings'),
      },
      {
        href: '/crm',
        label: 'CRM',
        icon: 'users',
        match: (p) => p.startsWith('/crm'),
      },
      {
        href: '/viewings',
        label: 'Viewings',
        icon: 'eye',
        match: (p) => p.startsWith('/viewings'),
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
        href: '/project-finance',
        label: 'Project finance',
        icon: 'wallet',
        match: (p) => p.startsWith('/project-finance') || p.startsWith('/project-analysis'),
        roles: ['CEO', 'FINANCE', 'ADMIN', 'PROJECT_MANAGER'],
      },
      {
        href: '/money-inflows',
        label: 'Money inflows',
        icon: 'wallet',
        match: (p) => p.startsWith('/money-inflows'),
        roles: ['CEO', 'FINANCE', 'ADMIN', 'PROJECT_MANAGER'],
      },
      {
        href: '/payouts',
        label: 'Payouts',
        icon: 'transfer',
        match: (p) => p.startsWith('/payouts'),
        roles: ['CEO', 'FINANCE', 'ADMIN', 'PROJECT_MANAGER'],
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
      {
        href: '/instalments',
        label: 'Purchaser instalments',
        icon: 'invoice',
        match: (p) => p.startsWith('/instalments'),
      },
    ],
  },
  {
    title: 'Platform',
    items: [
      {
        href: '/user-guide',
        label: 'User guide',
        icon: 'file',
        match: (p) => p.startsWith('/user-guide'),
      },
      {
        href: '/documents',
        label: 'Documents',
        icon: 'file',
        match: (p) => p.startsWith('/documents'),
      },
      {
        href: '/ethics',
        label: 'Professional ethics',
        icon: 'shield',
        match: (p) => p.startsWith('/ethics'),
      },
      {
        href: '/audit-log',
        label: 'Audit log',
        icon: 'shield',
        match: (p) => p.startsWith('/audit-log'),
        roles: ['CEO', 'FINANCE', 'ADMIN'],
      },
      {
        href: '/settings',
        label: 'Company settings',
        icon: 'settings',
        match: (p) => p === '/settings' || p.startsWith('/settings/'),
        roles: ['CEO', 'ADMIN', 'FINANCE'],
      },
      {
        href: '/marketplace-admin',
        label: 'Artisan marketplace',
        icon: 'users',
        match: (p) => p.startsWith('/marketplace-admin'),
        roles: ['CEO', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER'],
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

export function filterNavByRole(groups: NavGroup[], role: string): NavGroup[] {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0);
}

export const PORTAL_NAV: NavItem[] = [
  { href: '/portal', label: 'Dashboard', icon: 'dashboard', match: (p) => p === '/portal' },
  {
    href: '/portal/payments',
    label: 'Payments',
    icon: 'invoice',
    match: (p) => p.startsWith('/portal/payments'),
  },
  {
    href: '/portal/instalments',
    label: 'Instalments',
    icon: 'wallet',
    match: (p) => p.startsWith('/portal/instalments'),
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
  {
    href: '/marketplace',
    label: 'Artisan marketplace',
    icon: 'hardhat',
    match: (p) => p.startsWith('/marketplace'),
  },
];
