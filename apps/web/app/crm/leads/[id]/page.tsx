'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken, getUser, type AuthUser } from '@/lib/api';

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
  listing: { id: string; listingRef: string; location: string; propertyType: string } | null;
  client: { id: string; clientRef: string; firstName: string; lastName: string } | null;
  assignedTo: { firstName: string; lastName: string } | null;
};

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  async function load() {
    const data = await api<LeadDetail>(`/crm/leads/${id}`);
    setLead(data);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/crm'));
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
      const updated = await api<LeadDetail>(`/crm/leads/${id}/stage`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setLead({ ...updated, nextStages: lead?.nextStages ?? [] });
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
          <Row label="Assigned to" value={lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '—'} />
        </InfoCard>
        <InfoCard title="Interest">
          {lead.listing ? (
            <>
              <Row label="Listing" value={lead.listing.listingRef} />
              <Row label="Property" value={`${lead.listing.location} — ${lead.listing.propertyType}`} />
              <Link href={`/listings/${lead.listing.id}`} className="text-sm text-[#e87722] hover:underline">
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
