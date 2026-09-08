'use client';

import { HubPage } from '@/components/ModulePage';

export default function PropertiesHubPage() {
  return (
    <HubPage
      eyebrow="Pillar · Properties"
      title="Property management & sales"
      subtitle="One property asset can be leased, maintained, remitted, listed, inspected, and sold — with CRM routing for propA3 vs external agents."
      links={[
        {
          href: '/property-management',
          title: 'Property management',
          description: 'Vacancy → marketing → tenancy → remittance lifecycle.',
          icon: 'home',
          status: 'live',
        },
        {
          href: '/tenant-applications',
          title: 'Tenant applications',
          description: 'Bio-data form, screening, 4×0–10 FM evaluation.',
          icon: 'key',
          status: 'live',
        },
        {
          href: '/tenancies',
          title: 'Tenancies',
          description: 'Agreements, renewals (3mo/1mo), inventories, deposits.',
          icon: 'contract',
          status: 'live',
        },
        {
          href: '/maintenance',
          title: 'Maintenance',
          description: 'Photo requests, SC spend gate, artisan WO, tenant confirm.',
          icon: 'wrench',
          status: 'live',
        },
        {
          href: '/estate-terrier',
          title: 'Estate terrier',
          description: 'Unit rent roll and occupancy register.',
          icon: 'map',
          status: 'live',
        },
        {
          href: '/listings',
          title: 'Sales listings',
          description: 'Sale & JV listings; propA3 vs external agent source.',
          icon: 'tag',
          status: 'live',
        },
        {
          href: '/crm',
          title: 'Sales CRM',
          description: 'Buyer interest → pipeline through sale.',
          icon: 'users',
          status: 'live',
        },
        {
          href: '/viewings',
          title: 'Viewings & inspections',
          description: 'Mandatory physical inspection + platform response.',
          icon: 'eye',
          status: 'building',
        },
      ]}
    />
  );
}
