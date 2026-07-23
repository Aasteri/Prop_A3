'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken, uploadPaymentProof } from '@/lib/api';

type Payment = {
  id: string;
  amount: number;
  status: string;
  receiptNumber: string | null;
  verifiedAt: string | null;
  createdAt: string;
};

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  revisedTotal: number;
  paidTotal: number;
  outstanding: number;
  payments: Payment[];
};

export default function PortalPaymentsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = () => {
    api<Invoice[]>('/client-portal/invoices').then(setInvoices).catch(() => router.replace('/login'));
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
  }, [router]);

  const handleUpload = async (invoice: Invoice) => {
    const amount = parseFloat(amounts[invoice.id] ?? '');
    const file = files[invoice.id];
    if (!amount || amount <= 0) {
      setMessage('Enter a valid payment amount.');
      return;
    }
    if (!file) {
      setMessage('Select a payment proof image or PDF.');
      return;
    }
    setUploading(invoice.id);
    setMessage(null);
    try {
      await uploadPaymentProof(invoice.id, amount, file);
      setMessage('Payment proof submitted — finance will verify shortly.');
      setAmounts((a) => ({ ...a, [invoice.id]: '' }));
      setFiles((f) => ({ ...f, [invoice.id]: null }));
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(null);
    }
  };

  return (
    <PortalShell>
      <h1 className="text-2xl font-semibold text-[#1a2744]">Payments & invoices</h1>
      <p className="text-slate-600">Upload bank transfer proof for outstanding invoices</p>

      {message && (
        <p className="mt-4 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{message}</p>
      )}

      <div className="mt-6 space-y-4">
        {invoices.map((inv) => (
          <div key={inv.id} className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-semibold">{inv.invoiceNumber}</p>
                <p className="text-sm text-slate-500">{new Date(inv.issueDate).toLocaleDateString()}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{inv.status}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
              <div>
                <p className="text-slate-500">Total</p>
                <p className="font-medium">₦{inv.revisedTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Paid</p>
                <p className="font-medium text-green-700">₦{inv.paidTotal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-slate-500">Outstanding</p>
                <p className="font-medium text-[#e87722]">₦{inv.outstanding.toLocaleString()}</p>
              </div>
            </div>

            {inv.payments.length > 0 && (
              <div className="mt-3 border-t pt-3 text-sm">
                <p className="font-medium text-slate-600">Payment history</p>
                {inv.payments.map((p) => (
                  <p key={p.id} className="text-slate-700">
                    {p.status === 'VERIFIED' ? (p.receiptNumber ?? 'Receipt') : 'Pending'} — ₦
                    {p.amount.toLocaleString()}
                    {p.status === 'PENDING' && (
                      <span className="ml-2 text-xs text-amber-700">awaiting verification</span>
                    )}
                  </p>
                ))}
              </div>
            )}

            {Number(inv.outstanding) > 0 && (
              <div className="mt-4 space-y-2 border-t pt-4">
                <p className="text-sm font-medium text-slate-700">Upload payment proof</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    placeholder="Amount (₦)"
                    className="rounded border border-slate-300 px-3 py-2 text-sm"
                    value={amounts[inv.id] ?? ''}
                    onChange={(e) => setAmounts((a) => ({ ...a, [inv.id]: e.target.value }))}
                  />
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="text-sm"
                    onChange={(e) =>
                      setFiles((f) => ({ ...f, [inv.id]: e.target.files?.[0] ?? null }))
                    }
                  />
                  <button
                    type="button"
                    disabled={uploading === inv.id}
                    onClick={() => handleUpload(inv)}
                    className="rounded bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d66a1a] disabled:opacity-50"
                  >
                    {uploading === inv.id ? 'Uploading…' : 'Submit proof'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {!invoices.length && <p className="text-sm text-slate-500">No invoices on your account yet.</p>}
      </div>

      <Link href="/portal" className="mt-6 inline-block text-sm text-[#e87722] hover:underline">
        ← Back to dashboard
      </Link>
    </PortalShell>
  );
}
