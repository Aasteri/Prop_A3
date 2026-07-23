'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, ApiError } from '@/lib/api';

type Project = { id: string; name: string; site: { code: string } };

type LineRow = {
  material: string;
  specification: string;
  quantityRequested: number;
  unit: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
};

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

const defaultLine: LineRow = {
  material: '',
  specification: '',
  quantityRequested: 1,
  unit: 'bags',
  urgency: 'NORMAL',
};

export default function NewMaterialRequestPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState('');
  const [requiredDate, setRequiredDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10),
  );
  const [area, setArea] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineRow[]>([{ ...defaultLine }]);
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

  async function save(submitForApproval: boolean) {
    setError('');
    setLoading(true);
    const validLines = lines.filter((l) => l.material.trim());
    if (!validLines.length) {
      setError('Add at least one material');
      setLoading(false);
      return;
    }

    try {
      const req = await api<{ id: string }>('/material-requests', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          requiredDate,
          area: area || undefined,
          notes: notes || undefined,
          lines: validLines,
        }),
      });

      if (submitForApproval) {
        await api(`/material-requests/${req.id}/submit`, { method: 'POST' });
      }

      router.push('/material-requests');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent, submitForApproval: boolean) {
    e.preventDefault();
    save(submitForApproval);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">New Material Request</h1>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Required date</span>
            <input
              type="date"
              value={requiredDate}
              onChange={(e) => setRequiredDate(e.target.value)}
              className={INPUT}
              required
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Area / zone</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className={INPUT}
              placeholder="e.g. Block A, Foundation"
            />
          </label>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Materials</p>
          {lines.map((line, i) => (
            <div key={i} className="mb-3 grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-2">
              <input
                placeholder="Material"
                value={line.material}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], material: e.target.value };
                  setLines(next);
                }}
                className={INPUT}
              />
              <input
                placeholder="Specification"
                value={line.specification}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], specification: e.target.value };
                  setLines(next);
                }}
                className={INPUT}
              />
              <input
                type="number"
                min={0.001}
                step={0.001}
                placeholder="Qty"
                value={line.quantityRequested}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], quantityRequested: Number(e.target.value) };
                  setLines(next);
                }}
                className={INPUT}
              />
              <div className="flex gap-2">
                <input
                  placeholder="Unit"
                  value={line.unit}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = { ...next[i], unit: e.target.value };
                    setLines(next);
                  }}
                  className={INPUT}
                />
                <select
                  value={line.urgency}
                  onChange={(e) => {
                    const next = [...lines];
                    next[i] = {
                      ...next[i],
                      urgency: e.target.value as LineRow['urgency'],
                    };
                    setLines(next);
                  }}
                  className={INPUT}
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setLines([...lines, { ...defaultLine }])}
            className="text-sm text-[#e87722]"
          >
            + Add material
          </button>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className={INPUT}
          />
        </label>

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="flex gap-3">
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
            {loading ? 'Saving…' : 'Submit to PM'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
