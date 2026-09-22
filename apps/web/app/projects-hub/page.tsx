'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ProcessGroupPulse } from '@/components/ProcessGroupPulse';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, PAGE_HEADER } from '@/lib/ui';
import {
  PROCESS_GROUP_META,
  PROJECT_STAGES,
  type ProjectProcessGroup,
} from '@/lib/process-stages';

type ProjectRow = {
  id: string;
  name: string;
  status: string;
  processGroup: ProjectProcessGroup;
  site: { code: string; name: string };
};

const CAN_EDIT = ['CEO', 'ADMIN', 'PROJECT_MANAGER'];

export default function ProjectsHubPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<ProjectRow[]>('/projects')
      .then(setProjects)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load projects'));
  }, [router]);

  const canEdit = user && CAN_EDIT.includes(user.role);

  async function setGroup(id: string, processGroup: ProjectProcessGroup) {
    setBusyId(id);
    setError('');
    try {
      const updated = await api<ProjectRow>(`/projects/${id}/process-group`, {
        method: 'PATCH',
        body: JSON.stringify({ processGroup }),
      });
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update process group');
    } finally {
      setBusyId(null);
    }
  }

  const byGroup = PROJECT_STAGES.map((stage) => {
    const key = stage.slug === 'monitor' ? 'MONITOR' : stage.slug.toUpperCase();
    const group = key as ProjectProcessGroup;
    return {
      stage,
      group,
      items: projects.filter((p) => p.processGroup === group),
    };
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Pulse
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Project process tracker
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
            See which PM process group each project is in. Open a stage menu for chronological
            modules, or advance the pulse when the team moves on.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PROJECT_STAGES.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="rounded-lg border border-white/30 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/10"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {byGroup.map(({ stage, group, items }) => (
            <div key={group} className={`${CARD} p-4`}>
              <Link
                href={stage.href}
                className="text-sm font-semibold text-[#1a2744] hover:text-[#e87722]"
              >
                {PROCESS_GROUP_META[group].short}
              </Link>
              <p className="mt-1 text-2xl font-bold text-[#e87722]">{items.length}</p>
              <p className="text-xs text-slate-500">project{items.length === 1 ? '' : 's'}</p>
            </div>
          ))}
        </section>

        <section className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Project</th>
                <th className="px-4 py-3 font-semibold">Site</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Process group</th>
                <th className="px-4 py-3 font-semibold">Open stage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projects.map((p) => {
                const meta = PROCESS_GROUP_META[p.processGroup] ?? PROCESS_GROUP_META.INITIATE;
                return (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-medium text-[#1a2744]">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {p.site.code} · {p.site.name}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.status}</td>
                    <td className="px-4 py-3">
                      <ProcessGroupPulse
                        value={p.processGroup}
                        compact
                        disabled={busyId === p.id || !canEdit}
                        onChange={canEdit ? (g) => setGroup(p.id, g) : undefined}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link href={meta.href} className="font-medium text-[#e87722] hover:underline">
                        {meta.label} →
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!projects.length && !error && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No projects yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </AppShell>
  );
}
