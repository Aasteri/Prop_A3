'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken, getUser, type AuthUser } from '@/lib/api';

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
  price6mNgn: string | number | null;
  price12mNgn: string | number | null;
  price18mNgn: string | number | null;
  notes: string | null;
};

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<Listing>(`/listings/${id}`).then(setListing).catch(() => router.push('/listings'));
  }, [id, router]);

  const canEdit = user?.role === 'SALES' || user?.role === 'CEO' || user?.role === 'ADMIN';

  async function save() {
    if (!listing) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api<Listing>(`/listings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          location: listing.location,
          propertyType: listing.propertyType,
          finish: listing.finish,
          paymentPlan: listing.paymentPlan,
          status: listing.status,
          priceNgn: listing.priceNgn != null ? Number(listing.priceNgn) : undefined,
          priceOutrightNgn: listing.priceOutrightNgn != null ? Number(listing.priceOutrightNgn) : undefined,
          price6mNgn: listing.price6mNgn != null ? Number(listing.price6mNgn) : undefined,
          price12mNgn: listing.price12mNgn != null ? Number(listing.price12mNgn) : undefined,
          price18mNgn: listing.price18mNgn != null ? Number(listing.price18mNgn) : undefined,
          notes: listing.notes ?? undefined,
        }),
      });
      setListing(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  if (!listing) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/listings" className="text-sm text-[#e87722] hover:underline">
        ← Listings
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{listing.listingRef}</h1>
      <p className="text-slate-600">{listing.location}</p>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="mt-4 flex gap-3">
        <Link
          href={`/crm/leads/new?listingId=${listing.id}`}
          className="rounded-md bg-[#e87722] px-4 py-2 text-sm text-white hover:bg-[#d06818]"
        >
          Create lead for this listing
        </Link>
      </div>

      {canEdit ? (
        <div className="mt-6 max-w-2xl space-y-4 rounded-xl border bg-white p-6">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Property type</span>
            <input className={INPUT} value={listing.propertyType} onChange={(e) => setListing({ ...listing, propertyType: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select className={INPUT} value={listing.status} onChange={(e) => setListing({ ...listing, status: e.target.value })}>
              <option value="AVAILABLE">Available</option>
              <option value="RESERVED">Reserved</option>
              <option value="SOLD">Sold</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Outright price (₦)</span>
            <input
              type="number"
              className={INPUT}
              value={listing.priceOutrightNgn ?? listing.priceNgn ?? ''}
              onChange={(e) => setListing({ ...listing, priceOutrightNgn: e.target.value })}
            />
          </label>
          <button type="button" disabled={busy} onClick={save} className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border bg-white p-4 text-sm">
          <p>
            <strong>Type:</strong> {listing.propertyType}
          </p>
          <p>
            <strong>Finish:</strong> {listing.finish} · <strong>Plan:</strong> {listing.paymentPlan}
          </p>
          <p>
            <strong>Status:</strong> {listing.status}
          </p>
        </div>
      )}
    </AppShell>
  );
}
