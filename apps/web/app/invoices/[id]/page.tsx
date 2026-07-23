'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import {
  api,
  downloadPdf,
  getToken,
  getUser,
  uploadPaymentProof,
  type AuthUser,
} from '@/lib/api';

type InvoiceDetail = {
  id: string;
  invoiceNumber: string;
  status: string;
  clientName: string;
  clientAddress: string | null;
  projectDetails: string | null;
  contractRef: string | null;
  paymentTerms: string | null;
  baseTotal: string | number;
  variationTotal: string | number;
  revisedTotal: string | number;
  paidTotal: string | number;
  outstanding: string | number;
  settlementEntity: {
    name: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
  };
  lines: {
    description: string;
    quantity: string | number;
    unit: string;
    unitPrice: string | number;
    totalAmount: string | number;
  }[];
  variations: {
    variationCode: string;
    title: string;
    description: string;
    amount: string | number;
    changeLog?: { changeId: string } | null;
  }[];
  payments: {
    id: string;
    amount: string | number;
    status: string;
    receiptNumber: string | null;
    proofUrl: string | null;
    rejectReason: string | null;
    uploadedBy?: { firstName: string; lastName: string } | null;
  }[];
};

function formatNaira(v: string | number) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
  }, [id, router]);

  function load() {
    api<InvoiceDetail>(`/invoices/${id}`).then(setInvoice).catch(() => router.push('/invoices'));
  }

  const canManage =
    user?.role === 'FINANCE' ||
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  const canVerify =
    user?.role === 'FINANCE' || user?.role === 'CEO' || user?.role === 'ADMIN';

  async function sendInvoice() {
    await api(`/invoices/${id}/send`, { method: 'POST' });
    load();
  }

  async function submitPayment() {
    setUploading(true);
    try {
      await uploadPaymentProof(id, parseFloat(payAmount), proofFile ?? undefined);
      setPayAmount('');
      setProofFile(null);
      load();
    } finally {
      setUploading(false);
    }
  }

  async function verifyPayment(paymentId: string) {
    await api(`/invoices/payments/${paymentId}/verify`, { method: 'POST' });
    load();
  }

  async function rejectPayment(paymentId: string) {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    await api(`/invoices/payments/${paymentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejectReason: reason }),
    });
    load();
  }

  if (!invoice) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/invoices" className="text-sm text-[#e87722]">
        ← Back to invoices
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{invoice.invoiceNumber}</h1>
      <p className="text-slate-600">
        {invoice.clientName} · {invoice.status.replace(/_/g, ' ')}
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
          <h2 className="mb-3 font-semibold text-[#1a2744]">Line items</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="pb-2">Description</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((l, i) => (
                <tr key={i} className="border-t">
                  <td className="py-2">{l.description}</td>
                  <td>{l.quantity}</td>
                  <td>{l.unit}</td>
                  <td>{formatNaira(l.unitPrice)}</td>
                  <td>{formatNaira(l.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {invoice.variations.length > 0 && (
            <>
              <h2 className="mb-2 mt-4 font-semibold text-[#1a2744]">Variations</h2>
              <ul className="space-y-2 text-sm">
                {invoice.variations.map((v, i) => (
                  <li key={i} className="rounded border border-slate-100 p-2">
                    <span className="font-mono text-xs">{v.variationCode}</span> — {v.title}
                    {v.changeLog && (
                      <span className="ml-1 text-slate-500">({v.changeLog.changeId})</span>
                    )}
                    <p className="text-slate-600">{v.description}</p>
                    <p className="font-medium">{formatNaira(v.amount)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-2 border-t pt-4 text-sm">
            <dt className="text-slate-500">Base contract</dt>
            <dd>{formatNaira(invoice.baseTotal)}</dd>
            <dt className="text-slate-500">Variations</dt>
            <dd>{formatNaira(invoice.variationTotal)}</dd>
            <dt className="text-slate-500">Revised total</dt>
            <dd className="font-semibold">{formatNaira(invoice.revisedTotal)}</dd>
            <dt className="text-slate-500">Paid to date</dt>
            <dd>{formatNaira(invoice.paidTotal)}</dd>
            <dt className="text-slate-500">Outstanding</dt>
            <dd className="font-semibold text-[#e87722]">{formatNaira(invoice.outstanding)}</dd>
          </dl>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="mb-2 font-semibold text-[#1a2744]">Settlement</h2>
            <p>{invoice.settlementEntity.name}</p>
            <p>{invoice.settlementEntity.bankName}</p>
            <p>{invoice.settlementEntity.accountName}</p>
            <p className="font-mono">{invoice.settlementEntity.accountNumber}</p>
            {invoice.paymentTerms && (
              <p className="mt-2 text-slate-600">{invoice.paymentTerms}</p>
            )}
          </section>

          {canManage && invoice.status === 'DRAFT' && (
            <button
              type="button"
              onClick={sendInvoice}
              className="w-full rounded-lg bg-[#e87722] py-2 text-sm text-white"
            >
              Send to client
            </button>
          )}

          {invoice.status !== 'DRAFT' && invoice.status !== 'CANCELLED' && (
            <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
              <h2 className="mb-2 font-semibold">Upload payment proof</h2>
              <input
                type="number"
                min={0.01}
                step={0.01}
                placeholder="Amount ₦"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="mb-2 w-full rounded border px-2 py-1"
              />
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                className="mb-2 w-full text-xs"
              />
              <button
                type="button"
                disabled={uploading || !payAmount}
                onClick={submitPayment}
                className="w-full rounded-lg border border-slate-300 py-2 hover:bg-slate-50 disabled:opacity-60"
              >
                {uploading ? 'Uploading…' : 'Submit proof'}
              </button>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <h2 className="mb-2 font-semibold">Payments</h2>
            {!invoice.payments.length ? (
              <p className="text-slate-500">No payments yet.</p>
            ) : (
              <ul className="space-y-2">
                {invoice.payments.map((p) => (
                  <li key={p.id} className="rounded border border-slate-100 p-2">
                    <p className="font-medium">{formatNaira(p.amount)} · {p.status}</p>
                    {p.uploadedBy && (
                      <p className="text-xs text-slate-500">
                        By {p.uploadedBy.firstName} {p.uploadedBy.lastName}
                      </p>
                    )}
                    {p.proofUrl && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}${p.proofUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-[#e87722]"
                      >
                        View proof
                      </a>
                    )}
                    {canVerify && p.status === 'PENDING' && (
                      <div className="mt-1 flex gap-1">
                        <button
                          type="button"
                          onClick={() => verifyPayment(p.id)}
                          className="rounded bg-green-600 px-2 py-0.5 text-xs text-white"
                        >
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => rejectPayment(p.id)}
                          className="rounded bg-red-600 px-2 py-0.5 text-xs text-white"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {p.status === 'VERIFIED' && p.receiptNumber && (
                      <button
                        type="button"
                        onClick={() =>
                          downloadPdf(
                            `/invoices/payments/${p.id}/receipt`,
                            `${p.receiptNumber}.pdf`,
                          )
                        }
                        className="mt-1 text-xs text-[#e87722]"
                      >
                        Download receipt PDF
                      </button>
                    )}
                    {p.rejectReason && (
                      <p className="text-xs text-red-600">{p.rejectReason}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
