'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Landlord remittances"
      description="Gross rent − expenses → landlord."
      specRefs={['LANDLORD_REMITTANCE']}
      backHref="/properties-hub"
      backLabel="Properties hub"
    />
  );
}
