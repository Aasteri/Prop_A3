'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { publicApi } from '@/lib/api';

type Company = {
  name: string;
  tagline: string;
  badges: string[];
};

type Listing = {
  id: string;
  listingRef: string;
  location: string;
  propertyType: string;
  finish: string;
  displayPrice: string;
};

export default function HomePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [featured, setFeatured] = useState<Listing[]>([]);

  useEffect(() => {
    publicApi<Company>('/public/company').then(setCompany).catch(console.error);
    publicApi<Listing[]>('/public/listings').then((list) => setFeatured(list.slice(0, 6)));
  }, []);

  return (
    <PublicShell>
      <section className="bg-[#1a2744] px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-widest text-[#e87722]">Triple A Realty Projects</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Premium property development & sales in Abuja
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            {company?.tagline ?? 'Discover finished and shell-finish homes across Guzape, Lifecamp, Asokoro and more.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="rounded-lg bg-[#e87722] px-6 py-3 font-medium hover:bg-[#d06818]"
            >
              Browse properties
            </Link>
            <Link
              href="/projects"
              className="rounded-lg border border-white/30 px-6 py-3 font-medium hover:bg-white/10"
            >
              View our projects
            </Link>
          </div>
          {company && (
            <div className="mt-8 flex flex-wrap gap-2">
              {company.badges.map((b) => (
                <span key={b} className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-[#1a2744]">Featured properties</h2>
          <Link href="/properties" className="text-sm text-[#e87722] hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <Link
              key={l.id}
              href={`/properties/${l.id}`}
              className="rounded-xl border border-slate-200 p-5 hover:border-[#e87722] hover:shadow-sm"
            >
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium">{l.finish}</span>
              <h3 className="mt-2 font-semibold text-[#1a2744]">{l.propertyType}</h3>
              <p className="text-sm text-slate-600">{l.location}</p>
              <p className="mt-2 font-medium text-[#e87722]">{l.displayPrice}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-2xl font-semibold text-[#1a2744]">Already a client?</h2>
          <p className="mt-2 text-slate-600">
            Track construction progress, view invoices, and approved change orders in your portal.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-[#1a2744] px-6 py-3 text-sm font-medium text-white hover:bg-[#253660]"
          >
            Sign in to client portal
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
