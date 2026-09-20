'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { api, getToken } from '@/lib/api';
import { useFilteredList, type FilterDef } from '@/lib/use-filtered-list';

type Listing = {
  id: string;
  listingRef: string;
  location: string;
  propertyType: string;
  finish: string;
  paymentPlan: string;
  status: string;
  priceNgn: string | number | null;
  priceOutrightNgn: string | number | null;
  price12mNgn: string | number | null;
};

const LISTING_STATUSES = ['AVAILABLE', 'RESERVED', 'SOLD', 'ARCHIVED'] as const;

function displayPrice(l: Listing): string {
  const outright = l.priceOutrightNgn ?? l.priceNgn;
  if (outright != null) return `₦${Number(outright).toLocaleString()}`;
  if (l.price12mNgn != null) return `₦${Number(l.price12mNgn).toLocaleString()} (12M)`;
  return l.paymentPlan === 'TBD' ? 'Price on request' : 'TBC';
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Listing[]>('/listings').then(setListings).catch(console.error);
  }, [router]);

  const statusFilter: FilterDef = useMemo(
    () => ({
      key: 'status',
      label: 'Status',
      options: LISTING_STATUSES.map((s) => ({ value: s, label: s })),
      getValue: (item) => (item as Listing).status,
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
  } = useFilteredList<Listing>({
    items: listings,
    searchKeys: ['listingRef', 'location', 'propertyType', 'finish', 'status', 'paymentPlan'],
    filters: [statusFilter],
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">Sales listings</h1>
          <p className="text-sm text-slate-600">FOR SALE catalog — {listings.length} properties</p>
        </div>
        <Link
          href="/listings/new"
          className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          Add listing
        </Link>
      </div>

      <ListToolbar
        query={query}
        onQueryChange={setQuery}
        searchPlaceholder="Search location or type…"
        filters={[statusFilter]}
        filterValues={filterValues}
        onFilterChange={setFilter}
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Finish</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((l) => (
              <tr key={l.id} className="border-b hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/listings/${l.id}`} className="font-medium text-[#e87722] hover:underline">
                    {l.listingRef}
                  </Link>
                </td>
                <td className="px-4 py-3">{l.location}</td>
                <td className="px-4 py-3">{l.propertyType}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{l.finish}</span>
                </td>
                <td className="px-4 py-3">{displayPrice(l)}</td>
                <td className="px-4 py-3">{l.status}</td>
              </tr>
            ))}
            {!filteredCount && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  {listings.length === 0 ? 'No listings yet.' : 'No matching listings.'}
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
