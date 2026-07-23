'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';

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

function displayPrice(l: Listing): string {
  const outright = l.priceOutrightNgn ?? l.priceNgn;
  if (outright != null) return `₦${Number(outright).toLocaleString()}`;
  if (l.price12mNgn != null) return `₦${Number(l.price12mNgn).toLocaleString()} (12M)`;
  return l.paymentPlan === 'TBD' ? 'Price on request' : 'TBC';
}

export default function ListingsPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (status) q.set('status', status);
    api<Listing[]>(`/listings?${q}`).then(setListings).catch(console.error);
  }, [router, search, status]);

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

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search location or type…"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="AVAILABLE">Available</option>
          <option value="RESERVED">Reserved</option>
          <option value="SOLD">Sold</option>
        </select>
      </div>

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
            {listings.map((l) => (
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
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
