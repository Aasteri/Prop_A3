'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { publicApi } from '@/lib/api';

type Listing = {
  id: string;
  listingRef: string;
  location: string;
  propertyType: string;
  finish: string;
  paymentPlan: string;
  displayPrice: string;
};

export default function PropertiesPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    publicApi<Listing[]>(`/public/listings${q}`).then(setListings).catch(console.error);
  }, [search]);

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-3xl font-semibold text-[#1a2744]">Properties for sale</h1>
        <p className="mt-1 text-slate-600">From Triple A&apos;s FOR SALE catalog — Abuja & environs</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by location or type…"
          className="mt-6 w-full max-w-md rounded-lg border border-slate-300 px-4 py-2 text-sm"
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((l) => (
            <Link
              key={l.id}
              href={`/properties/${l.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 hover:border-[#e87722]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded bg-[#1a2744]/10 px-2 py-0.5 text-xs font-medium text-[#1a2744]">
                  {l.finish}
                </span>
                <span className="text-xs text-slate-400">{l.listingRef}</span>
              </div>
              <h2 className="mt-3 font-semibold text-[#1a2744]">{l.propertyType}</h2>
              <p className="text-sm text-slate-600">{l.location}</p>
              <p className="mt-1 text-xs text-slate-500">{l.paymentPlan}</p>
              <p className="mt-3 text-lg font-semibold text-[#e87722]">{l.displayPrice}</p>
            </Link>
          ))}
        </div>
        {!listings.length && (
          <p className="mt-8 text-center text-slate-500">No properties match your search.</p>
        )}
      </div>
    </PublicShell>
  );
}
