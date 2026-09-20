'use client';

import { useEffect, useState } from 'react';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { PublicShell } from '@/components/PublicShell';
import { publicApi } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';

type Project = {
  id: string;
  name: string;
  location: string | null;
  site: { code: string; name: string };
  milestones: { stage: string; progressPct: number }[];
};

export default function PublicProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Project>({
    items: projects,
    searchKeys: ['name', 'location', 'site.code', 'site.name'],
  });

  useEffect(() => {
    publicApi<Project[]>('/public/projects').then(setProjects).catch(console.error);
  }, []);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-[#1a2744]">Our projects</h1>
        <p className="mt-1 text-slate-600">Active developments across Abuja — open-book progress for clients</p>

        {projects.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search projects…"
          />
        )}

        <div className="mt-8 space-y-4">
          {pageItems.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium uppercase text-[#e87722]">{p.site.code}</p>
                  <h2 className="text-xl font-semibold text-[#1a2744]">{p.name}</h2>
                  <p className="text-sm text-slate-600">{p.location}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.milestones.map((m) => (
                  <span key={m.stage} className="rounded-full bg-slate-100 px-3 py-1 text-xs">
                    {m.stage.charAt(0) + m.stage.slice(1).toLowerCase()}: {m.progressPct.toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!projects.length && (
            <p className="text-sm text-slate-500">No projects to show.</p>
          )}
        </div>
        {projects.length > 0 && (
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        )}
      </div>
    </PublicShell>
  );
}
