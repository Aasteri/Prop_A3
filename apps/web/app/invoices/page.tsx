'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';

type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  status: string;
  issueDate: string;
  revisedTotal: string | number;
  outstanding: string | number;
  invoiceType: string;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SENT: 'bg-blue-100 text-blue-800',
  PARTIALLY_PAID: 'bg-amber-100 text-amber-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function formatNaira(v: string | number) {
  return `₦${Number(v).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Invoice[]>('/invoices')
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <AppShell>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#1a2744]">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          + New invoice
        </Link>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : !invoices.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-slate-600">No invoices yet.</p>
          <Link href="/invoices/new" className="mt-2 inline-block text-[#e87722]">
            Create the first invoice →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2">Invoice No</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Total</th>
                <th className="px-3 py-2">Outstanding</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-3 py-2">{inv.clientName}</td>
                  <td className="px-3 py-2">
                    {new Date(inv.issueDate).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">{formatNaira(inv.revisedTotal)}</td>
                  <td className="px-3 py-2 font-medium">{formatNaira(inv.outstanding)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[inv.status] ?? ''}`}
                    >
                      {inv.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
