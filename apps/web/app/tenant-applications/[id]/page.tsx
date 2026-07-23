'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken, getUser, type AuthUser } from '@/lib/api';

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
  reviewedBy: { firstName: string; lastName: string } | null;
};

export default function TenantApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const data = await api<ApplicationDetail>(`/tenant-applications/${id}`);
    setApp(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/tenant-applications'));
  }, [id, router]);

  const canReview =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

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
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/tenant-applications" className="text-sm text-[#e87722] hover:underline">
        ← Applications
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
          Agency fee invoice:{' '}
          <Link href={`/invoices/${app.agencyFeeInvoice.id}`} className="font-medium text-[#e87722] hover:underline">
            {app.agencyFeeInvoice.invoiceNumber}
          </Link>{' '}
          · Outstanding ₦{Number(app.agencyFeeInvoice.outstanding).toLocaleString()}
        </div>
      )}

      {app.status === 'PENDING_REVIEW' && canReview && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            disabled={busy || !app.terrierRow}
            onClick={approve}
            className="rounded-md bg-green-700 px-4 py-2 text-sm text-white hover:bg-green-800 disabled:opacity-50"
          >
            Approve & create tenant profile
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={reject}
            className="rounded-md border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Reject
          </button>
          {!app.terrierRow && (
            <p className="self-center text-sm text-amber-700">Assign a unit before approval</p>
          )}
        </div>
      )}

      {app.tenantProfile && (
        <p className="mt-4 text-sm text-green-700">
          Tenant profile created: {app.tenantProfile.surname} {app.tenantProfile.otherNames}
          {app.terrierRow && (
            <>
              {' '}
              ·{' '}
              <Link href={`/estate-terrier/${app.estate.id}`} className="underline">
                View Terrier register
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
          <InfoRow label="Rent accepted" value={`₦${Number(app.rentAccepted).toLocaleString()}`} />
          <InfoRow label="Agency fee (20%)" value={`₦${Number(app.agencyFeeAmount).toLocaleString()}`} />
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
          <InfoRow label="Applicant signature" value={app.applicantSignature ?? '—'} />
          <InfoRow label="Guarantor signature" value={app.guarantorSignature ?? '—'} />
          {app.rejectReason && <InfoRow label="Reject reason" value={app.rejectReason} />}
        </InfoCard>
        <InfoCard title="Addresses" className="md:col-span-2">
          <InfoRow label="Former address" value={app.formerAddress} />
          <InfoRow label="Permanent address" value={app.permanentAddress} />
          <InfoRow label="Office address" value={app.officeAddress} />
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
