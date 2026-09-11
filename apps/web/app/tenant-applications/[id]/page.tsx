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
  rejectReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  estate: { id: string; code: string; name: string };
  terrierRow: { id: string; serialNo: number; propertyType: string; location: string } | null;
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
  { key: 'c1' as const, label: 'Compatibility of tenant/use with property' },
  { key: 'c2' as const, label: 'Ability to pay' },
  { key: 'c3' as const, label: 'Reason for vacating previous property' },
  { key: 'c4' as const, label: 'Guarantor character & reliability' },
];

export default function TenantApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [scores, setScores] = useState({ c1: 7, c2: 7, c3: 7, c4: 7 });
  const [notesInternal, setNotesInternal] = useState('');
  const [overrideUsed, setOverrideUsed] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [offers, setOffers] = useState<TenancyOffer[]>([]);
  const [offerBusy, setOfferBusy] = useState(false);
  const [settlements, setSettlements] = useState<SettlementEntity[]>([]);
  const [offerPayees, setOfferPayees] = useState({
    landlordSettlementEntityId: '',
    managementSettlementEntityId: '',
    agencySettlementEntityId: '',
  });

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
      setOverrideUsed(data.evaluation.overrideUsed);
      setOverrideReason(data.evaluation.overrideReason ?? '');
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
    api<SettlementEntity[]>('/invoices/settlement-entities')
      .then((rows) => {
        setSettlements(rows);
        const def = rows.find((r) => r.isDefault) ?? rows[0];
        const agency = rows.find((r) => /laucarie/i.test(r.name)) ?? def;
        setOfferPayees({
          landlordSettlementEntityId: '',
          managementSettlementEntityId: def?.id ?? '',
          agencySettlementEntityId: agency?.id ?? '',
        });
      })
      .catch(() => setSettlements([]));
  }, [id, router]);

  const canReview =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

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
          overrideUsed,
          overrideReason: overrideUsed ? overrideReason : undefined,
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
            {app.surname} {app.otherNames} ? {app.estate.name}
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
          ? Outstanding ?{Number(app.agencyFeeInvoice.outstanding).toLocaleString()}
          <p className="mt-1 text-xs text-slate-600">
            Offer letters may still split Agency 10% + Legal 5% + Mgmt 5% separately (Doc 10).
          </p>
        </div>
      )}

      {(app.status === 'PENDING_REVIEW' || app.status === 'APPROVED') && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold text-[#1a2744]">Offer letter (Doc 10)</h2>
              <p className="text-xs text-slate-500">
                Default fee lines: Agency 10% + Legal 5% + Management 5% of annual rent ? separate
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
                    <option value="">?</option>
                    {settlements.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ? {s.bankName} ? {s.accountNumber}
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
                  {o.number} ? {o.status}
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
                Rent ?{Number(o.rentAnnual).toLocaleString()} ? Caution ?
                {Number(o.cautionAmount).toLocaleString()}
              </p>
              <p>
                Agency {Number(o.agencyFeePct)}% ?{Number(o.agencyFeeAmount).toLocaleString()}
                {' ? '}Legal {Number(o.legalFeePct)}% ?{Number(o.legalFeeAmount).toLocaleString()}
                {' ? '}Mgmt {Number(o.managementFeePct)}% ?
                {Number(o.managementFeeAmount).toLocaleString()}
              </p>
              <div className="text-xs text-slate-600 space-y-0.5">
                {o.landlordSettlement && (
                  <p>
                    Landlord: {o.landlordSettlement.name} ? {o.landlordSettlement.bankName} ?{' '}
                    {o.landlordSettlement.accountNumber}
                  </p>
                )}
                {o.managementSettlement && (
                  <p>
                    Management/Legal: {o.managementSettlement.name} ?{' '}
                    {o.managementSettlement.bankName} ? {o.managementSettlement.accountNumber}
                  </p>
                )}
                {o.agencySettlement && (
                  <p>
                    Agency: {o.agencySettlement.name} ? {o.agencySettlement.bankName} ?{' '}
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
                    SC ?{Number(o.serviceChargeAnnual).toLocaleString()}
                    {o.agencyPayee ? ` ? Agency payee: ${o.agencyPayee}` : ''}
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
          className="mt-4 rounded-lg border border-slate-200 bg-white p-4 space-y-3"
        >
          <h2 className="font-semibold text-[#1a2744]">FM evaluation (4 ? 0?10)</h2>
          <p className="text-xs text-slate-500">Tenant does not self-score. Average preview: {avgPreview}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CRITERIA.map((c) => (
              <div key={c.key}>
                <label className={LABEL}>{c.label}</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  className={INPUT}
                  value={scores[c.key]}
                  onChange={(e) =>
                    setScores({ ...scores, [c.key]: Math.min(10, Math.max(0, Number(e.target.value) || 0)) })
                  }
                />
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
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overrideUsed}
              onChange={(e) => setOverrideUsed(e.target.checked)}
            />
            Override band decision (required for borderline &lt; 6.0)
          </label>
          {overrideUsed && (
            <div>
              <label className={LABEL}>Override reason</label>
              <input
                className={INPUT}
                required
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
          )}
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
              Approve ? Terrier + Tenancy + PropertyAsset
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
          Evaluation average <strong>{Number(app.evaluation.average).toFixed(1)}</strong> ?{' '}
          {app.evaluation.decision}
          {app.evaluation.overrideUsed ? ' (override)' : ''}
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
            value={`?${Number(app.agencyFeeAmount).toLocaleString()}`}
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
