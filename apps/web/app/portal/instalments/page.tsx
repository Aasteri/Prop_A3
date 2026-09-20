'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PortalShell } from '@/components/PortalShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';

type Line = {
  monthIndex: number;
  pctDue: number;
  amountDue: number;
  amountCollected: number;
  status: string;
  dueDate: string | null;
};
type Plan = {
  id: string;
  number: string;
  unitPlotNo: string;
  contractPrice: number;
  totalCollected: number;
  balanceOutstanding: number;
  status: string;
  lines: Line[];
  project: { name: string } | null;
};

export default function PortalInstalmentsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Plan[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Plan[]>('/client-portal/instalments').then(setRows).catch(console.error);
  }, [router]);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<Plan>({
    items: rows,
    searchKeys: ['number', 'unitPlotNo', 'status', 'project.name'],
  });

  return (
    <PortalShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">My instalment schedule</h1>
          <p className="mt-1 text-sm text-slate-600">
            Six-month purchaser plan and balance outstanding (US-MON-10).
          </p>
        </div>
        <Link href="/portal" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Portal home
        </Link>
        {rows.length > 0 && (
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search plans…"
          />
        )}

        <div className="space-y-4">
          {pageItems.map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div>
                <p className="text-xs font-semibold text-[#e87722]">
                  {r.number} · {r.status}
                </p>
                <h2 className="mt-1 font-semibold text-[#1a2744]">
                  {r.unitPlotNo}
                  {r.project ? ` · ${r.project.name}` : ''}
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Contract NGN {r.contractPrice.toLocaleString()} · Paid NGN{' '}
                  {r.totalCollected.toLocaleString()} · Balance NGN{' '}
                  {r.balanceOutstanding.toLocaleString()}
                </p>
              </div>
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-slate-500">
                  <tr>
                    <th className="py-1">Month</th>
                    <th className="py-1">Due</th>
                    <th className="py-1">Paid</th>
                    <th className="py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {r.lines.map((l) => (
                    <tr key={l.monthIndex} className="border-t border-slate-100">
                      <td className="py-2">
                        M{l.monthIndex} ({l.pctDue}%)
                        {l.dueDate ? (
                          <span className="block text-xs text-slate-400">
                            due {l.dueDate.slice(0, 10)}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-2">NGN {l.amountDue.toLocaleString()}</td>
                      <td className="py-2">NGN {l.amountCollected.toLocaleString()}</td>
                      <td className="py-2">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {!rows.length && (
            <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No instalment schedule linked to your account yet.
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <PaginationBar
            page={page}
            pageCount={pageCount}
            pageSize={pageSize}
            filteredCount={filteredCount}
            onPageChange={setPage}
          />
        )}
      </div>
    </PortalShell>
  );
}
