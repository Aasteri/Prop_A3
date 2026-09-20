'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';

type Application = {
  id: string;
  applicationRef: string;
  status: string;
  surname: string;
  otherNames: string;
  rentAccepted: string | number;
  agencyFeeAmount: string | number;
  estate: { code: string; name: string };
  terrierRow: { serialNo: number; propertyType: string } | null;
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_REVIEW: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const APP_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const;

export default function TenantApplicationsPage() {
  const router = useRouter();
  const [apps, setApps] = useState<Application[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Application[]>('/tenant-applications').then(setApps).catch(console.error);
  }, [router]);

  const statusFilter: FilterDef = useMemo(
    () => ({
      key: 'status',
      label: 'Status',
      options: APP_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') })),
      getValue: (item) => (item as Application).status,
    }),
    [],
  );

  const {
    query,
    setQuery,
    filterValues,
    setFilter,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
  } = useFilteredList<Application>({
    items: apps,
    searchKeys: [
      'applicationRef',
      'surname',
      'otherNames',
      'status',
      'estate.code',
      'estate.name',
      (a) => (a.terrierRow ? String(a.terrierRow.serialNo) : ''),
      (a) => a.terrierRow?.propertyType ?? '',
    ],
    filters: [statusFilter],
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Tenant applications</h1>
          <p className="text-sm text-slate-600">23-field form · 20% agency fee · PM review</p>
        </div>
        <Link
          href="/tenant-applications/new"
          className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          New application
        </Link>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search applications…"
        filters={[statusFilter]}
        filterValues={filterValues}
        onFilterChange={setFilter}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Estate / Unit</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Agency fee</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/tenant-applications/${a.id}`} className="font-medium text-[#e87722] hover:underline">
                    {a.applicationRef}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {a.surname} {a.otherNames}
                </td>
                <td className="px-4 py-3">
                  {a.estate.code}
                  {a.terrierRow ? ` · Unit ${a.terrierRow.serialNo} (${a.terrierRow.propertyType})` : ''}
                </td>
                <td className="px-4 py-3">₦{Number(a.rentAccepted).toLocaleString()}</td>
                <td className="px-4 py-3">₦{Number(a.agencyFeeAmount).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_COLORS[a.status] ?? 'bg-slate-100'}`}>
                    {a.status.replace(/_/g, ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {!filteredCount && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {apps.length === 0 ? 'No applications yet.' : 'No matching applications.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PaginationBar
        page={page}
        pageCount={pageCount}
        pageSize={20}
        filteredCount={filteredCount}
        onPageChange={setPage}
      />
    </AppShell>
  );
}
