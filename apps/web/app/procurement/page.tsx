'use client';

import { HubPage } from '@/components/ModulePage';
import { PROCUREMENT_STAGES } from '@/lib/process-stages';

/** Overview entry — five chronological procurement stages. */
export default function ProcurementHubPage() {
  return (
    <HubPage
      eyebrow="Pillar · Procurement"
      title="Procurement process groups"
      subtitle="Plan → Request → Source → Fulfil → Close & Pay. Open a stage for modules in order."
      links={PROCUREMENT_STAGES.map((s, i) => ({
        href: s.href,
        title: `${i + 1}. ${s.label}`,
        description: s.subtitle,
        icon: i === 0 ? 'store' : i === 4 ? 'invoice' : 'package',
        status: 'live' as const,
      }))}
    />
  );
}
