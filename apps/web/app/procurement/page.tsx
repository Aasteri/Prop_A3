'use client';

import { HubPage } from '@/components/ModulePage';

export default function ProcurementHubPage() {
  return (
    <HubPage
      eyebrow="Pillar · Procurement"
      title="Goods · Services · Works"
      subtitle="Three procurement categories with fee rules: Services 2.5% on labour (excl. materials), Works ~10% of project cost. Warehouse and external supply paths."
      links={[
        {
          href: '/procurement/goods',
          title: 'Goods',
          description: 'PR → supplier match → PO → payment → delivery → GRN → performance.',
          icon: 'package',
          status: 'live',
        },
        {
          href: '/material-requests',
          title: 'Site material issues',
          description: 'Live site indent / issue flow (existing).',
          icon: 'package',
          status: 'live',
        },
        {
          href: '/procurement/services',
          title: 'Services & artisans',
          description: 'KYC artisans, photo service requests, estimate, confirm, 2.5%.',
          icon: 'users',
          status: 'live',
        },
        {
          href: '/procurement/works',
          title: 'Works / subcontractors',
          description: 'Works contracts linked to projects, milestones, IVC.',
          icon: 'hardhat',
          status: 'building',
        },
        {
          href: '/vendors',
          title: 'Vendors & suppliers',
          description: 'Supplier/OEM registry and performance reviews.',
          icon: 'store',
          status: 'live',
        },
      ]}
    />
  );
}
