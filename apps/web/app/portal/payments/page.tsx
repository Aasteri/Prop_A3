'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { api, getToken } from '@/lib/api';

type Invoice = {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  revisedTotal: number;
  paidTotal: number;
  outstanding: number;
  payments: { receiptNumber: string | null; amount: number; verifiedAt: string | null }[];
};

export default function PortalPaymentsPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Invoice[]>('/client-portal/invoices').then(setInvoices).catch(() => router.replace('/login'));
  }, [router]);

  return (
    <PortalShell>
      <h1 className="text-2xl font-semibold text-[#1a2744]">Payments & invoices</h1>
      <p className="text-slate-600">Your payment schedule and verified receipts</p>

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
                <p className="font-medium text-slate-600">Verified payments</p>
                {inv.payments.map((p, i) => (
                  <p key={i} className="text-slate-700">
                    {p.receiptNumber ?? 'Payment'} — ₦{p.amount.toLocaleString()}
                  </p>
                ))}
              </div>
            )}
            {Number(inv.outstanding) > 0 && (
              <p className="mt-3 text-xs text-slate-500">
                To upload payment proof, contact your project manager or finance team.
              </p>
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
