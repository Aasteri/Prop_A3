'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyProjectGate } from '@/components/EmptyEntityGate';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { BTN_PRIMARY, BTN_SECONDARY, CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; site?: { code: string } };

type Bundle = {
  project: Project;
  feasibility: {
    budgetBand: string | null;
    siteNotes: string | null;
    clientNeed: string | null;
    objectives: string | null;
    constraints: string | null;
    decision: string;
    notes: string | null;
  } | null;
  stakeholders: {
    id: string;
    name: string;
    role: string | null;
    organisation: string | null;
    interest: string | null;
    influence: string | null;
    contact: string | null;
  }[];
};

const emptyFeas = {
  budgetBand: '',
  siteNotes: '',
  clientNeed: '',
  objectives: '',
  constraints: '',
  decision: 'PENDING',
  notes: '',
};

export default function FeasibilityPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [form, setForm] = useState(emptyFeas);
  const [stake, setStake] = useState({
    name: '',
    role: '',
    organisation: '',
    interest: '',
    influence: '',
    contact: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    ],
    [projects],
  );

  const load = (pid: string) => {
    if (!pid) {
      setBundle(null);
      setForm(emptyFeas);
      return;
    }
    api<Bundle>(`/feasibility/${pid}`)
      .then((b) => {
        setBundle(b);
        const f = b.feasibility;
        setForm(
          f
            ? {
                budgetBand: f.budgetBand ?? '',
                siteNotes: f.siteNotes ?? '',
                clientNeed: f.clientNeed ?? '',
                objectives: f.objectives ?? '',
                constraints: f.constraints ?? '',
                decision: f.decision,
                notes: f.notes ?? '',
              }
            : emptyFeas,
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<Project[]>('/projects')
      .then((list) => {
        setProjects(list);
        if (list[0]) {
          setProjectId(list[0].id);
          load(list[0].id);
        }
      })
      .catch(console.error);
  }, [router]);

  async function saveFeas(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !canManage) return;
    setBusy(true);
    setError('');
    try {
      await api(`/feasibility/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          budgetBand: form.budgetBand || undefined,
          siteNotes: form.siteNotes || undefined,
          clientNeed: form.clientNeed || undefined,
          objectives: form.objectives || undefined,
          constraints: form.constraints || undefined,
          decision: form.decision,
          notes: form.notes || undefined,
        }),
      });
      load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function addStake(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !canManage || !stake.name.trim()) return;
    setBusy(true);
    try {
      await api(`/feasibility/${projectId}/stakeholders`, {
        method: 'POST',
        body: JSON.stringify(stake),
      });
      setStake({ name: '', role: '', organisation: '', interest: '', influence: '', contact: '' });
      load(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add stakeholder');
    } finally {
      setBusy(false);
    }
  }

  async function removeStake(id: string) {
    if (!window.confirm('Remove stakeholder?')) return;
    await api(`/feasibility/stakeholders/${id}`, { method: 'DELETE' });
    load(projectId);
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Initiate · Feasibility
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Feasibility & stakeholders
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Capture budget band, site notes, go/no-go, and the stakeholder register before
                charter sign-off.
              </p>
            </div>
            <Link
              href="/projects/initiate"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white"
            >
              Initiate hub
            </Link>
          </div>
        </header>

        {!projects.length ? (
          <EmptyProjectGate moduleLabel="feasibility" />
        ) : (
          <>
            <div className={`${CARD} p-4`}>
              <label className={LABEL}>Project</label>
              <SearchableSelect
                className={INPUT}
                options={projectOptions}
                value={projectId}
                onChange={(v) => {
                  setProjectId(v);
                  load(v);
                }}
                emptyLabel="Select…"
                placeholder="Search…"
              />
            </div>

            {error && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            {canManage && (
              <form onSubmit={saveFeas} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
                <h2 className="sm:col-span-2 font-semibold text-[#1a2744]">Feasibility study</h2>
                <label className="block text-sm">
                  <span className={LABEL}>Budget band</span>
                  <input
                    className={INPUT}
                    value={form.budgetBand}
                    onChange={(e) => setForm({ ...form, budgetBand: e.target.value })}
                    placeholder="e.g. ₦80m–₦120m"
                  />
                </label>
                <label className="block text-sm">
                  <span className={LABEL}>Decision</span>
                  <SearchableSelect
                    className={INPUT}
                    options={optionsFromValues(['PENDING', 'GO', 'NO_GO', 'HOLD'])}
                    value={form.decision}
                    onChange={(v) => setForm({ ...form, decision: v })}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={LABEL}>Client need</span>
                  <textarea
                    className={INPUT}
                    rows={2}
                    value={form.clientNeed}
                    onChange={(e) => setForm({ ...form, clientNeed: e.target.value })}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={LABEL}>Objectives</span>
                  <textarea
                    className={INPUT}
                    rows={2}
                    value={form.objectives}
                    onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={LABEL}>Site notes</span>
                  <textarea
                    className={INPUT}
                    rows={2}
                    value={form.siteNotes}
                    onChange={(e) => setForm({ ...form, siteNotes: e.target.value })}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={LABEL}>Constraints</span>
                  <textarea
                    className={INPUT}
                    rows={2}
                    value={form.constraints}
                    onChange={(e) => setForm({ ...form, constraints: e.target.value })}
                  />
                </label>
                <label className="block text-sm sm:col-span-2">
                  <span className={LABEL}>Notes</span>
                  <textarea
                    className={INPUT}
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={busy} className={BTN_PRIMARY}>
                    {busy ? 'Saving…' : 'Save feasibility'}
                  </button>
                </div>
              </form>
            )}

            <section className={`${CARD} p-6`}>
              <h2 className="font-semibold text-[#1a2744]">Stakeholder register</h2>
              {canManage && (
                <form onSubmit={addStake} className="mt-4 grid gap-3 sm:grid-cols-3">
                  <input
                    required
                    className={INPUT}
                    placeholder="Name"
                    value={stake.name}
                    onChange={(e) => setStake({ ...stake, name: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Role"
                    value={stake.role}
                    onChange={(e) => setStake({ ...stake, role: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Organisation"
                    value={stake.organisation}
                    onChange={(e) => setStake({ ...stake, organisation: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Interest"
                    value={stake.interest}
                    onChange={(e) => setStake({ ...stake, interest: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Influence"
                    value={stake.influence}
                    onChange={(e) => setStake({ ...stake, influence: e.target.value })}
                  />
                  <input
                    className={INPUT}
                    placeholder="Contact"
                    value={stake.contact}
                    onChange={(e) => setStake({ ...stake, contact: e.target.value })}
                  />
                  <button type="submit" disabled={busy} className={BTN_SECONDARY}>
                    Add stakeholder
                  </button>
                </form>
              )}
              <ul className="mt-4 divide-y text-sm">
                {(bundle?.stakeholders ?? []).map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <div>
                      <p className="font-medium text-[#1a2744]">{s.name}</p>
                      <p className="text-slate-500">
                        {[s.role, s.organisation, s.interest, s.influence, s.contact]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => removeStake(s.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </li>
                ))}
                {!bundle?.stakeholders?.length && (
                  <li className="py-4 text-slate-500">No stakeholders yet.</li>
                )}
              </ul>
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}
