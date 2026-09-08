'use client';

import { AppShell } from '@/components/AppShell';
import { ModuleHub, type HubLink } from '@/components/ModuleHub';
import { CARD, PAGE_HEADER } from '@/lib/ui';
import Link from 'next/link';

export function HubPage({
  eyebrow,
  title,
  subtitle,
  links,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  links: HubLink[];
}) {
  return (
    <AppShell>
      <ModuleHub eyebrow={eyebrow} title={title} subtitle={subtitle} links={links} />
    </AppShell>
  );
}

/** Placeholder for modules being built against the master BRD */
export function BuildingModulePage({
  title,
  description,
  specRefs,
  backHref = '/dashboard',
  backLabel = 'Dashboard',
}: {
  title: string;
  description: string;
  specRefs: string[];
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Redesign in progress
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">{description}</p>
        </header>

        <div className={CARD + ' p-6'}>
          <h2 className="text-base font-semibold text-[#1a2744]">Specification anchors</h2>
          <p className="mt-1 text-sm text-slate-600">
            This screen is being built to the production-default templates and Master BRD. Existing
            live flows remain available from the hubs.
          </p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {specRefs.map((ref) => (
              <li key={ref}>{ref}</li>
            ))}
          </ul>
          <Link
            href={backHref}
            className="mt-6 inline-flex rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
          >
            ← {backLabel}
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
