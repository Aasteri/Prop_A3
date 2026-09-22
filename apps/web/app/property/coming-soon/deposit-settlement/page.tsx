'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function DepositSettlementComingSoonPage() {
  return (
    <BuildingModulePage
      title="Deposit settlement"
      description="Caution / deposit reconciliation at tenancy exit — Phase 2 of the Property process-group redesign."
      specRefs={['Property Exit stage', 'Deposit settlement (review meeting)']}
      backHref="/property/exit"
      backLabel="Exit"
    />
  );
}
