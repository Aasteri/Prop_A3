'use client';

import { HubPage } from '@/components/ModulePage';
import { PROPERTY_STAGES } from '@/lib/process-stages';

/** Optional overview — Property stages also appear in the sidebar. */
export default function PropertiesHubPage() {
  return (
    <HubPage
      eyebrow="Pillar · Property"
      title="Property process groups"
      subtitle="Onboard → Let → Occupy & Collect → Maintain → Exit. Sales & CRM is a separate sidebar section."
      links={PROPERTY_STAGES.map((s, i) => ({
        href: s.href,
        title: `${i + 1}. ${s.label}`,
        description: s.subtitle,
        icon: 'building',
        status: 'live' as const,
      }))}
    />
  );
}
