'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Attribution = {
  id: string;
  earnerType: string;
  earnerName: string | null;
  earnerRef: string | null;
  sharePct: string | number | null;
  amount: string | number;
  category: string | null;
  notes: string | null;
};

type Inflow = {
  id: string;
  number: string;
  channel: string;
  grossAmount: string | number;
  receivedAt: string;
  payerName: string | null;
  payerReference: string | null;
  paystackRef: string | null;
  status: string;
  notes: string | null;
  invoice: {
    id: string;
    invoiceNumber: string;
    invoiceType: string;
    clientName: string;
  } | null;
  attributions: Attribution[];
};

const money = (n: string | number) =>
  `₦${Number(n).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

export default function MoneyInflowsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Inflow[]>([]);
  const [selected, setSelected] = useState<Inflow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editLines, setEditLines] = useState<
    { earnerType: string; earnerName: string; amount: string; category: string; notes: string }[]
  >([]);

  const load = () =>
    api<Inflow[]>('/money-inflows')
      .then(setRows)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load'));

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  function openRow(row: Inflow) {
    setSelected(row);
    setEditLines(
      row.attributions.map((a) => ({
        earnerType: a.earnerType,
        earnerName: a.earnerName ?? '',
        amount: String(Number(a.amount)),
        category: a.category ?? '',
        notes: a.notes ?? '',
      })),
    );
    setError('');
  }

  async function saveAttributions(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api<Inflow>(`/money-inflows/${selected.id}/attributions`, {
        method: 'PATCH',
        body: JSON.stringify({
          attributions: editLines.map((l) => ({
            earnerType: l.earnerType,
            earnerName: l.earnerName || undefined,
            amount: Number(l.amount),
            category: l.category || undefined,
            notes: l.notes || undefined,
          })),
        }),
      });
      setSelected(updated);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="mb-6 space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Finance · Money inflows
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Money attribution
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                All receipts enter the system (bank transfer or Paystack). The system attributes who
                earned each portion — company fees, landlord rent, agents, artisans, etc. Finance can
                adjust splits.
              </p>
            </div>
            <Link
              href="/payouts"
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
            >
              Build payout for period
            </Link>
          </div>
        </header>
      </div>

      {error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={`${CARD} overflow-x-auto`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Number</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Gross</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Invoice</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                    selected?.id === r.id ? 'bg-[#fff8f2]' : ''
                  }`}
                  onClick={() => openRow(r)}
                >
                  <td className="px-3 py-2 font-mono text-xs">{r.number}</td>
                  <td className="px-3 py-2">{r.channel}</td>
                  <td className="px-3 py-2">{money(r.grossAmount)}</td>
                  <td className="px-3 py-2">{r.status}</td>
                  <td className="px-3 py-2">{r.invoice?.invoiceNumber ?? '—'}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    No inflows yet. Verify a payment to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={CARD}>
          {!selected ? (
            <p className="text-sm text-slate-500">Select an inflow to view / adjust attributions.</p>
          ) : (
            <form onSubmit={saveAttributions} className="space-y-4">
              <div>
                <h2 className="font-semibold text-[#1a2744]">{selected.number}</h2>
                <p className="text-sm text-slate-600">
                  {selected.payerName ?? '—'} · {money(selected.grossAmount)} · {selected.channel}
                </p>
                {selected.notes && <p className="mt-1 text-xs text-slate-500">{selected.notes}</p>}
              </div>

              {editLines.map((line, idx) => (
                <div key={idx} className="grid gap-2 rounded-md border border-slate-100 bg-slate-50 p-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Earner type</label>
                    <select
                      className={INPUT}
                      value={line.earnerType}
                      onChange={(e) => {
                        const next = [...editLines];
                        next[idx] = { ...line, earnerType: e.target.value };
                        setEditLines(next);
                      }}
                    >
                      {[
                        'COMPANY',
                        'INTERNAL_STAFF',
                        'EXTERNAL_AGENT',
                        'ARTISAN',
                        'PROFESSIONAL',
                        'SUBCONTRACTOR',
                        'LANDLORD',
                        'OTHER',
                      ].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={LABEL}>Name</label>
                    <input
                      className={INPUT}
                      value={line.earnerName}
                      onChange={(e) => {
                        const next = [...editLines];
                        next[idx] = { ...line, earnerName: e.target.value };
                        setEditLines(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Amount ₦</label>
                    <input
                      className={INPUT}
                      type="number"
                      step="0.01"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...editLines];
                        next[idx] = { ...line, amount: e.target.value };
                        setEditLines(next);
                      }}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Category</label>
                    <input
                      className={INPUT}
                      value={line.category}
                      onChange={(e) => {
                        const next = [...editLines];
                        next[idx] = { ...line, category: e.target.value };
                        setEditLines(next);
                      }}
                      placeholder="AGENCY_FEE, RENT_TO_LANDLORD…"
                    />
                  </div>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
                  onClick={() =>
                    setEditLines([
                      ...editLines,
                      {
                        earnerType: 'COMPANY',
                        earnerName: 'Triple A Realty Projects Ltd',
                        amount: '0',
                        category: 'OTHER',
                        notes: '',
                      },
                    ])
                  }
                >
                  Add line
                </button>
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-md bg-[#1a2744] px-4 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Save attributions
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AppShell>
  );
}
