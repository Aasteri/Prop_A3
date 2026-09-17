'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, downloadPdf, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Property = { id: string; name: string; code: string | null };
type Engagement = {
  id: string;
  ownerName: string;
  ownerPhone: string | null;
  lettingFeePct: number;
  agencyFeePct: number;
  legalFeePct: number;
  managementFeePct: number;
  applicationAgencyLegalPct: number;
  status: string;
  notes: string | null;
  properties: { property: Property }[];
};

const emptyForm = {
  ownerName: '',
  ownerPhone: '',
  lettingFeePct: '10',
  agencyFeePct: '10',
  legalFeePct: '5',
  managementFeePct: '5',
  applicationAgencyLegalPct: '20',
  notes: '',
  propertyIds: [] as string[],
};

export default function PmEngagementsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Engagement[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);

  const load = () => {
    api<Engagement[]>('/pm-engagements')
      .then(setRows)
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    api<Property[]>('/properties').then(setProperties).catch(console.error);
  }, [router]);

  function toggleProperty(id: string) {
    setForm((f) => ({
      ...f,
      propertyIds: f.propertyIds.includes(id)
        ? f.propertyIds.filter((x) => x !== id)
        : [...f.propertyIds, id],
    }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/pm-engagements', {
        method: 'POST',
        body: JSON.stringify({
          ownerName: form.ownerName,
          ownerPhone: form.ownerPhone || undefined,
          lettingFeePct: Number(form.lettingFeePct),
          agencyFeePct: Number(form.agencyFeePct),
          legalFeePct: Number(form.legalFeePct),
          managementFeePct: Number(form.managementFeePct),
          applicationAgencyLegalPct: Number(form.applicationAgencyLegalPct),
          notes: form.notes || undefined,
          propertyIds: form.propertyIds,
        }),
      });
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save engagement');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Properties · PM engagements
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Fee schedules by owner engagement
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Configurable Doc 11 letting / Doc 10 offer split / Doc 12 application 20% clause
                per landlord engagement (BRD G.6.3). Defaults apply when no engagement is linked.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
            >
              {showForm ? 'Cancel' : 'New engagement'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Owner name</label>
              <input
                className={INPUT}
                required
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Owner phone</label>
              <input
                className={INPUT}
                value={form.ownerPhone}
                onChange={(e) => setForm({ ...form, ownerPhone: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Letting fee % (Doc 11)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={INPUT}
                value={form.lettingFeePct}
                onChange={(e) => setForm({ ...form, lettingFeePct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Agency % (Doc 10)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={INPUT}
                value={form.agencyFeePct}
                onChange={(e) => setForm({ ...form, agencyFeePct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Legal % (Doc 10)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={INPUT}
                value={form.legalFeePct}
                onChange={(e) => setForm({ ...form, legalFeePct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Management % (Doc 10/11)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={INPUT}
                value={form.managementFeePct}
                onChange={(e) => setForm({ ...form, managementFeePct: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Application Agency+Legal % (Doc 12)</label>
              <input
                type="number"
                min={0}
                step="0.1"
                className={INPUT}
                value={form.applicationAgencyLegalPct}
                onChange={(e) =>
                  setForm({ ...form, applicationAgencyLegalPct: e.target.value })
                }
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Linked properties</label>
              <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 p-2 space-y-1">
                {properties.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.propertyIds.includes(p.id)}
                      onChange={() => toggleProperty(p.id)}
                    />
                    {p.name}
                    {p.code ? ` (${p.code})` : ''}
                  </label>
                ))}
                {!properties.length && (
                  <p className="text-xs text-slate-500">No properties yet.</p>
                )}
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Notes</label>
              <textarea
                className={INPUT}
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white"
              >
                Save engagement
              </button>
            </div>
          </form>
        )}

        <Link href="/properties-hub" className="text-sm font-medium text-[#e87722] hover:underline">
          ← Properties hub
        </Link>

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className={`${CARD} p-4`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-[#e87722]">{r.status}</p>
                  <h2 className="mt-1 font-semibold text-[#1a2744]">{r.ownerName}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Letting {r.lettingFeePct}% · Agency {r.agencyFeePct}% · Legal {r.legalFeePct}% ·
                    Mgmt {r.managementFeePct}% · App Agency+Legal {r.applicationAgencyLegalPct}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Properties:{' '}
                    {r.properties.length
                      ? r.properties.map((x) => x.property.name).join(', ')
                      : 'none linked'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    downloadPdf(
                      `/pm-engagements/${r.id}/pdf`,
                      `pm-engagement-${r.ownerName.replace(/\s+/g, '-').toLowerCase()}.pdf`,
                    )
                  }
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-[#1a2744] hover:bg-slate-50"
                >
                  Download proposal PDF
                </button>
              </div>
            </div>
          ))}
          {!rows.length && (
            <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
              No PM engagements yet — Doc defaults (10/5/5 + 20%) apply until configured.
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
