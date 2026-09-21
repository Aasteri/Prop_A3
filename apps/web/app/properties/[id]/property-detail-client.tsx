'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { PublicShell } from '@/components/PublicShell';
import { ApiError, submitInquiry } from '@/lib/api';
import type { PublicListing } from '@/lib/public-server';
import { INPUT_INLINE } from '@/lib/ui';

export function PropertyDetailClient({ listing }: { listing: PublicListing }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    message: '',
  });

  async function onInquiry(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await submitInquiry({
        ...form,
        listingId: listing.id,
        email: form.email || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inquiry failed');
    }
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/properties" className="text-sm text-[#e87722] hover:underline">
          ← All properties
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <article>
            <span className="rounded bg-slate-100 px-2 py-1 text-sm">{listing.finish}</span>
            <h1 className="mt-2 text-3xl font-semibold text-[#1a2744]">
              {listing.propertyType} in {listing.location}
            </h1>
            <p className="text-lg text-slate-600">{listing.location}</p>
            <p className="mt-1 text-xs text-slate-400">{listing.listingRef}</p>
            <p className="mt-4 text-2xl font-bold text-[#e87722]">{listing.displayPrice}</p>
            <p className="mt-2 text-sm text-slate-500">Payment plan: {listing.paymentPlan}</p>

            <div className="mt-6 space-y-2 text-sm">
              {listing.priceOutrightNgn != null && (
                <p>Outright: ₦{Number(listing.priceOutrightNgn).toLocaleString()}</p>
              )}
              {listing.price6mNgn != null && (
                <p>6 months: ₦{Number(listing.price6mNgn).toLocaleString()}</p>
              )}
              {listing.price12mNgn != null && (
                <p>12 months: ₦{Number(listing.price12mNgn).toLocaleString()}</p>
              )}
              {listing.price18mNgn != null && (
                <p>18 months: ₦{Number(listing.price18mNgn).toLocaleString()}</p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <a
                href="https://wa.me/2348000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                WhatsApp us
              </a>
              <a
                href="tel:+2348000000000"
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Call now
              </a>
            </div>
          </article>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-[#1a2744]">Request consultation</h2>
            <p className="mt-1 text-sm text-slate-600">We&apos;ll respond within 24 hours.</p>

            {sent ? (
              <p className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
                Thank you! Your inquiry has been received. Our sales team will contact you shortly.
              </p>
            ) : (
              <form onSubmit={onInquiry} className="mt-4 space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    placeholder="First name"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className={INPUT_INLINE}
                  />
                  <input
                    required
                    placeholder="Last name"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className={INPUT_INLINE}
                  />
                </div>
                <input
                  required
                  placeholder="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                <input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                <textarea
                  placeholder="Message"
                  rows={3}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`w-full ${INPUT_INLINE}`}
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
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
      </div>
    </PublicShell>
  );
}
