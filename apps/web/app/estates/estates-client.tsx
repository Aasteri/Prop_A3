'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { SitesMap, type SiteMarker } from '@/components/SitesMap';
import type { PublicSiteMarker } from '@/lib/public-server';

export function EstatesClient({ initialSites }: { initialSites: PublicSiteMarker[] }) {
  const [sites] = useState<SiteMarker[]>(
    initialSites.map((s) => ({
      ...s,
      location: s.location,
      projectNames: s.projectNames ?? [],
    })),
  );

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-[#1a2744]">Our sites in Abuja</h1>
        <p className="mt-1 text-slate-600">
          Active development locations — click a marker for project details.{' '}
          <Link href="/properties" className="text-[#e87722] hover:underline">
            Browse available units →
          </Link>
        </p>

        <div className="mt-8">
          {sites.length > 0 ? (
            <SitesMap sites={sites} />
          ) : (
            <p className="text-slate-500">Map data unavailable right now.</p>
          )}
        </div>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {sites.map((s) => (
            <li key={s.code} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-semibold text-[#1a2744]">
                {s.code} · {s.name}
              </p>
              <p className="text-sm text-slate-600">{s.location}</p>
              <p className="mt-1 text-xs text-slate-500">
                {s.activeProjects} active project{s.activeProjects === 1 ? '' : 's'}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
