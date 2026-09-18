'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER, SECTION_TITLE } from '@/lib/ui';

type CompanySettings = {
  id: string;
  lettingFeePct: number;
  agencyFeePct: number;
  legalFeePct: number;
  managementFeePct: number;
  applicationAgencyLegalPct: number;
  worksPlatformFeePct: number;
  worksRetentionPct: number;
  servicesPlatformFeePct: number;
  cautionDepositPct: number;
  externalAgentCommissionOfAgencyPct: number;
  companyLegalName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  defaultCurrency: string;
  notes: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

type FormState = {
  lettingFeePct: string;
  agencyFeePct: string;
  legalFeePct: string;
  managementFeePct: string;
  applicationAgencyLegalPct: string;
  worksPlatformFeePct: string;
  worksRetentionPct: string;
  servicesPlatformFeePct: string;
  cautionDepositPct: string;
  externalAgentCommissionOfAgencyPct: string;
  companyLegalName: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  defaultCurrency: string;
  notes: string;
};

function toForm(s: CompanySettings): FormState {
  return {
    lettingFeePct: String(s.lettingFeePct),
    agencyFeePct: String(s.agencyFeePct),
    legalFeePct: String(s.legalFeePct),
    managementFeePct: String(s.managementFeePct),
    applicationAgencyLegalPct: String(s.applicationAgencyLegalPct),
    worksPlatformFeePct: String(s.worksPlatformFeePct),
    worksRetentionPct: String(s.worksRetentionPct),
    servicesPlatformFeePct: String(s.servicesPlatformFeePct),
    cautionDepositPct: String(s.cautionDepositPct),
    externalAgentCommissionOfAgencyPct: String(s.externalAgentCommissionOfAgencyPct),
    companyLegalName: s.companyLegalName,
    bankName: s.bankName,
    bankAccountName: s.bankAccountName,
    bankAccountNumber: s.bankAccountNumber,
    defaultCurrency: s.defaultCurrency,
    notes: s.notes ?? '',
  };
}

const FEE_FIELDS: { key: keyof FormState; label: string; hint: string }[] = [
  { key: 'lettingFeePct', label: 'Letting fee %', hint: 'New tenant letting' },
  { key: 'agencyFeePct', label: 'Agency fee %', hint: 'Offer letter agency split' },
  { key: 'legalFeePct', label: 'Legal fee %', hint: 'Offer letter legal' },
  { key: 'managementFeePct', label: 'Management fee %', hint: 'Ongoing PM' },
  {
    key: 'applicationAgencyLegalPct',
    label: 'Application Agency+Legal %',
    hint: 'Doc 12 combined clause',
  },
  { key: 'worksPlatformFeePct', label: 'Works platform fee %', hint: 'Works contracts' },
  { key: 'worksRetentionPct', label: 'Works retention %', hint: 'Default retention' },
  {
    key: 'servicesPlatformFeePct',
    label: 'Services platform fee %',
    hint: 'Labour only (maintenance / artisans)',
  },
  { key: 'cautionDepositPct', label: 'Caution deposit %', hint: 'Of annual rent' },
  {
    key: 'externalAgentCommissionOfAgencyPct',
    label: 'External agent of agency %',
    hint: 'Share of company agency fee',
  },
];

export default function CompanySettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [meta, setMeta] = useState<{ updatedAt: string; updatedBy: string | null } | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  const canEdit = user?.role === 'CEO' || user?.role === 'ADMIN';
  const canView =
    user?.role === 'CEO' ||
    user?.role === 'ADMIN' ||
    user?.role === 'FINANCE';

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const u = getUser<AuthUser>();
    setUser(u);
    if (!u || (u.role !== 'CEO' && u.role !== 'ADMIN' && u.role !== 'FINANCE')) {
      router.replace('/dashboard');
      return;
    }
    api<CompanySettings>('/company-settings')
      .then((s) => {
        setForm(toForm(s));
        setMeta({ updatedAt: s.updatedAt, updatedBy: s.updatedBy });
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load settings'));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form || !canEdit) return;
    setError('');
    setOk('');
    setSaving(true);
    try {
      const body = {
        lettingFeePct: Number(form.lettingFeePct),
        agencyFeePct: Number(form.agencyFeePct),
        legalFeePct: Number(form.legalFeePct),
        managementFeePct: Number(form.managementFeePct),
        applicationAgencyLegalPct: Number(form.applicationAgencyLegalPct),
        worksPlatformFeePct: Number(form.worksPlatformFeePct),
        worksRetentionPct: Number(form.worksRetentionPct),
        servicesPlatformFeePct: Number(form.servicesPlatformFeePct),
        cautionDepositPct: Number(form.cautionDepositPct),
        externalAgentCommissionOfAgencyPct: Number(form.externalAgentCommissionOfAgencyPct),
        companyLegalName: form.companyLegalName.trim(),
        bankName: form.bankName.trim(),
        bankAccountName: form.bankAccountName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        defaultCurrency: form.defaultCurrency.trim() || 'NGN',
        notes: form.notes.trim() || undefined,
      };
      const saved = await api<CompanySettings>('/company-settings', {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setForm(toForm(saved));
      setMeta({ updatedAt: saved.updatedAt, updatedBy: saved.updatedBy });
      setOk('Settings saved. Triple A settlement bank synced.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (!user || !canView || !form) {
    return (
      <AppShell>
        <p className="text-slate-500">{error || 'Loading…'}</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Platform · Company settings
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
            Fee standards &amp; bank identity
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-white/80">
            Company-wide defaults for new offers, applications, works, services, and payouts.
            {canEdit ? ' You can edit these as CEO/Admin.' : ' Read-only for Finance.'}
          </p>
        </header>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Changes apply to new calculations from now on; existing invoices/engagements unchanged
          unless edited.
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <section className={`${CARD} space-y-4 p-6`}>
            <h2 className={SECTION_TITLE}>Fee percentages</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {FEE_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className={LABEL} htmlFor={f.key}>
                    {f.label}
                  </label>
                  <input
                    id={f.key}
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    className={INPUT}
                    value={form[f.key]}
                    disabled={!canEdit}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                  <p className="mt-1 text-xs text-slate-500">{f.hint}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={`${CARD} space-y-4 p-6`}>
            <h2 className={SECTION_TITLE}>Company &amp; bank</h2>
            <p className="text-sm text-slate-600">
              Saving updates the default settlement entity (seed-triplea) used on invoices.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="companyLegalName">
                  Legal name
                </label>
                <input
                  id="companyLegalName"
                  className={INPUT}
                  value={form.companyLegalName}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, companyLegalName: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="bankName">
                  Bank name
                </label>
                <input
                  id="bankName"
                  className={INPUT}
                  value={form.bankName}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="defaultCurrency">
                  Default currency
                </label>
                <input
                  id="defaultCurrency"
                  className={INPUT}
                  value={form.defaultCurrency}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="bankAccountName">
                  Account name
                </label>
                <input
                  id="bankAccountName"
                  className={INPUT}
                  value={form.bankAccountName}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="bankAccountNumber">
                  Account number
                </label>
                <input
                  id="bankAccountNumber"
                  className={INPUT}
                  value={form.bankAccountNumber}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={LABEL} htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  className={INPUT}
                  value={form.notes}
                  disabled={!canEdit}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          </section>

          {meta && (
            <p className="text-xs text-slate-500">
              Last updated{' '}
              {new Date(meta.updatedAt).toLocaleString('en-NG', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
              {meta.updatedBy ? ` by ${meta.updatedBy}` : ''}
            </p>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
          {ok && (
            <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">{ok}</p>
          )}

          {canEdit && (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#e87722] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#d66a1c] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save company settings'}
            </button>
          )}
        </form>
      </div>
    </AppShell>
  );
}
