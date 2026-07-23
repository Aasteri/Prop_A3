'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { ApiError, publicApi, submitInquiry } from '@/lib/api';

type Listing = {
  id: string;
  listingRef: string;
  location: string;
  propertyType: string;
  finish: string;
  paymentPlan: string;
  displayPrice: string;
  priceOutrightNgn: number | null;
  price6mNgn: number | null;
  price12mNgn: number | null;
  price18mNgn: number | null;
};

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', message: '' });

  useEffect(() => {
    publicApi<Listing>(`/public/listings/${id}`).then(setListing).catch(console.error);
  }, [id]);

  async function onInquiry(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await submitInquiry({
        ...form,
        listingId: id,
        email: form.email || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Inquiry failed');
    }
  }

  if (!listing) {
    return (
      <PublicShell>
        <p className="px-4 py-12 text-center text-slate-500">Loading…</p>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Link href="/properties" className="text-sm text-[#e87722] hover:underline">
          ← All properties
        </Link>

        <div className="mt-4 grid gap-8 lg:grid-cols-2">
          <div>
            <span className="rounded bg-slate-100 px-2 py-1 text-sm">{listing.finish}</span>
            <h1 className="mt-2 text-3xl font-semibold text-[#1a2744]">{listing.propertyType}</h1>
            <p className="text-lg text-slate-600">{listing.location}</p>
            <p className="mt-4 text-2xl font-bold text-[#e87722]">{listing.displayPrice}</p>
            <p className="mt-2 text-sm text-slate-500">Payment plan: {listing.paymentPlan}</p>

            <div className="mt-6 space-y-2 text-sm">
              {listing.priceOutrightNgn != null && (
                <p>Outright: ₦{listing.priceOutrightNgn.toLocaleString()}</p>
              )}
              {listing.price6mNgn != null && (
                <p>6 months: ₦{listing.price6mNgn.toLocaleString()}</p>
              )}
              {listing.price12mNgn != null && (
                <p>12 months: ₦{listing.price12mNgn.toLocaleString()}</p>
              )}
              {listing.price18mNgn != null && (
                <p>18 months: ₦{listing.price18mNgn.toLocaleString()}</p>
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
              <a href="tel:+2348000000000" className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50">
                Call now
              </a>
            </div>
          </div>

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
                  <input required placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                  <input required placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="rounded-lg border px-3 py-2 text-sm" />
                </div>
                <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                <textarea placeholder="Message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button type="submit" className="w-full rounded-lg bg-[#e87722] py-2.5 text-sm font-medium text-white hover:bg-[#d06818]">
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
