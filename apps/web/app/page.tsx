'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { ApiError, publicApi, submitInquiry } from '@/lib/api';
import { INPUT_INLINE } from '@/lib/ui';

type Company = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp: string;
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

type Stats = {
  listingCount: number;
  projectCount: number;
  siteCount: number;
};

export default function HomePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryError, setInquiryError] = useState('');
  const [inquiryForm, setInquiryForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    publicApi<Company>('/public/company').then(setCompany).catch(console.error);
    publicApi<Listing[]>('/public/listings').then((list) => setFeatured(list.slice(0, 6)));
    publicApi<Stats>('/public/stats').then(setStats).catch(console.error);
  }, []);

  async function onInquiry(e: FormEvent) {
    e.preventDefault();
    setInquiryError('');
    try {
      await submitInquiry({
        ...inquiryForm,
        email: inquiryForm.email || undefined,
        message: inquiryForm.message || 'Homepage contact form',
      });
      setInquirySent(true);
    } catch (err) {
      setInquiryError(err instanceof ApiError ? err.message : 'Could not send inquiry');
    }
  }

  const wa = company?.whatsapp?.replace(/\D/g, '') ?? '2348000000000';

  return (
    <PublicShell>
      <section className="bg-[#1a2744] px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm uppercase tracking-widest text-[#e87722]">Triple A Realty Projects</p>
          <h1 className="mt-2 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
            Premium property development & sales in Abuja
          </h1>
          <p className="mt-4 max-w-xl text-lg text-slate-300">
            {company?.tagline ??
              'Discover finished and shell-finish homes across Guzape, Jikwoyi, Mpape and more.'}
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
            <Link
              href="/estates"
              className="rounded-lg border border-white/30 px-6 py-3 font-medium hover:bg-white/10"
            >
              Site map
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

      {stats && (
        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-slate-200 px-4 py-8 text-center">
            <div>
              <p className="text-3xl font-bold text-[#1a2744]">{stats.siteCount}</p>
              <p className="text-sm text-slate-600">Active sites</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#1a2744]">{stats.projectCount}</p>
              <p className="text-sm text-slate-600">Live projects</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[#e87722]">{stats.listingCount}</p>
              <p className="text-sm text-slate-600">Properties for sale</p>
            </div>
          </div>
        </section>
      )}

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
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#1a2744]">Request a consultation</h2>
            <p className="mt-2 text-slate-600">
              Tell us what you&apos;re looking for — our sales team responds within 24 hours.
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <a
                href={`https://wa.me/${wa}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700"
              >
                WhatsApp
              </a>
              <a
                href={`tel:${company?.phone?.replace(/\s/g, '') ?? '+2348000000000'}`}
                className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-white"
              >
                Call us
              </a>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            {inquirySent ? (
              <p className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
                Thank you! Your inquiry has been received. We&apos;ll be in touch shortly.
              </p>
            ) : (
              <form onSubmit={onInquiry} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    placeholder="First name"
                    value={inquiryForm.firstName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, firstName: e.target.value })}
                    className={INPUT_INLINE}
                  />
                  <input
                    required
                    placeholder="Last name"
                    value={inquiryForm.lastName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, lastName: e.target.value })}
                    className={INPUT_INLINE}
                  />
                </div>
                <input
                  required
                  placeholder="Phone"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                <textarea
                  placeholder="What are you interested in?"
                  rows={3}
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                {inquiryError && <p className="text-sm text-red-600">{inquiryError}</p>}
                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#e87722] py-2.5 text-sm font-medium text-white hover:bg-[#d06818]"
                >
                  Submit inquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 px-4 py-12">
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
