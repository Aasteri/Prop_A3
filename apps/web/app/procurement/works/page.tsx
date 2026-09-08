'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Works / subcontractors"
      description="Works contracts linked to projects, milestones, IVC."
      specRefs={['SUBCONTRACTOR_AGREEMENT · Part I.4']}
      backHref="/procurement"
      backLabel="Procurement hub"
    />
  );
}
