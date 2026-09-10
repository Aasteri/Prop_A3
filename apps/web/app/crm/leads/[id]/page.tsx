'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken, getUser, type AuthUser } from '@/lib/api';
import { INPUT, LABEL } from '@/lib/ui';

type LeadDetail = {
  id: string;
  leadRef: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  source: string;
  stage: string;
  preferences: string | null;
  notes: string | null;
  lostReason: string | null;
  nextStages: string[];
  inspectionCompleted?: boolean;
  hasAcceptedSalesOffer?: boolean;
  listing: { id: string; listingRef: string; location: string; propertyType: string } | null;
  client: { id: string; clientRef: string; firstName: string; lastName: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
};

type SalesOffer = {
  id: string;
  number: string;
  offerPrice: string | number;
  depositRequired: string | number | null;
  validityUntil: string | null;
  conditions: string | null;
  paymentTerms: string | null;
  preparedBy: string | null;
  buyerResponse: string;
  counterPrice: string | number | null;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [offers, setOffers] = useState<SalesOffer[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerForm, setOfferForm] = useState({
    offerPrice: '',
    depositRequired: '',
    validityUntil: '',
    conditions: '',
    paymentTerms: '',
  });

  async function load() {
    const data = await api<LeadDetail>(`/crm/leads/${id}`);
    setLead(data);
  }

  async function loadOffers() {
    const rows = await api<SalesOffer[]>(`/sales-offers?leadId=${id}`);
    setOffers(rows);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/crm'));
    loadOffers().catch(() => setOffers([]));
  }, [id, router]);

  const canManage = user?.role === 'SALES' || user?.role === 'CEO' || user?.role === 'ADMIN';

  async function advanceStage(stage: string) {
    setError('');
    setBusy(stage);
    try {
      let body: Record<string, string> = { stage };
      if (stage === 'LOST') {
        const reason = prompt('Lost reason:');
        if (!reason?.trim()) {
          setBusy('');
          return;
        }
        body = { stage, lostReason: reason };
      }
      await api<LeadDetail>(`/crm/leads/${id}/stage`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Stage update failed');
    } finally {
      setBusy('');
    }
  }

  async function convert() {
    setError('');
    setBusy('convert');
    try {
      await api(`/crm/leads/${id}/convert`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Convert failed');
    } finally {
      setBusy('');
    }
  }

  async function issueOffer(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy('offer');
    try {
      await api('/sales-offers', {
        method: 'POST',
        body: JSON.stringify({
          leadId: id,
          listingId: lead?.listing?.id,
          offerPrice: Number(offerForm.offerPrice),
          depositRequired: offerForm.depositRequired
            ? Number(offerForm.depositRequired)
            : undefined,
          validityUntil: offerForm.validityUntil || undefined,
          conditions: offerForm.conditions || undefined,
          paymentTerms: offerForm.paymentTerms || undefined,
        }),
      });
      setShowOfferForm(false);
      setOfferForm({
        offerPrice: '',
        depositRequired: '',
        validityUntil: '',
        conditions: '',
        paymentTerms: '',
      });
      await loadOffers();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Offer failed');
    } finally {
      setBusy('');
    }
  }

  async function respond(offerId: string, buyerResponse: string) {
    setBusy(offerId);
    setError('');
    try {
      let counterPrice: number | undefined;
      if (buyerResponse === 'COUNTERED') {
        const raw = prompt('Counter price (₦)');
        if (!raw) {
          setBusy('');
          return;
        }
        counterPrice = Number(raw);
      }
      await api(`/sales-offers/${offerId}/respond`, {
        method: 'PATCH',
        body: JSON.stringify({ buyerResponse, counterPrice }),
      });
      await loadOffers();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Response failed');
    } finally {
      setBusy('');
    }
  }

  if (!lead) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const isClosed = lead.stage === 'WON' || lead.stage === 'LOST';

  return (
    <AppShell>
      <Link href="/crm" className="text-sm text-[#e87722] hover:underline">
        ← Pipeline
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">
            {lead.firstName} {lead.lastName}
          </h1>
          <p className="text-slate-600">
            {lead.leadRef} · {lead.source.replace(/_/g, ' ')}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{lead.stage.replace(/_/g, ' ')}</span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      {lead.client && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Converted to client <strong>{lead.client.clientRef}</strong>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm">
        <p className="font-medium text-[#1a2744]">Viewing / inspection gate</p>
        <p className="mt-1 text-slate-600">
          {lead.inspectionCompleted
            ? 'Completed inspection response logged — negotiation unlocked.'
            : 'Physical inspection response required before Negotiation, Reserved, or convert.'}
        </p>
        <Link href="/viewings" className="mt-2 inline-block text-[#e87722] hover:underline">
          Open viewings →
        </Link>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-[#1a2744]">Sales offer / quotation (SOF)</h2>
            <p className="text-xs text-slate-500">
              Accepted offer required before Reserved
              {lead.hasAcceptedSalesOffer ? ' — accepted offer on file.' : '.'}
            </p>
          </div>
          {canManage && !isClosed && (
            <button
              type="button"
              onClick={() => setShowOfferForm((v) => !v)}
              className="rounded-md bg-[#e87722] px-3 py-1.5 text-sm text-white"
            >
              {showOfferForm ? 'Cancel' : 'Issue SOF'}
            </button>
          )}
        </div>

        {showOfferForm && (
          <form onSubmit={issueOffer} className="grid gap-3 sm:grid-cols-2 border-t border-slate-100 pt-3">
            <div>
              <label className={LABEL}>Offer price (₦)</label>
              <input
                type="number"
                min={0}
                required
                className={INPUT}
                value={offerForm.offerPrice}
                onChange={(e) => setOfferForm({ ...offerForm, offerPrice: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Deposit required (₦)</label>
              <input
                type="number"
                min={0}
                className={INPUT}
                value={offerForm.depositRequired}
                onChange={(e) => setOfferForm({ ...offerForm, depositRequired: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Valid until</label>
              <input
                type="date"
                className={INPUT}
                value={offerForm.validityUntil}
                onChange={(e) => setOfferForm({ ...offerForm, validityUntil: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Payment terms</label>
              <input
                className={INPUT}
                value={offerForm.paymentTerms}
                onChange={(e) => setOfferForm({ ...offerForm, paymentTerms: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Conditions</label>
              <textarea
                className={INPUT}
                rows={2}
                value={offerForm.conditions}
                onChange={(e) => setOfferForm({ ...offerForm, conditions: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={busy === 'offer'}
                className="rounded-md bg-[#1a2744] px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Create SOF
              </button>
            </div>
          </form>
        )}

        {offers.map((o) => (
          <div key={o.id} className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-medium text-[#1a2744]">
                {o.number} · {o.buyerResponse}
              </span>
              {canManage && o.buyerResponse === 'PENDING' && (
                <span className="space-x-2">
                  <button
                    type="button"
                    disabled={!!busy}
                    className="text-green-700 hover:underline"
                    onClick={() => respond(o.id, 'ACCEPTED')}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    className="text-amber-700 hover:underline"
                    onClick={() => respond(o.id, 'COUNTERED')}
                  >
                    Counter
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    className="text-red-700 hover:underline"
                    onClick={() => respond(o.id, 'REJECTED')}
                  >
                    Reject
                  </button>
                </span>
              )}
            </div>
            <p>
              Price ₦{Number(o.offerPrice).toLocaleString()}
              {o.depositRequired != null
                ? ` · Deposit ₦${Number(o.depositRequired).toLocaleString()}`
                : ''}
              {o.counterPrice != null
                ? ` · Counter ₦${Number(o.counterPrice).toLocaleString()}`
                : ''}
            </p>
            {o.validityUntil && (
              <p className="text-xs text-slate-500">Valid until {o.validityUntil.slice(0, 10)}</p>
            )}
            {o.conditions && <p className="mt-1 text-xs text-slate-600">{o.conditions}</p>}
          </div>
        ))}
        {!offers.length && <p className="text-sm text-slate-500">No sales offers yet.</p>}
      </div>

      {canManage && !isClosed && (
        <div className="mt-4 flex flex-wrap gap-2">
          {lead.nextStages.map((stage) => (
            <button
              key={stage}
              type="button"
              disabled={!!busy}
              onClick={() => advanceStage(stage)}
              className={`rounded-md px-4 py-2 text-sm ${
                stage === 'LOST'
                  ? 'border border-red-300 text-red-700 hover:bg-red-50'
                  : 'bg-[#1a2744] text-white hover:bg-[#253660]'
              } disabled:opacity-50`}
            >
              {busy === stage ? '…' : stage === 'LOST' ? 'Mark lost' : `Move to ${stage.toLowerCase()}`}
            </button>
          ))}
          <button
            type="button"
            disabled={!!busy}
            onClick={convert}
            className="rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
          >
            {busy === 'convert' ? 'Converting…' : 'Convert to client'}
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoCard title="Contact">
          <Row label="Phone" value={lead.phone} />
          <Row label="Email" value={lead.email ?? '—'} />
          <Row
            label="Assigned to"
            value={
              lead.assignedTo
                ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                : '—'
            }
          />
        </InfoCard>
        <InfoCard title="Interest">
          {lead.listing ? (
            <>
              <Row label="Listing" value={lead.listing.listingRef} />
              <Row
                label="Property"
                value={`${lead.listing.location} — ${lead.listing.propertyType}`}
              />
              <Link
                href={`/listings/${lead.listing.id}`}
                className="text-sm text-[#e87722] hover:underline"
              >
                View listing
              </Link>
            </>
          ) : (
            <p className="text-sm text-slate-500">No listing linked</p>
          )}
        </InfoCard>
        {(lead.preferences || lead.notes) && (
          <InfoCard title="Notes" className="md:col-span-2">
            <Row label="Preferences" value={lead.preferences ?? '—'} />
            <Row label="Internal notes" value={lead.notes ?? '—'} />
          </InfoCard>
        )}
        {lead.lostReason && (
          <InfoCard title="Lost">
            <Row label="Reason" value={lead.lostReason} />
          </InfoCard>
        )}
      </div>
    </AppShell>
  );
}

function InfoCard({
  title,
  children,
  className = '',
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${className}`}>
      <h2 className="mb-3 font-semibold text-[#1a2744]">{title}</h2>
      <div className="space-y-2 text-sm">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-slate-500">{label}</p>
      <p>{value}</p>
    </div>
  );
}
