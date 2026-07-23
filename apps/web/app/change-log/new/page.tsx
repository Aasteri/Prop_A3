'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, ApiError } from '@/lib/api';

type Project = {
  id: string;
  name: string;
  location: string | null;
  site: { code: string };
};

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function NewChangeLogPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [revisionDate, setRevisionDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [impactLevel, setImpactLevel] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('LOW');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Project[]>('/projects').then((list) => {
      setProjects(list);
      if (list[0]) setProjectId(list[0].id);
    });
  }, [router]);

  async function save(submitForReview: boolean) {
    setError('');
    setLoading(true);
    try {
      const entry = await api<{ id: string }>('/change-log', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          revisionDate,
          description,
          justification,
          impactLevel,
        }),
      });

      if (submitForReview) {
        await api(`/change-log/${entry.id}/submit`, { method: 'POST' });
      }

      router.push('/change-log');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent, submitForReview: boolean) {
    e.preventDefault();
    save(submitForReview);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">Raise Project Change</h1>

      <form className="max-w-2xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Project</span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={INPUT}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.site.code} — {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Date of revision</span>
          <input
            type="date"
            value={revisionDate}
            onChange={(e) => setRevisionDate(e.target.value)}
            className={INPUT}
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Change description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={INPUT}
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Justification</span>
          <textarea
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            rows={3}
            className={INPUT}
            required
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Impact (Scope / Time / Cost)</span>
          <select
            value={impactLevel}
            onChange={(e) => setImpactLevel(e.target.value as typeof impactLevel)}
            className={INPUT}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Med</option>
            <option value="HIGH">High (requires CEO approval)</option>
          </select>
        </label>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e, false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e, true)}
            className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
          >
            {loading ? 'Saving…' : 'Submit for review'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
