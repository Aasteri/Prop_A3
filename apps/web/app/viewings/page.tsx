'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Viewings & inspections"
      description="Mandatory physical viewing after Show Interest; platform response."
      specRefs={['SALES_VIEWING_INSPECTION · Part H']}
      backHref="/properties-hub"
      backLabel="Properties hub"
    />
  );
}
