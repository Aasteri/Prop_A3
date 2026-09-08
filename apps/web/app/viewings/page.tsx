'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Inspection = {
  id: string;
  number: string;
  leadId: string | null;
  listingId: string | null;
  scheduledAt: string | null;
  occurred: boolean | null;
  observations: string | null;
  buyerFeedback: string | null;
  interestLevel: string | null;
  nextAction: string | null;
  status: string;
  responseAt: string | null;
};

type LeadOption = {
  id: string;
  leadRef: string;
  firstName: string;
  lastName: string;
  stage: string;
};

export default function ViewingsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inspection[]>([]);
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    leadId: '',
    scheduledAt: '',
  });
  const [responseFor, setResponseFor] = useState<string | null>(null);
  const [response, setResponse] = useState({
    occurred: true,
    observations: '',
    buyerFeedback: '',
    interestLevel: 'HIGH',
    nextAction: '',
  });

  const load = () => {
    api<Inspection[]>('/sales-inspections').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<LeadOption[]>('/crm/leads').then(setLeads).catch(console.error);
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/sales-inspections', {
        method: 'POST',
        body: JSON.stringify({
          leadId: form.leadId || undefined,
          scheduledAt: form.scheduledAt || undefined,
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to schedule viewing');
    }
  }

  async function submitResponse(e: FormEvent) {
    e.preventDefault();
    if (!responseFor) return;
    await api(`/sales-inspections/${responseFor}/response`, {
      method: 'POST',
      body: JSON.stringify(response),
    });
    setResponseFor(null);
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Sales · Viewings
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Viewings & inspections
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Physical inspection is mandatory. Platform response must be logged before CRM can
                advance past Viewing.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
            >
              {showForm ? 'Cancel' : 'Schedule viewing'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Lead</label>
              <select
                className={INPUT}
                value={form.leadId}
                onChange={(e) => setForm({ ...form, leadId: e.target.value })}
              >
                <option value="">Optional…</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.leadRef} — {l.firstName} {l.lastName} ({l.stage})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Scheduled at</label>
              <input
                type="datetime-local"
                className={INPUT}
                value={form.scheduledAt}
                onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {responseFor && (
          <form onSubmit={submitResponse} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
            <h2 className="sm:col-span-2 text-sm font-semibold text-[#1a2744]">
              Log platform response
            </h2>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input
                type="checkbox"
                checked={response.occurred}
                onChange={(e) => setResponse({ ...response, occurred: e.target.checked })}
              />
              Inspection occurred
            </label>
            <div className="sm:col-span-2">
              <label className={LABEL}>Observations</label>
              <textarea
                className={INPUT}
                rows={2}
                value={response.observations}
                onChange={(e) => setResponse({ ...response, observations: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Buyer feedback</label>
              <input
                className={INPUT}
                value={response.buyerFeedback}
                onChange={(e) => setResponse({ ...response, buyerFeedback: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Interest</label>
              <select
                className={INPUT}
                value={response.interestLevel}
                onChange={(e) => setResponse({ ...response, interestLevel: e.target.value })}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Next action</label>
              <input
                className={INPUT}
                value={response.nextAction}
                onChange={(e) => setResponse({ ...response, nextAction: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white">
                Save response
              </button>
              <button
                type="button"
                onClick={() => setResponseFor(null)}
                className="rounded-lg border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <Link href="/properties-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Properties hub
        </Link>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">{r.number}</p>
                  <p className="mt-1 text-sm text-slate-700">{r.status.replace(/_/g, ' ')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {r.scheduledAt ? `Scheduled ${new Date(r.scheduledAt).toLocaleString()}` : 'Unscheduled'}
                    {r.leadId ? (
                      <>
                        {' · '}
                        <Link href={`/crm/leads/${r.leadId}`} className="text-[#e87722] hover:underline">
                          Open lead
                        </Link>
                      </>
                    ) : null}
                  </p>
                  {r.buyerFeedback && (
                    <p className="mt-2 text-sm text-slate-600">Feedback: {r.buyerFeedback}</p>
                  )}
                </div>
                {r.status !== 'COMPLETED_RESPONSE_LOGGED' && (
                  <button
                    type="button"
                    onClick={() => setResponseFor(r.id)}
                    className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                  >
                    Log response
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No viewings yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
