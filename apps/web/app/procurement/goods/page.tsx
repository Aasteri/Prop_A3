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
  lines: { id: string; description: string; qty: string | number; unit: string | null; estUnitCost?: string | number | null }[];
};

type Supplier = { id: string; legalName: string };

type PurchaseOrder = {
  id: string;
  number: string;
  status: string;
  totalAmount: string | number | null;
  destination: string | null;
  paymentBeforeDelivery: boolean;
  supplier: { legalName: string };
  pr: { number: string } | null;
  lines: { id: string; description: string; qty: string | number; unitPrice: string | number }[];
  receipts: { id: string; number: string }[];
};

export default function GoodsProcurementPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Requisition[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
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
    api<PurchaseOrder[]>('/procurement/orders').then(setOrders).catch(console.error);
    api<Supplier[]>('/procurement/suppliers').then(setSuppliers).catch(console.error);
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

  async function convertToPo(pr: Requisition) {
    if (!suppliers.length) {
      alert('Add a supplier under Vendors first');
      return;
    }
    const supplierId =
      suppliers.length === 1
        ? suppliers[0].id
        : window.prompt(
            `Supplier id:\n${suppliers.map((s) => `${s.id} — ${s.legalName}`).join('\n')}`,
            suppliers[0].id,
          );
    if (!supplierId) return;
    const destination = window.prompt('Destination (site / warehouse / property)', '') || undefined;
    await api('/procurement/orders', {
      method: 'POST',
      body: JSON.stringify({
        supplierId,
        prId: pr.id,
        destination,
        paymentBeforeDelivery: true,
      }),
    });
    load();
  }

  async function receivePo(po: PurchaseOrder) {
    const invoiceNo = window.prompt('Supplier invoice number') || undefined;
    await api('/procurement/receipts', {
      method: 'POST',
      body: JSON.stringify({
        poId: po.id,
        supplierInvoiceNo: invoiceNo,
        lines: po.lines.map((l) => {
          const qty = Number(l.qty);
          return {
            description: l.description,
            qtyOrdered: qty,
            qtyReceived: qty,
            qtyAccepted: qty,
            qtyRejected: 0,
          };
        }),
      }),
    });
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
                PR → PO → GRN
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Payment-before-delivery default for many vendors. Site material requests remain a
                separate live flow.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
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
              <label className={LABEL}>Est. unit cost (₦)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={form.estUnitCost}
                onChange={(e) => setForm({ ...form, estUnitCost: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white"
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
          <Link href="/vendors" className="font-medium text-slate-600 hover:underline">
            Vendors
          </Link>
          <Link href="/material-requests" className="font-medium text-slate-600 hover:underline">
            Site material requests
          </Link>
        </div>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#1a2744]">Purchase requisitions</h2>
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
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={() => approve(r.id)}
                      className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white"
                    >
                      Approve
                    </button>
                  )}
                  {r.status === 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => convertToPo(r)}
                      className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white"
                    >
                      Convert to PO
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className={`${CARD} p-6 text-center text-sm text-slate-500`}>No PRs yet.</div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#1a2744]">Purchase orders & receipts</h2>
          {orders.map((o) => (
            <div key={o.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">{o.number}</p>
                  <p className="mt-1 text-sm text-slate-700">
                    {o.supplier.legalName}
                    {o.pr ? ` · from ${o.pr.number}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {o.status} · ₦{Number(o.totalAmount ?? 0).toLocaleString()}
                    {o.paymentBeforeDelivery ? ' · pay before delivery' : ''}
                    {o.receipts[0] ? ` · ${o.receipts[0].number}` : ''}
                  </p>
                </div>
                {(o.status === 'APPROVED' ||
                  o.status === 'SENT' ||
                  o.status === 'PARTIALLY_RECEIVED') && (
                  <button
                    type="button"
                    onClick={() => receivePo(o)}
                    className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Record GRN
                  </button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <div className={`${CARD} p-6 text-center text-sm text-slate-500`}>
              No purchase orders yet. Approve a PR and convert it.
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
