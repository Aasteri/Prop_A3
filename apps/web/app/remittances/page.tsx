'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Property = { id: string; name: string; landlordName: string | null };
type Remittance = {
  id: string;
  number: string;
  landlordName: string;
  periodStart: string;
  periodEnd: string;
  grossRent: number;
  otherReceipts: number;
  expensesTotal: number;
  netAmount: number;
  expenseNotes: string | null;
  status: string;
  transferRef: string | null;
  property: { id: string; name: string };
};

type Preview = {
  suggestedGrossRent: number;
  suggestedOtherReceipts: number;
  suggestedExpenses: number;
  suggestedNet: number;
  expenseNotesSuggested: string | null;
  note: string;
  breakdown: {
    rentPayments: { amount: number; invoiceNumber: string }[];
    depositShortfalls: { number: string; shortfallPaid: number }[];
    landlordMaintenance: { workOrder: string; amount: number }[];
    depositRefunds: { number: string; refundAmount: number }[];
  };
};

export default function RemittancesPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Remittance[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [form, setForm] = useState({
    propertyId: '',
    landlordName: '',
    periodStart: '',
    periodEnd: '',
    grossRent: '',
    otherReceipts: '0',
    expensesTotal: '0',
    expenseNotes: '',
  });

  const load = () => {
    api<Remittance[]>('/remittances')
      .then((data) =>
        setRows(
          data.map((r) => ({
            ...r,
            grossRent: Number(r.grossRent),
            otherReceipts: Number(r.otherReceipts),
            expensesTotal: Number(r.expensesTotal),
            netAmount: Number(r.netAmount),
          })),
        ),
      )
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<Property[]>('/properties').then(setProperties).catch(console.error);
  }, [router]);

  async function loadPreview() {
    if (!form.propertyId || !form.periodStart || !form.periodEnd) {
      setError('Select property and period before suggesting figures');
      return;
    }
    setError('');
    setPreviewBusy(true);
    try {
      const q = new URLSearchParams({
        propertyId: form.propertyId,
        periodStart: form.periodStart,
        periodEnd: form.periodEnd,
      });
      const data = await api<Preview>(`/remittances/preview?${q}`);
      setPreview(data);
      setForm((f) => ({
        ...f,
        grossRent: String(data.suggestedGrossRent),
        otherReceipts: String(data.suggestedOtherReceipts),
        expensesTotal: String(data.suggestedExpenses),
        expenseNotes: data.expenseNotesSuggested ?? f.expenseNotes,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
    } finally {
      setPreviewBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const prop = properties.find((p) => p.id === form.propertyId);
      await api('/remittances', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: form.propertyId,
          landlordName: form.landlordName || prop?.landlordName || 'Landlord',
          periodStart: form.periodStart,
          periodEnd: form.periodEnd,
          grossRent: Number(form.grossRent),
          otherReceipts: Number(form.otherReceipts) || 0,
          expensesTotal: Number(form.expensesTotal) || 0,
          expenseNotes: form.expenseNotes || undefined,
        }),
      });
      setShowForm(false);
      setPreview(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create remittance');
    }
  }

  async function approve(id: string) {
    await api(`/remittances/${id}/approve`, { method: 'PATCH' });
    load();
  }

  async function markPaid(id: string) {
    const transferRef = window.prompt('Transfer reference') || undefined;
    await api(`/remittances/${id}/paid`, {
      method: 'PATCH',
      body: JSON.stringify({ transferRef }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Finance · Remittances
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Landlord remittances
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Gross rent − approved expenses → net paid to landlord (BRD G.9–G.10). Suggests
                figures from rent payments, deposit shortfalls, and landlord maintenance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
            >
              {showForm ? 'Cancel' : 'New remittance'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Property</label>
              <select
                className={INPUT}
                required
                value={form.propertyId}
                onChange={(e) => {
                  const p = properties.find((x) => x.id === e.target.value);
                  setForm({
                    ...form,
                    propertyId: e.target.value,
                    landlordName: p?.landlordName ?? form.landlordName,
                  });
                  setPreview(null);
                }}
              >
                <option value="">Select…</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL}>Landlord</label>
              <input
                className={INPUT}
                required
                value={form.landlordName}
                onChange={(e) => setForm({ ...form, landlordName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Period start</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.periodStart}
                onChange={(e) => {
                  setForm({ ...form, periodStart: e.target.value });
                  setPreview(null);
                }}
              />
            </div>
            <div>
              <label className={LABEL}>Period end</label>
              <input
                type="date"
                className={INPUT}
                required
                value={form.periodEnd}
                onChange={(e) => {
                  setForm({ ...form, periodEnd: e.target.value });
                  setPreview(null);
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                disabled={previewBusy}
                onClick={loadPreview}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-[#1a2744] disabled:opacity-50"
              >
                {previewBusy ? 'Suggesting…' : 'Suggest from payments / deposits / maintenance'}
              </button>
            </div>
            {preview && (
              <div className="sm:col-span-2 rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                <p>
                  Suggested net NGN {preview.suggestedNet.toLocaleString()} ·{' '}
                  {preview.breakdown.rentPayments.length} rent payment(s) ·{' '}
                  {preview.breakdown.depositShortfalls.length} shortfall(s) ·{' '}
                  {preview.breakdown.landlordMaintenance.length} landlord WO(s)
                </p>
                {preview.breakdown.depositRefunds.length > 0 && (
                  <p>
                    Tenant refunds excluded:{' '}
                    {preview.breakdown.depositRefunds
                      .map((r) => `${r.number} NGN ${r.refundAmount.toLocaleString()}`)
                      .join(', ')}
                  </p>
                )}
                <p className="text-slate-500">{preview.note}</p>
              </div>
            )}
            <div>
              <label className={LABEL}>Gross rent (NGN)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                required
                value={form.grossRent}
                onChange={(e) => setForm({ ...form, grossRent: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Other receipts (NGN)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.otherReceipts}
                onChange={(e) => setForm({ ...form, otherReceipts: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Expenses (NGN)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.expensesTotal}
                onChange={(e) => setForm({ ...form, expensesTotal: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Expense notes</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.expenseNotes}
                onChange={(e) => setForm({ ...form, expenseNotes: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white"
              >
                Save draft
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
                  <h2 className="mt-1 font-semibold text-[#1a2744]">
                    {r.property.name} · {r.landlordName}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {r.periodStart.slice(0, 10)} → {r.periodEnd.slice(0, 10)} · Gross NGN{' '}
                    {r.grossRent.toLocaleString()}
                    {r.otherReceipts > 0
                      ? ` + other NGN ${r.otherReceipts.toLocaleString()}`
                      : ''}{' '}
                    − Exp NGN {r.expensesTotal.toLocaleString()} ={' '}
                    <strong>Net NGN {r.netAmount.toLocaleString()}</strong>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{r.status}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => downloadPdf(`/remittances/${r.id}/pdf`, `${r.number}.pdf`)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs text-[#1a2744]"
                  >
                    PDF
                  </button>
                  {r.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                    >
                      Approve
                    </button>
                  )}
                  {(r.status === 'DRAFT' || r.status === 'APPROVED') && (
                    <button
                      type="button"
                      onClick={() => markPaid(r.id)}
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                    >
                      Mark paid
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No remittances yet.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
