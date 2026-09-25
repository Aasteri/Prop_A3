'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { EmptyEntityGate } from '@/components/EmptyEntityGate';
import { SearchableSelect } from '@/components/SearchableSelect';
import { api, ApiError, getToken } from '@/lib/api';

type Estate = { id: string; code: string; name: string };
type VacantUnit = { id: string; serialNo: number; propertyType: string; location: string };
type Property = { id: string; name: string; code: string | null };
type Clauses = {
  clause1: string;
  clause2: string;
  applicationAgencyLegalPct?: number;
  scheduleSource?: string;
  note?: string;
};

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function NewTenantApplicationPage() {
  const router = useRouter();
  const [estates, setEstates] = useState<Estate[]>([]);
  const [vacantUnits, setVacantUnits] = useState<VacantUnit[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState('');
  const [clauses, setClauses] = useState<Clauses | null>(null);
  const [estateId, setEstateId] = useState('');
  const [terrierRowId, setTerrierRowId] = useState('');
  const [form, setForm] = useState({
    surname: '',
    otherNames: '',
    nationality: 'Nigerian',
    stateOfOrigin: '',
    maritalStatus: 'Single',
    phone: '',
    formerAddress: '',
    vacateReason: '',
    permanentAddress: '',
    occupation: '',
    officeAddress: '',
    propertyTypeAccepted: '2 Bedroom Flat',
    rentAccepted: '',
    rentPayer: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinAddress: '',
    nextOfKinRelationship: '',
    guarantorName: '',
    guarantorWorkAddress: '',
    guarantorPhone: '',
    inspectionDate: '',
    applicantSignature: '',
    guarantorSignature: '',
    clause1Accepted: false,
    clause2Accepted: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Estate[]>('/estate-terrier/estates').then((list) => {
      setEstates(list);
      if (list[0]) setEstateId(list[0].id);
    });
    api<Property[]>('/properties').then(setProperties).catch(() => setProperties([]));
    api<Clauses>('/tenant-applications/clauses').then(setClauses);
  }, [router]);

  useEffect(() => {
    if (!estateId) return;
    api<VacantUnit[]>(`/estate-terrier/estates/${estateId}/vacant-units`)
      .then((units) => {
        setVacantUnits(units);
        setTerrierRowId(units[0]?.id ?? '');
      })
      .catch(() => setVacantUnits([]));
  }, [estateId]);

  useEffect(() => {
    const q = propertyId ? `?propertyId=${propertyId}` : '';
    api<Clauses>(`/tenant-applications/clauses${q}`).then(setClauses).catch(() => {});
  }, [propertyId]);

  function setField(key: keyof typeof form, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function buildPayload() {
    return {
      estateId,
      terrierRowId: terrierRowId || undefined,
      propertyId: propertyId || undefined,
      applicationAgencyLegalPct: clauses?.applicationAgencyLegalPct,
      ...form,
      rentAccepted: parseFloat(form.rentAccepted) || 0,
      inspectionDate: form.inspectionDate || undefined,
    };
  }

  async function save(submit: boolean) {
    setError('');
    setLoading(true);
    try {
      const created = await api<{ id: string }>('/tenant-applications', {
        method: 'POST',
        body: JSON.stringify(buildPayload()),
      });
      if (submit) {
        await api(`/tenant-applications/${created.id}/submit`, {
          method: 'POST',
          body: JSON.stringify({
            applicantSignature: form.applicantSignature,
            guarantorSignature: form.guarantorSignature,
          }),
        });
      }
      router.push(submit ? `/tenant-applications/${created.id}` : '/tenant-applications');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent, submit: boolean) {
    e.preventDefault();
    save(submit);
  }

  const feePct = clauses?.applicationAgencyLegalPct ?? 20;
  const agencyFee = ((parseFloat(form.rentAccepted) || 0) * feePct) / 100;

  const estateOptions = useMemo(
    () => estates.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` })),
    [estates],
  );
  const vacantUnitOptions = useMemo(
    () =>
      vacantUnits.map((u) => ({
        value: u.id,
        label: `#${u.serialNo} ${u.propertyType} · ${u.location}`,
      })),
    [vacantUnits],
  );
  const propertyOptions = useMemo(
    () =>
      properties.map((p) => ({
        value: p.id,
        label: `${p.name}${p.code ? ` (${p.code})` : ''}`,
      })),
    [properties],
  );

  return (
    <AppShell>
      <h1 className="mb-1 text-2xl font-semibold text-[#1a2744]">Tenant application</h1>
      <p className="mb-4 text-sm text-slate-600">Personal data — 23 fields per Triple A form</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {!estates.length ? (
        <EmptyEntityGate
          title="No estates yet"
          description="Create an estate and vacant units in the estate terrier before starting a tenant application."
          actionHref="/estate-terrier"
          actionLabel="Open estate terrier"
          secondaryHref="/properties-hub"
          secondaryLabel="Properties hub"
        />
      ) : (
      <form className="max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Estate</span>
            <SearchableSelect
              options={estateOptions}
              value={estateId}
              onChange={setEstateId}
              placeholder="Search estate…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Unit applying for (vacant)</span>
            <SearchableSelect
              options={vacantUnitOptions}
              value={terrierRowId}
              onChange={setTerrierRowId}
              emptyLabel="— Select later —"
              placeholder="Search unit…"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block font-medium">Managed property (fee schedule)</span>
            <SearchableSelect
              options={propertyOptions}
              value={propertyId}
              onChange={setPropertyId}
              emptyLabel="Doc 12 default (20%)"
              placeholder="Search property…"
            />
            {clauses?.scheduleSource && (
              <span className="mt-1 block text-xs text-slate-500">
                Schedule: {clauses.scheduleSource}
                {clauses.note ? ` — ${clauses.note}` : ''}
              </span>
            )}
          </label>
        </section>

        <Section title="Personal data">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="1. Surname" value={form.surname} onChange={(v) => setField('surname', v)} required />
            <Field label="2. Other names" value={form.otherNames} onChange={(v) => setField('otherNames', v)} required />
            <Field label="3. Nationality" value={form.nationality} onChange={(v) => setField('nationality', v)} required />
            <Field label="4. State of origin" value={form.stateOfOrigin} onChange={(v) => setField('stateOfOrigin', v)} required />
            <Field label="5. Marital status" value={form.maritalStatus} onChange={(v) => setField('maritalStatus', v)} required />
            <Field label="6. Phone no." value={form.phone} onChange={(v) => setField('phone', v)} required />
            <TextArea label="7. Former residential address" value={form.formerAddress} onChange={(v) => setField('formerAddress', v)} className="sm:col-span-2" />
            <TextArea label="8. Reason(s) for vacating" value={form.vacateReason} onChange={(v) => setField('vacateReason', v)} className="sm:col-span-2" />
            <TextArea label="9. Permanent contact address" value={form.permanentAddress} onChange={(v) => setField('permanentAddress', v)} className="sm:col-span-2" />
            <Field label="10. Occupation" value={form.occupation} onChange={(v) => setField('occupation', v)} required />
            <TextArea label="11. Office/business address" value={form.officeAddress} onChange={(v) => setField('officeAddress', v)} className="sm:col-span-2" />
            <Field label="12. Type of property accepted" value={form.propertyTypeAccepted} onChange={(v) => setField('propertyTypeAccepted', v)} required />
            <Field label="13. Rent accepted (₦)" value={form.rentAccepted} onChange={(v) => setField('rentAccepted', v)} type="number" required />
            <Field label="14. Person responsible for rent" value={form.rentPayer} onChange={(v) => setField('rentPayer', v)} required className="sm:col-span-2" />
          </div>
          {form.rentAccepted && (
            <p className="mt-2 text-sm text-slate-600">
              Agency+Legal fee ({feePct}% application clause):{' '}
              <strong>NGN {agencyFee.toLocaleString()}</strong>
              <span className="mt-1 block text-xs font-normal text-slate-500">
                Separate offer-letter lines (Agency / Legal / Mgmt) come later at offer stage from
                the same PM engagement schedule.
              </span>
            </p>
          )}
        </Section>

        <Section title="Next of kin">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="15. Next of kin" value={form.nextOfKinName} onChange={(v) => setField('nextOfKinName', v)} required />
            <Field label="16. Phone no." value={form.nextOfKinPhone} onChange={(v) => setField('nextOfKinPhone', v)} required />
            <TextArea label="17. Address" value={form.nextOfKinAddress} onChange={(v) => setField('nextOfKinAddress', v)} className="sm:col-span-2" />
            <Field label="18. Relationship" value={form.nextOfKinRelationship} onChange={(v) => setField('nextOfKinRelationship', v)} required />
          </div>
        </Section>

        <Section title="Guarantor">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="19. Name of guarantor" value={form.guarantorName} onChange={(v) => setField('guarantorName', v)} required />
            <Field label="22. Guarantor phone" value={form.guarantorPhone} onChange={(v) => setField('guarantorPhone', v)} required />
            <TextArea label="20. Place of work/address" value={form.guarantorWorkAddress} onChange={(v) => setField('guarantorWorkAddress', v)} className="sm:col-span-2" />
            <Field label="21. Guarantor signature (type full name)" value={form.guarantorSignature} onChange={(v) => setField('guarantorSignature', v)} required />
            <Field label="23. Date of inspection" value={form.inspectionDate} onChange={(v) => setField('inspectionDate', v)} type="date" />
          </div>
        </Section>

        <Section title="Legal clauses">
          {clauses && (
            <div className="space-y-3 text-sm text-slate-700">
              <label className="flex gap-2">
                <input type="checkbox" checked={form.clause1Accepted} onChange={(e) => setField('clause1Accepted', e.target.checked)} />
                <span>{clauses.clause1}</span>
              </label>
              <label className="flex gap-2">
                <input type="checkbox" checked={form.clause2Accepted} onChange={(e) => setField('clause2Accepted', e.target.checked)} />
                <span>{clauses.clause2}</span>
              </label>
            </div>
          )}
          <Field
            label="Applicant signature (type full name)"
            value={form.applicantSignature}
            onChange={(v) => setField('applicantSignature', v)}
            required
            className="mt-4"
          />
        </Section>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={(e) => onSubmit(e as unknown as FormEvent, false)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50 text-slate-900"
          >
            Save draft
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={(e) => onSubmit(e, true)}
            className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-50"
          >
            {loading ? 'Submitting…' : 'Submit for PM review'}
          </button>
        </div>
      </form>
      )}
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 border-b border-slate-100 pb-2 text-sm font-semibold uppercase tracking-wide text-[#1a2744]">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = 'text',
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT} required={required} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <label className={`block text-sm ${className}`}>
      <span className="mb-1 block font-medium">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={INPUT} required />
    </label>
  );
}
