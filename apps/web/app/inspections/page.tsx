'use client';

import { BuildingModulePage } from '@/components/ModulePage';

export default function Page() {
  return (
    <BuildingModulePage
      title="Inspections & QC"
      description="20-category inspection log, pre-pour checklist, snag closeout."
      specRefs={['Part B.3 · Doc 4 · pre-pour verbal']}
      backHref="/projects-hub"
      backLabel="Projects hub"
    />
  );
}
