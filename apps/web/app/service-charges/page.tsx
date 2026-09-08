'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Service charges"
      description="SC ledger — available balance is FM spend boundary."
      specRefs={['SERVICE_CHARGE_STATEMENT']}
      backHref="/properties-hub"
      backLabel="Properties hub"
    />
  );
}
