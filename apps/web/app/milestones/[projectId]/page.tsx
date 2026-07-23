'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  api,
  ApiError,
  getToken,
  getUser,
  uploadFcdaPermit,
  type AuthUser,
} from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Milestone = {
  id: string;
  stage: string;
  stageLabel: string;
  progressPct: number;
  fcdaGateActive: boolean;
  canReach100: boolean;
  certifiedAt: string | null;
  completedAt: string | null;
  notes: string | null;
  certifiedBy: { firstName: string; lastName: string } | null;
};

type MilestonesResponse = {
  project: {
    id: string;
    name: string;
    fcdaPermitUrl: string | null;
    site: { code: string; name: string };
  };
  milestones: Milestone[];
};

export default function ProjectMilestonesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [data, setData] = useState<MilestonesResponse | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [progressDraft, setProgressDraft] = useState<Record<string, number>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    const result = await api<MilestonesResponse>(`/milestones/project/${projectId}`);
    setData(result);
    const draft: Record<string, number> = {};
    for (const m of result.milestones) {
      draft[m.id] = m.progressPct;
    }
    setProgressDraft(draft);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/milestones'));
  }, [projectId, router]);

  const canEditProgress =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';
  const canCertify =
    user?.role === 'ENGINEER' || user?.role === 'CEO' || user?.role === 'ADMIN';
  const canUploadFcda =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  async function saveProgress(milestone: Milestone) {
    setError('');
    setBusy(milestone.id);
    try {
      await api(`/milestones/${milestone.id}/progress`, {
        method: 'PATCH',
        body: JSON.stringify({ progressPct: progressDraft[milestone.id] }),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed');
    } finally {
      setBusy('');
    }
  }

  async function certify(milestone: Milestone) {
    setError('');
    setBusy(`cert-${milestone.id}`);
    try {
      await api(`/milestones/${milestone.id}/certify`, { method: 'POST', body: '{}' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Certification failed');
    } finally {
      setBusy('');
    }
  }

  async function onFcdaUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !data) return;
    setError('');
    setBusy('fcda');
    try {
      await uploadFcdaPermit(data.project.id, file);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setBusy('');
      e.target.value = '';
    }
  }

  if (!data) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const foundation = data.milestones.find((m) => m.stage === 'FOUNDATION');

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <Link href="/milestones" className="text-sm text-[#e87722] hover:underline">
            ← All projects
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{data.project.name}</h1>
          <p className="text-slate-600">
            {data.project.site.code} · {data.project.site.name}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="font-semibold text-[#1a2744]">FCDA permit</h2>
          <p className="mt-1 text-sm text-slate-600">
            Foundation cannot reach 100% or be certified until the FCDA permit is uploaded.
          </p>

          {data.project.fcdaPermitUrl ? (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <a
                href={`${API_URL}${data.project.fcdaPermitUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[#e87722] hover:underline"
              >
                View uploaded permit
              </a>
              {canUploadFcda && (
                <label className="cursor-pointer text-sm text-slate-600 hover:text-[#1a2744]">
                  Replace file
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    disabled={busy === 'fcda'}
                    onChange={onFcdaUpload}
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="mt-3">
              {foundation && foundation.fcdaGateActive && (
                <p className="mb-2 text-sm font-medium text-amber-700">
                  Gate active — Foundation capped at 99% until permit is uploaded.
                </p>
              )}
              {canUploadFcda ? (
                <label className="inline-flex cursor-pointer items-center rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white hover:bg-[#253660]">
                  {busy === 'fcda' ? 'Uploading…' : 'Upload FCDA permit'}
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    className="hidden"
                    disabled={busy === 'fcda'}
                    onChange={onFcdaUpload}
                  />
                </label>
              ) : (
                <p className="text-sm text-slate-500">No permit uploaded yet.</p>
              )}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[#1a2744]">Milestone stages</h2>
          {data.milestones.map((m) => (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-[#1a2744]">{m.stageLabel}</p>
                  {m.certifiedAt ? (
                    <p className="text-sm text-green-700">
                      Certified by {m.certifiedBy?.firstName} {m.certifiedBy?.lastName} ·{' '}
                      {new Date(m.certifiedAt).toLocaleDateString()}
                    </p>
                  ) : m.progressPct >= 100 ? (
                    <p className="text-sm text-slate-600">Complete — awaiting engineer certification</p>
                  ) : (
                    <p className="text-sm text-slate-500">
                      Progress from approved site logs + PM override
                    </p>
                  )}
                </div>
                <span className="text-lg font-semibold text-[#e87722]">
                  {m.progressPct.toFixed(0)}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#e87722] transition-all"
                  style={{ width: `${Math.min(m.progressPct, 100)}%` }}
                />
              </div>

              {m.fcdaGateActive && !data.project.fcdaPermitUrl && (
                <p className="mt-2 text-xs text-amber-700">
                  FCDA gate: cannot exceed 99% without permit
                </p>
              )}

              {canEditProgress && !m.certifiedAt && (
                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <label className="text-sm">
                    <span className="text-slate-600">PM override %</span>
                    <input
                      type="number"
                      min={0}
                      max={m.canReach100 ? 100 : 99}
                      value={progressDraft[m.id] ?? m.progressPct}
                      onChange={(e) =>
                        setProgressDraft((prev) => ({
                          ...prev,
                          [m.id]: Number(e.target.value),
                        }))
                      }
                      className="mt-1 block w-24 rounded-md border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy === m.id}
                    onClick={() => saveProgress(m)}
                    className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white hover:bg-[#253660] disabled:opacity-50"
                  >
                    {busy === m.id ? 'Saving…' : 'Save progress'}
                  </button>
                </div>
              )}

              {canCertify && m.progressPct >= 100 && !m.certifiedAt && (
                <button
                  type="button"
                  disabled={busy === `cert-${m.id}`}
                  onClick={() => certify(m)}
                  className="mt-4 rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {busy === `cert-${m.id}` ? 'Certifying…' : 'Certify milestone'}
                </button>
              )}
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
