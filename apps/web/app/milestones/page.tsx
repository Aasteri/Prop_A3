'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';

type Project = {
  id: string;
  name: string;
  site: { code: string };
  fcdaPermitUrl: string | null;
  milestones: { stage: string; progressPct: string | number; certifiedAt: string | null }[];
};

export default function MilestonesIndexPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Project[]>('/projects').then(setProjects).catch(console.error);
  }, [router]);

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Project milestones</h1>
          <p className="text-slate-600">
            Foundation → Shell → Finishing → Handover with FCDA gate & engineer certification
          </p>
        </div>

        <div className="space-y-3">
          {projects.map((p) => {
            const foundation = p.milestones.find((m) => m.stage === 'FOUNDATION');
            const foundationPct = Number(foundation?.progressPct ?? 0);
            const needsFcda = foundationPct >= 99 && !p.fcdaPermitUrl;

            return (
              <Link
                key={p.id}
                href={`/milestones/${p.id}`}
                className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-[#e87722]"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-[#1a2744]">{p.name}</p>
                    <p className="text-sm text-slate-500">{p.site.code}</p>
                  </div>
                  {needsFcda && (
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                      FCDA permit required
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.milestones.map((m) => (
                    <span
                      key={m.stage}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700"
                    >
                      {m.stage.charAt(0) + m.stage.slice(1).toLowerCase()}:{' '}
                      {Number(m.progressPct).toFixed(0)}%
                      {m.certifiedAt ? ' ✓' : ''}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
          {!projects.length && (
            <p className="text-sm text-slate-500">No projects available.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
