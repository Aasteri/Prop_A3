'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; status: string };
type Charter = {
  id: string;
  number: string;
  title: string;
  status: string;
  executiveSummary: string;
  companySignedAt: string | null;
  clientSignedAt: string | null;
  project: Project;
};
type Kickoff = {
  id: string;
  number: string;
  status: string;
  meetingAt: string;
  location: string | null;
  project: Project;
};

function linesToList(text: string) {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ChartersPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [charters, setCharters] = useState<Charter[]>([]);
  const [kickoffs, setKickoffs] = useState<Kickoff[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tab, setTab] = useState<'charters' | 'kickoffs'>('charters');
  const [showCharter, setShowCharter] = useState(false);
  const [showKickoff, setShowKickoff] = useState(false);
  const [error, setError] = useState('');
  const [charterForm, setCharterForm] = useState({
    projectId: '',
    title: '',
    executiveSummary: '',
    goals: '',
    deliverables: '',
    businessCase: '',
    benefits: '',
    costs: '',
    budgetRange: '',
    timeline: '',
    risks: '',
    scopeIn: '',
    scopeOut: '',
    team: '',
    successCriteria: '',
  });
  const [kickoffForm, setKickoffForm] = useState({
    projectId: '',
    meetingAt: '',
    location: '',
    attendees: '',
    actions: '',
  });

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const load = () => {
    api<Charter[]>('/charters').then(setCharters).catch(console.error);
    api<Kickoff[]>('/kickoffs').then(setKickoffs).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    api<Project[]>('/projects').then(setProjects).catch(console.error);
  }, [router]);

  async function createCharter(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/charters', {
        method: 'POST',
        body: JSON.stringify({
          projectId: charterForm.projectId,
          title: charterForm.title,
          executiveSummary: charterForm.executiveSummary,
          goals: linesToList(charterForm.goals),
          deliverables: linesToList(charterForm.deliverables),
          businessCase: charterForm.businessCase || undefined,
          benefits: charterForm.benefits || undefined,
          costs: charterForm.costs || undefined,
          budgetRange: charterForm.budgetRange || undefined,
          timeline: charterForm.timeline || undefined,
          risks: linesToList(charterForm.risks),
          scopeIn: linesToList(charterForm.scopeIn),
          scopeOut: linesToList(charterForm.scopeOut),
          team: linesToList(charterForm.team),
          successCriteria: linesToList(charterForm.successCriteria),
        }),
      });
      setShowCharter(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create charter');
    }
  }

  async function createKickoff(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const attendees = linesToList(kickoffForm.attendees).map((line) => {
        const [name, role, email, phone] = line.split('|').map((s) => s.trim());
        return { name, role, email, phone };
      });
      const actions = linesToList(kickoffForm.actions).map((line) => {
        const [action, actionedBy, dueDate] = line.split('|').map((s) => s.trim());
        return { action, actionedBy, dueDate };
      });
      await api('/kickoffs', {
        method: 'POST',
        body: JSON.stringify({
          projectId: kickoffForm.projectId,
          meetingAt: new Date(kickoffForm.meetingAt).toISOString(),
          location: kickoffForm.location || undefined,
          attendees,
          actions,
        }),
      });
      setShowKickoff(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create kick-off');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Initiation
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Charters & kick-off
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Doc 1 charter dual sign-off unlocks Doc 2 kick-off publish (US-INIT-09–13 /
                US-PLAN-01).
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('charters')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === 'charters' ? 'bg-[#e87722] text-white' : 'bg-white/10 text-white'
                }`}
              >
                Charters
              </button>
              <button
                type="button"
                onClick={() => setTab('kickoffs')}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === 'kickoffs' ? 'bg-[#e87722] text-white' : 'bg-white/10 text-white'
                }`}
              >
                Kick-offs
              </button>
            </div>
          </div>
        </header>

        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <Link href="/projects-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Projects hub
        </Link>

        {tab === 'charters' && (
          <>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowCharter((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showCharter ? 'Cancel' : 'New charter'}
              </button>
            )}
            {showCharter && (
              <form onSubmit={createCharter} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Project</label>
                  <select
                    className={INPUT}
                    required
                    value={charterForm.projectId}
                    onChange={(e) => setCharterForm({ ...charterForm, projectId: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Title</label>
                  <input
                    className={INPUT}
                    required
                    value={charterForm.title}
                    onChange={(e) => setCharterForm({ ...charterForm, title: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Executive summary</label>
                  <textarea
                    className={INPUT}
                    rows={3}
                    required
                    value={charterForm.executiveSummary}
                    onChange={(e) =>
                      setCharterForm({ ...charterForm, executiveSummary: e.target.value })
                    }
                  />
                </div>
                {(
                  [
                    ['goals', 'Goals (one per line)'],
                    ['deliverables', 'Deliverables'],
                    ['risks', 'Risks'],
                    ['scopeIn', 'In scope'],
                    ['scopeOut', 'Out of scope'],
                    ['team', 'Team / stakeholders'],
                    ['successCriteria', 'Success criteria'],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="sm:col-span-2">
                    <label className={LABEL}>{label}</label>
                    <textarea
                      className={INPUT}
                      rows={2}
                      value={charterForm[key]}
                      onChange={(e) => setCharterForm({ ...charterForm, [key]: e.target.value })}
                    />
                  </div>
                ))}
                <div>
                  <label className={LABEL}>Budget range</label>
                  <input
                    className={INPUT}
                    value={charterForm.budgetRange}
                    onChange={(e) =>
                      setCharterForm({ ...charterForm, budgetRange: e.target.value })
                    }
                    placeholder="e.g. NGN 600M–800M"
                  />
                </div>
                <div>
                  <label className={LABEL}>Timeline</label>
                  <input
                    className={INPUT}
                    value={charterForm.timeline}
                    onChange={(e) => setCharterForm({ ...charterForm, timeline: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white"
                  >
                    Save draft charter
                  </button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {charters.map((c) => (
                <div key={c.id} className={`${CARD} p-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#e87722]">
                        {c.number} · {c.status}
                      </p>
                      <h2 className="mt-1 font-semibold text-[#1a2744]">
                        {c.project.name} · {c.title}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        Company {c.companySignedAt ? 'signed' : 'pending'} · Client{' '}
                        {c.clientSignedAt ? 'signed' : 'pending'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
                        onClick={() => downloadPdf(`/charters/${c.id}/pdf`, `${c.number}.pdf`)}
                      >
                        PDF
                      </button>
                      {canManage && c.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                          onClick={() =>
                            api(`/charters/${c.id}/submit`, { method: 'PATCH' }).then(load)
                          }
                        >
                          Submit review
                        </button>
                      )}
                      {canManage && c.status !== 'APPROVED' && c.status !== 'DRAFT' && (
                        <>
                          {!c.companySignedAt && (
                            <button
                              type="button"
                              className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                              onClick={() =>
                                api(`/charters/${c.id}/sign-company`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({}),
                                }).then(load)
                              }
                            >
                              Company sign
                            </button>
                          )}
                          {!c.clientSignedAt && (
                            <button
                              type="button"
                              className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                              onClick={() => {
                                const signedBy =
                                  window.prompt('Client signatory name') || undefined;
                                return api(`/charters/${c.id}/sign-client`, {
                                  method: 'PATCH',
                                  body: JSON.stringify({ signedBy }),
                                }).then(load);
                              }}
                            >
                              Client sign
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!charters.length && (
                <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
                  No charters yet.
                </div>
              )}
            </div>
          </>
        )}

        {tab === 'kickoffs' && (
          <>
            {canManage && (
              <button
                type="button"
                onClick={() => setShowKickoff((v) => !v)}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
              >
                {showKickoff ? 'Cancel' : 'New kick-off'}
              </button>
            )}
            {showKickoff && (
              <form onSubmit={createKickoff} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
                <div>
                  <label className={LABEL}>Project</label>
                  <select
                    className={INPUT}
                    required
                    value={kickoffForm.projectId}
                    onChange={(e) => setKickoffForm({ ...kickoffForm, projectId: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Meeting datetime</label>
                  <input
                    type="datetime-local"
                    className={INPUT}
                    required
                    value={kickoffForm.meetingAt}
                    onChange={(e) => setKickoffForm({ ...kickoffForm, meetingAt: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>Location</label>
                  <input
                    className={INPUT}
                    value={kickoffForm.location}
                    onChange={(e) => setKickoffForm({ ...kickoffForm, location: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>
                    Attendees (one per line: Name | Role | Email | Phone)
                  </label>
                  <textarea
                    className={INPUT}
                    rows={3}
                    value={kickoffForm.attendees}
                    onChange={(e) => setKickoffForm({ ...kickoffForm, attendees: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className={LABEL}>
                    Actions (one per line: Action | Owner | Due YYYY-MM-DD)
                  </label>
                  <textarea
                    className={INPUT}
                    rows={3}
                    value={kickoffForm.actions}
                    onChange={(e) => setKickoffForm({ ...kickoffForm, actions: e.target.value })}
                  />
                </div>
                <p className="sm:col-span-2 text-xs text-slate-500">
                  Default Doc 2 agenda is applied automatically. Publish requires approved charter.
                </p>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white"
                  >
                    Save draft minutes
                  </button>
                </div>
              </form>
            )}
            <div className="space-y-3">
              {kickoffs.map((k) => (
                <div key={k.id} className={`${CARD} p-4`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-[#e87722]">
                        {k.number} · {k.status}
                      </p>
                      <h2 className="mt-1 font-semibold text-[#1a2744]">{k.project.name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {new Date(k.meetingAt).toLocaleString()}
                        {k.location ? ` · ${k.location}` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs"
                        onClick={() => downloadPdf(`/kickoffs/${k.id}/pdf`, `${k.number}.pdf`)}
                      >
                        PDF
                      </button>
                      {canManage && k.status === 'DRAFT' && (
                        <button
                          type="button"
                          className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                          onClick={() =>
                            api(`/kickoffs/${k.id}/publish`, { method: 'PATCH' })
                              .then(load)
                              .catch((err) =>
                                setError(err instanceof Error ? err.message : 'Publish failed'),
                              )
                          }
                        >
                          Publish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {!kickoffs.length && (
                <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
                  No kick-off meetings yet.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
