'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Services & artisans"
      description="Artisan KYC, photo service requests, estimates, 2.5% fee."
      specRefs={['ARTISAN_KYC · SERVICE_REQUEST']}
      backHref="/procurement"
      backLabel="Procurement hub"
    />
  );
}
