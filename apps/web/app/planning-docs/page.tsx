'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Planning documents"
      description="Attach TDP, C of O, soil test, Arch/Structural/M&E, BOQ, labour & material schedules."
      specRefs={['A.7.1 Planning docs library']}
      backHref="/projects-hub"
      backLabel="Projects hub"
    />
  );
}
