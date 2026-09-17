'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, downloadPdf, getToken, getUser, type AuthUser } from '@/lib/api';
import { INPUT, LABEL } from '@/lib/ui';

type Evaluation = {
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  average: string | number;
  starRating?: string | number;
  decision: string;
  overrideUsed: boolean;
  overrideReason: string | null;
  notesInternal: string | null;
};

type ApplicationDetail = {
  id: string;
  applicationRef: string;
  status: string;
  surname: string;
  otherNames: string;
  nationality: string;
  stateOfOrigin: string;
  maritalStatus: string;
  phone: string;
  formerAddress: string;
  vacateReason: string;
  permanentAddress: string;
  occupation: string;
  officeAddress: string;
  propertyTypeAccepted: string;
  rentAccepted: string | number;
  rentPayer: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinAddress: string;
  nextOfKinRelationship: string;
  guarantorName: string;
  guarantorWorkAddress: string;
  guarantorPhone: string;
  guarantorSignature: string | null;
  applicantSignature: string | null;
  inspectionDate: string | null;
  agencyFeeAmount: string | number;
  agencyFeePct?: string | number;
  rejectReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  estate: { id: string; code: string; name: string };
  terrierRow: { id: string; serialNo: number; propertyType: string; location: string } | null;
  property?: { id: string; name: string; code: string | null } | null;
  agencyFeeInvoice: { id: string; invoiceNumber: string; status: string; outstanding: string | number } | null;
  tenantProfile: { id: string; surname: string; otherNames: string } | null;
  evaluation: Evaluation | null;
  reviewedBy: { firstName: string; lastName: string } | null;
};

type TenancyOffer = {
  id: string;
  number: string;
  status: string;
  rentAnnual: string | number;
  cautionAmount: string | number;
  agencyFeePct: string | number;
  legalFeePct: string | number;
  managementFeePct: string | number;
  agencyFeeAmount: string | number;
  legalFeeAmount: string | number;
  managementFeeAmount: string | number;
  serviceChargeAnnual: string | number;
  estateServiceCharge: string | number;
  landlordPayee: string | null;
  managementPayee: string | null;
  agencyPayee: string | null;
  landlordSettlement?: SettlementEntity | null;
  managementSettlement?: SettlementEntity | null;
  agencySettlement?: SettlementEntity | null;
  landlordInvoice?: { id: string; invoiceNumber: string; outstanding: string | number } | null;
  managementInvoice?: { id: string; invoiceNumber: string; outstanding: string | number } | null;
  agencyInvoice?: { id: string; invoiceNumber: string; outstanding: string | number } | null;
};

type SettlementEntity = {
  id: string;
  name: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
};

const CRITERIA = [
  {
    key: 'c1' as const,
    label: 'Compatibility of tenant/use with property',
    help: 'Family size vs property size, intended use, suitability, pressure on facilities. Example: ~10 people for a 2-bed → low score.',
  },
  {
    key: 'c2' as const,
    label: 'Ability to pay',
    help: 'Income, employment/business, and expenses vs rent. May use market knowledge; company may investigate.',
  },
  {
    key: 'c3' as const,
    label: 'Reason for vacating previous property',
    help: 'Based on information obtained about why they left their last residence.',
  },
  {
    key: 'c4' as const,
    label: 'Guarantor',
    help: 'Guarantor’s ability to attest character, reliability, care of property, and meeting obligations.',
  },
];

function starPreview(avg: number) {
  const stars = Math.min(5, Math.max(1, Math.round(avg / 2) || 1));
  const rating = Math.min(5, Math.max(0.5, Math.round((avg / 2) * 10) / 10));
  return { stars, rating, label: `${stars}_STARS`, display: '★'.repeat(stars) + '☆'.repeat(5 - stars) };
}

export default function TenantApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState({ c1: 7, c2: 7, c3: 7, c4: 7 });
  const [notesInternal, setNotesInternal] = useState('');
  const [offers, setOffers] = useState<TenancyOffer[]>([]);
  const [offerBusy, setOfferBusy] = useState(false);
  const [settlements, setSettlements] = useState<SettlementEntity[]>([]);
  const [offerPayees, setOfferPayees] = useState({
    landlordSettlementEntityId: '',
    managementSettlementEntityId: '',
    agencySettlementEntityId: '',
  });
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([]);
  const [offerPropertyId, setOfferPropertyId] = useState('');
  const [feeSchedule, setFeeSchedule] = useState<{
    agencyFeePct: number;
    legalFeePct: number;
    managementFeePct: number;
    applicationAgencyLegalPct: number;
    source: string;
    note?: string;
  } | null>(null);

  async function load() {
    const data = await api<ApplicationDetail>(`/tenant-applications/${id}`);
    setApp(data);
    if (data.evaluation) {
      setScores({
        c1: data.evaluation.c1,
        c2: data.evaluation.c2,
        c3: data.evaluation.c3,
        c4: data.evaluation.c4,
      });
      setNotesInternal(data.evaluation.notesInternal ?? '');
    }
  }

  async function loadOffers() {
    const rows = await api<TenancyOffer[]>(`/offers?applicationId=${id}`);
    setOffers(rows);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/tenant-applications'));
    loadOffers().catch(() => setOffers([]));
    api<{ note?: string; entities: SettlementEntity[] } | SettlementEntity[]>(
      '/invoices/settlement-entities',
    )
      .then((res) => {
        const rows = Array.isArray(res) ? res : res.entities;
        setSettlements(rows);
        const def = rows.find((r) => r.isDefault) ?? rows[0];
        setOfferPayees({
          landlordSettlementEntityId: '',
          managementSettlementEntityId: def?.id ?? '',
          agencySettlementEntityId: def?.id ?? '',
        });
      })
      .catch(() => setSettlements([]));
    api<{ id: string; name: string }[]>('/properties')
      .then(setProperties)
      .catch(() => setProperties([]));
    api<{
      agencyFeePct: number;
      legalFeePct: number;
      managementFeePct: number;
      applicationAgencyLegalPct: number;
      source: string;
      note?: string;
    }>('/pm-engagements/schedule')
      .then(setFeeSchedule)
      .catch(() => setFeeSchedule(null));
  }, [id, router]);

  useEffect(() => {
    if (!getToken()) return;
    const q = offerPropertyId ? `?propertyId=${offerPropertyId}` : '';
    api<{
      agencyFeePct: number;
      legalFeePct: number;
      managementFeePct: number;
      applicationAgencyLegalPct: number;
      source: string;
      note?: string;
    }>(`/pm-engagements/schedule${q}`)
      .then(setFeeSchedule)
      .catch(() => setFeeSchedule(null));
  }, [offerPropertyId]);

  const canReview =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'SALES';

  const canOffer =
    canReview || user?.role === 'FINANCE' || user?.role === 'SALES';

  const avgPreview =
    Math.round(((scores.c1 + scores.c2 + scores.c3 + scores.c4) / 4) * 10) / 10;

  async function issueOffer() {
    setError('');
    setOfferBusy(true);
    try {
      await api('/offers', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: id,
          rentAnnual: Number(app?.rentAccepted) || undefined,
          propertyId: offerPropertyId || undefined,
          agencyFeePct: feeSchedule?.agencyFeePct,
          legalFeePct: feeSchedule?.legalFeePct,
          managementFeePct: feeSchedule?.managementFeePct,
          landlordSettlementEntityId: offerPayees.landlordSettlementEntityId || undefined,
          managementSettlementEntityId: offerPayees.managementSettlementEntityId || undefined,
          agencySettlementEntityId: offerPayees.agencySettlementEntityId || undefined,
        }),
      });
      await loadOffers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Offer create failed');
    } finally {
      setOfferBusy(false);
    }
  }

  async function acceptOffer(offerId: string) {
    setOfferBusy(true);
    try {
      await api(`/offers/${offerId}/accept`, { method: 'PATCH' });
      await loadOffers();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Accept failed');
    } finally {
      setOfferBusy(false);
    }
  }

  async function saveEvaluation(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const updated = await api<ApplicationDetail>(`/tenant-applications/${id}/evaluate`, {
        method: 'POST',
        body: JSON.stringify({
          ...scores,
          notesInternal: notesInternal || undefined,
        }),
      });
      setApp(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Evaluation failed');
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    setError('');
    setBusy(true);
    try {
      const updated = await api<ApplicationDetail>(`/tenant-applications/${id}/approve`, {
        method: 'POST',
      });
      setApp(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Approval failed');
    } finally {
      setBusy(false);
    }
  }

  async function reject() {
    const reason = prompt('Rejection reason:');
    if (!reason?.trim()) return;
    setBusy(true);
    try {
      const updated = await api<ApplicationDetail>(`/tenant-applications/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ rejectReason: reason }),
      });
      setApp(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Rejection failed');
    } finally {
      setBusy(false);
    }
  }

  if (!app) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading?</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/tenant-applications" className="text-sm text-[#e87722] hover:underline">
        ? Applications
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">{app.applicationRef}</h1>
          <p className="text-slate-600">
            {app.surname} {app.otherNames} · {app.estate.name}
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">{app.status.replace(/_/g, ' ')}</span>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {app.agencyFeeInvoice && (
        <div className="mt-4 rounded-lg border border-[#e87722]/30 bg-orange-50 p-4 text-sm">
          Agency+Legal (20% application clause) invoice:{' '}
          <Link href={`/invoices/${app.agencyFeeInvoice.id}`} className="font-medium text-[#e87722] hover:underline">
            {app.agencyFeeInvoice.invoiceNumber}
          </Link>{' '}
          · Outstanding NGN {Number(app.agencyFeeInvoice.outstanding).toLocaleString()}
          <p className="mt-1 text-xs text-slate-600">
            Offer letters may still split Agency 10% + Legal 5% + Mgmt 5% separately (Doc 10).
          </p>
        </div>
      )}

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-[#1a2744]">Fee reconciliation (do not merge)</h2>
        <p className="mt-1 text-xs text-slate-500">
          Doc 12 application clause and Doc 10 offer split are separate invoices — never collapse into one.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-1 pr-3">Source</th>
                <th className="py-1 pr-3">Agency / Legal / Mgmt</th>
                <th className="py-1">This application</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Doc 12 application</td>
                <td className="py-2 pr-3">
                  {Number(app.agencyFeePct ?? 20)}% Agency+Legal (combined)
                </td>
                <td className="py-2">
                  {Number(app.agencyFeePct ?? 20)}% · NGN{' '}
                  {Number(app.agencyFeeAmount).toLocaleString()}
                  {app.property ? ` · ${app.property.name}` : ''}
                  {app.agencyFeeInvoice ? (
                    <>
                      {' '}
                      ·{' '}
                      <Link
                        href={`/invoices/${app.agencyFeeInvoice.id}`}
                        className="text-[#e87722] hover:underline"
                      >
                        {app.agencyFeeInvoice.invoiceNumber}
                      </Link>
                    </>
                  ) : (
                    ' · invoice pending'
                  )}
                </td>
              </tr>
              <tr className="border-t border-slate-100">
                <td className="py-2 pr-3">Doc 10 offer letter</td>
                <td className="py-2 pr-3">Agency 10% + Legal 5% + Mgmt 5%</td>
                <td className="py-2">
                  {offers[0]
                    ? `NGN ${(
                        Number(offers[0].agencyFeeAmount) +
                        Number(offers[0].legalFeeAmount) +
                        Number(offers[0].managementFeeAmount)
                      ).toLocaleString()} on latest offer ${offers[0].number}`
                    : 'Issue Doc 10 offer to spawn split payee invoices'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {(app.status === 'PENDING_REVIEW' || app.status === 'APPROVED') && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-[#1a2744]">Offer letter (Doc 10)</h2>
              <p className="text-xs text-slate-500">
                Default fee lines: Agency 10% + Legal 5% + Management 5% of annual rent — separate
                from the Doc 12 application 20% Agency+Legal invoice. Legal routes with management
                settlement account per Doc 10 example.
              </p>
            </div>
            {canOffer && (
              <button
                type="button"
                disabled={offerBusy}
                onClick={issueOffer}
                className="rounded-md bg-[#e87722] px-3 py-1.5 text-sm text-white disabled:opacity-50"
              >
                Issue offer
              </button>
            )}
          </div>
          {canOffer && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={LABEL}>Property (for fee schedule)</label>
                <select
                  className={INPUT}
                  value={offerPropertyId}
                  onChange={(e) => setOfferPropertyId(e.target.value)}
                >
                  <option value="">Doc defaults (no engagement)</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {feeSchedule && (
                <div className="rounded-md border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                  <p className="font-medium text-[#1a2744]">
                    Schedule source: {feeSchedule.source}
                  </p>
                  <p className="mt-1">
                    Offer Agency {feeSchedule.agencyFeePct}% · Legal {feeSchedule.legalFeePct}% ·
                    Mgmt {feeSchedule.managementFeePct}%
                  </p>
                  <p>
                    App Agency+Legal clause {feeSchedule.applicationAgencyLegalPct}% (Doc 12 —
                    separate invoice)
                  </p>
                  {feeSchedule.note && <p className="mt-1 text-slate-500">{feeSchedule.note}</p>}
                  <Link href="/pm-engagements" className="mt-1 inline-block text-[#e87722] hover:underline">
                    Manage engagements →
                  </Link>
                </div>
              )}
            </div>
          )}
          {canOffer && settlements.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  ['landlordSettlementEntityId', 'Landlord (rent/caution)'],
                  ['managementSettlementEntityId', 'Management (+ Legal 5%)'],
                  ['agencySettlementEntityId', 'Agency (10%)'],
                ] as const
              ).map(([key, label]) => (
                <div key={key}>
                  <label className={LABEL}>{label}</label>
                  <select
                    className={INPUT}
                    value={offerPayees[key]}
                    onChange={(e) => setOfferPayees({ ...offerPayees, [key]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {settlements.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.bankName} · {s.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          {offers.map((o) => (
            <div
              key={o.id}
              className="rounded-md border border-slate-100 bg-slate-50 p-3 text-sm space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-[#1a2744]">
                  {o.number} · {o.status}
                </span>
                <span className="space-x-2">
                  <button
                    type="button"
                    className="text-[#e87722] hover:underline"
                    onClick={() => downloadPdf(`/offers/${o.id}/pdf`, `${o.number}.pdf`)}
                  >
                    PDF
                  </button>
                  {canOffer && o.status === 'ISSUED' && (
                    <button
                      type="button"
                      disabled={offerBusy}
                      className="text-green-700 hover:underline"
                      onClick={() => acceptOffer(o.id)}
                    >
                      Accept & invoice
                    </button>
                  )}
                </span>
              </div>
              <p>
                Rent NGN {Number(o.rentAnnual).toLocaleString()} · Caution NGN 
                {Number(o.cautionAmount).toLocaleString()}
              </p>
              <p>
                Agency {Number(o.agencyFeePct)}% NGN {Number(o.agencyFeeAmount).toLocaleString()}
                {' · '}Legal {Number(o.legalFeePct)}% NGN {Number(o.legalFeeAmount).toLocaleString()}
                {' · '}Mgmt {Number(o.managementFeePct)}% NGN 
                {Number(o.managementFeeAmount).toLocaleString()}
              </p>
              <div className="text-xs text-slate-600 space-y-0.5">
                {o.landlordSettlement && (
                  <p>
                    Landlord: {o.landlordSettlement.name} · {o.landlordSettlement.bankName} ·{' '}
                    {o.landlordSettlement.accountNumber}
                  </p>
                )}
                {o.managementSettlement && (
                  <p>
                    Management/Legal: {o.managementSettlement.name} ·{' '}
                    {o.managementSettlement.bankName} · {o.managementSettlement.accountNumber}
                  </p>
                )}
                {o.agencySettlement && (
                  <p>
                    Agency: {o.agencySettlement.name} · {o.agencySettlement.bankName} ·{' '}
                    {o.agencySettlement.accountNumber}
                  </p>
                )}
                {(o.landlordInvoice || o.managementInvoice || o.agencyInvoice) && (
                  <p className="pt-1 space-x-2">
                    Split invoices:{' '}
                    {o.landlordInvoice && (
                      <Link
                        href={`/invoices/${o.landlordInvoice.id}`}
                        className="text-[#e87722] hover:underline"
                      >
                        {o.landlordInvoice.invoiceNumber} (landlord)
                      </Link>
                    )}
                    {o.managementInvoice && (
                      <Link
                        href={`/invoices/${o.managementInvoice.id}`}
                        className="text-[#e87722] hover:underline"
                      >
                        {o.managementInvoice.invoiceNumber} (mgmt+legal)
                      </Link>
                    )}
                    {o.agencyInvoice && (
                      <Link
                        href={`/invoices/${o.agencyInvoice.id}`}
                        className="text-[#e87722] hover:underline"
                      >
                        {o.agencyInvoice.invoiceNumber} (agency)
                      </Link>
                    )}
                  </p>
                )}
                {!o.landlordSettlement && !o.managementSettlement && !o.agencySettlement && (
                  <p>
                    SC NGN {Number(o.serviceChargeAnnual).toLocaleString()}
                    {o.agencyPayee ? ` · Agency payee: ${o.agencyPayee}` : ''}
                  </p>
                )}
              </div>
            </div>
          ))}
          {!offers.length && (
            <p className="text-sm text-slate-500">No Doc 10 offers issued yet.</p>
          )}
        </div>
      )}

      {app.status === 'PENDING_REVIEW' && canReview && (
        <form
          onSubmit={saveEvaluation}
          className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-4"
        >
          <div>
            <h2 className="font-semibold text-[#1a2744]">Tenant evaluation (staff only)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Score each parameter on a scale of <strong>1–10</strong> (1 = lowest, 10 = highest).
              The applicant never self-scores. The system averages your scores and converts to a
              star rating (1–5).
            </p>
          </div>
          <div className="rounded-md border border-[#e87722]/30 bg-[#fff8f2] px-3 py-2 text-sm text-[#1a2744]">
            Average preview: <strong>{avgPreview}</strong> · Star rating:{' '}
            <strong>
              {starPreview(avgPreview).display} ({starPreview(avgPreview).rating}/5)
            </strong>
            {app.evaluation && (
              <span className="text-slate-600">
                {' '}
                (saved {app.evaluation.decision}
                {app.evaluation.starRating != null
                  ? ` · ${Number(app.evaluation.starRating).toFixed(1)}★`
                  : ''}
                )
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {CRITERIA.map((c) => (
              <div key={c.key} className="rounded-md border border-slate-100 bg-slate-50/80 p-3">
                <label className={LABEL}>{c.label}</label>
                <p className="mb-2 text-xs text-slate-500">{c.help}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={10}
                    step={1}
                    className="w-full accent-[#e87722]"
                    value={scores[c.key]}
                    onChange={(e) =>
                      setScores({ ...scores, [c.key]: Number(e.target.value) })
                    }
                  />
                  <input
                    type="number"
                    min={1}
                    max={10}
                    className={`${INPUT} w-16 shrink-0 text-center`}
                    value={scores[c.key]}
                    onChange={(e) =>
                      setScores({
                        ...scores,
                        [c.key]: Math.min(10, Math.max(1, Number(e.target.value) || 1)),
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
          <div>
            <label className={LABEL}>Internal notes (never shown to applicant)</label>
            <textarea
              className={INPUT}
              rows={2}
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Investigations, landlord preferences, observations…"
            />
          </div>
          <p className="text-xs text-slate-600">
            Stars are informational. Approve or reject after reviewing the rating — no automatic
            pass/fail bands.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Save evaluation
            </button>
            <button
              type="button"
              disabled={busy || !app.terrierRow || !app.evaluation}
              onClick={approve}
              className="rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
            >
              Approve → Terrier + Tenancy
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={reject}
              className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
          {!app.evaluation && (
            <p className="text-sm text-amber-700">Save evaluation before approval.</p>
          )}
          {!app.terrierRow && (
            <p className="text-sm text-amber-700">Assign a Terrier unit before approval.</p>
          )}
        </form>
      )}

      {app.evaluation && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
          Evaluation average <strong>{Number(app.evaluation.average).toFixed(1)}</strong>
          {' · '}
          {app.evaluation.starRating != null
            ? `${Number(app.evaluation.starRating).toFixed(1)}★`
            : starPreview(Number(app.evaluation.average)).display}{' '}
          ({app.evaluation.decision})
        </div>
      )}

      {app.tenantProfile && (
        <p className="mt-4 text-sm text-green-700">
          Tenant profile created: {app.tenantProfile.surname} {app.tenantProfile.otherNames}
          {app.terrierRow && (
            <>
              {' '}
              ?{' '}
              <Link href={`/estate-terrier/${app.estate.id}`} className="underline">
                Terrier
              </Link>
              {' ? '}
              <Link href="/tenancies" className="underline">
                Tenancies
              </Link>
              {' ? '}
              <Link href="/service-charges" className="underline">
                Service charges
              </Link>
            </>
          )}
        </p>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <InfoCard title="Personal">
          <InfoRow label="Phone" value={app.phone} />
          <InfoRow label="Nationality" value={app.nationality} />
          <InfoRow label="State of origin" value={app.stateOfOrigin} />
          <InfoRow label="Marital status" value={app.maritalStatus} />
          <InfoRow label="Occupation" value={app.occupation} />
          <InfoRow label="Rent accepted" value={`?${Number(app.rentAccepted).toLocaleString()}`} />
          <InfoRow
            label="Agency+Legal (20% clause)"
            value={`NGN ${Number(app.agencyFeeAmount).toLocaleString()}`}
          />
        </InfoCard>
        <InfoCard title="Unit & guarantor">
          <InfoRow
            label="Unit"
            value={
              app.terrierRow
                ? `#${app.terrierRow.serialNo} ${app.terrierRow.propertyType}`
                : 'Not assigned'
            }
          />
          <InfoRow label="Guarantor" value={app.guarantorName} />
          <InfoRow label="Guarantor phone" value={app.guarantorPhone} />
          <InfoRow label="Applicant signature" value={app.applicantSignature ?? '?'} />
          <InfoRow label="Guarantor signature" value={app.guarantorSignature ?? '?'} />
          {app.rejectReason && <InfoRow label="Reject reason" value={app.rejectReason} />}
        </InfoCard>
        <InfoCard title="Addresses" className="md:col-span-2">
          <InfoRow label="Former address" value={app.formerAddress} />
          <InfoRow label="Permanent address" value={app.permanentAddress} />
          <InfoRow label="Office address" value={app.officeAddress} />
          <InfoRow label="Vacate reason" value={app.vacateReason} />
        </InfoCard>
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
    <div className={`rounded-lg border border-slate-200 bg-white p-4 ${className}`}>
      <h2 className="mb-3 font-semibold text-[#1a2744]">{title}</h2>
      <dl className="space-y-2 text-sm">{children}</dl>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value}</dd>
    </div>
  );
}
