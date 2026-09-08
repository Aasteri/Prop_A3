'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Requisition = {
  id: string;
  number: string;
  justification: string | null;
  status: string;
  neededBy: string | null;
  createdAt: string;
  lines: { id: string; description: string; qty: string | number; unit: string | null }[];
};

export default function GoodsProcurementPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Requisition[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    justification: '',
    neededBy: '',
    description: '',
    qty: '1',
    unit: 'pcs',
    estUnitCost: '',
  });

  const load = () => {
    api<Requisition[]>('/procurement/requisitions').then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/procurement/requisitions', {
        method: 'POST',
        body: JSON.stringify({
          justification: form.justification || undefined,
          neededBy: form.neededBy || undefined,
          lines: [
            {
              description: form.description,
              qty: Number(form.qty),
              unit: form.unit || undefined,
              estUnitCost: form.estUnitCost ? Number(form.estUnitCost) : undefined,
            },
          ],
        }),
      });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create PR');
    }
  }

  async function approve(id: string) {
    await api(`/procurement/requisitions/${id}/approve`, { method: 'PATCH' });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Procurement · Goods
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Purchase requisitions
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                PR → approve → PO → GRN path (PO/GRN UI next). Site material requests remain live.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
            >
              {showForm ? 'Cancel' : 'New PR'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div className="sm:col-span-2">
              <label className={LABEL}>Justification</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.justification}
                onChange={(e) => setForm({ ...form, justification: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Needed by</label>
              <input
                type="date"
                className={INPUT}
                value={form.neededBy}
                onChange={(e) => setForm({ ...form, neededBy: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Line description</label>
              <input
                className={INPUT}
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Qty</label>
              <input
                type="number"
                min={0.001}
                step="any"
                className={INPUT}
                required
                value={form.qty}
                onChange={(e) => setForm({ ...form, qty: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Unit</label>
              <input
                className={INPUT}
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
              >
                Submit requisition
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/procurement" className="font-medium text-[#e87722] hover:underline">
            ← Procurement hub
          </Link>
          <Link href="/material-requests" className="font-medium text-slate-600 hover:underline">
            Site material requests (live)
          </Link>
        </div>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">{r.number}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {r.justification || r.lines[0]?.description || '—'}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.status} · {r.lines.length} line(s)
                    {r.neededBy ? ` · needed ${r.neededBy.slice(0, 10)}` : ''}
                  </p>
                </div>
                {r.status === 'SUBMITTED' && (
                  <button
                    type="button"
                    onClick={() => approve(r.id)}
                    className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No purchase requisitions yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
