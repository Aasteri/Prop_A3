'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken, ApiError } from '@/lib/api';

type Project = { id: string; name: string; contractRef: string | null; site: { code: string } };
type SettlementEntity = {
  id: string;
  name: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  isDefault: boolean;
};
type ApprovedChange = {
  id: string;
  changeId: string;
  description: string;
  projectId: string;
};

type LineRow = { description: string; quantity: number; unit: string; unitPrice: number };

const INPUT =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[#e87722] focus:outline-none focus:ring-1 focus:ring-[#e87722]';

export default function NewInvoicePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [entities, setEntities] = useState<SettlementEntity[]>([]);
  const [approvedChanges, setApprovedChanges] = useState<ApprovedChange[]>([]);
  const [projectId, setProjectId] = useState('');
  const [settlementEntityId, setSettlementEntityId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [projectDetails, setProjectDetails] = useState('');
  const [contractRef, setContractRef] = useState('');
  const [paymentTerms, setPaymentTerms] = useState(
    'Due within 24 hours from completion and handover',
  );
  const [lines, setLines] = useState<LineRow[]>([
    { description: '', quantity: 1, unit: 'LS', unitPrice: 0 },
  ]);
  const [selectedChanges, setSelectedChanges] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    Promise.all([
      api<Project[]>('/projects'),
      api<SettlementEntity[]>('/invoices/settlement-entities'),
      api<ApprovedChange[]>('/invoices/approved-changes'),
    ]).then(([projs, ents, changes]) => {
      setProjects(projs);
      setEntities(ents);
      setApprovedChanges(changes);
      if (projs[0]) {
        setProjectId(projs[0].id);
        setContractRef(projs[0].contractRef ?? '');
        setProjectDetails(projs[0].name);
      }
      const def = ents.find((e) => e.isDefault) ?? ents[0];
      if (def) setSettlementEntityId(def.id);
    });
  }, [router]);

  useEffect(() => {
    const p = projects.find((x) => x.id === projectId);
    if (p) {
      setContractRef(p.contractRef ?? '');
      setProjectDetails(p.name);
    }
    api<ApprovedChange[]>(`/invoices/approved-changes?projectId=${projectId}`).then(
      setApprovedChanges,
    );
  }, [projectId, projects]);

  async function save(sendAfter: boolean) {
    setError('');
    setLoading(true);

    const validLines = lines.filter((l) => l.description.trim());
    if (!validLines.length || !clientName.trim()) {
      setError('Client name and at least one line item required');
      setLoading(false);
      return;
    }

    const variations = selectedChanges.map((changeId) => {
      const c = approvedChanges.find((x) => x.id === changeId)!;
      return {
        changeLogId: changeId,
        title: `Change ${c.changeId}`,
        description: c.description,
        amount: 0,
      };
    });

    try {
      const invoice = await api<{ id: string }>('/invoices', {
        method: 'POST',
        body: JSON.stringify({
          projectId: projectId || undefined,
          settlementEntityId,
          invoiceType: 'SALES',
          issueDate: new Date().toISOString().slice(0, 10),
          contractRef,
          clientName,
          clientAddress,
          projectDetails,
          paymentTerms,
          lines: validLines,
          variations,
        }),
      });

      if (sendAfter) {
        await api(`/invoices/${invoice.id}/send`, { method: 'POST' });
      }

      router.push(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create invoice');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent, sendAfter: boolean) {
    e.preventDefault();
    save(sendAfter);
  }

  return (
    <AppShell>
      <h1 className="mb-4 text-2xl font-semibold text-[#1a2744]">New Invoice</h1>

      <form className="max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Project</span>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={INPUT}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.site.code} — {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Settlement entity</span>
            <select
              value={settlementEntityId}
              onChange={(e) => setSettlementEntityId(e.target.value)}
              className={INPUT}
            >
              {entities.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {e.bankName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Client / Bill To</span>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} className={INPUT} required />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Client address</span>
          <textarea value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} rows={2} className={INPUT} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Project details</span>
          <textarea value={projectDetails} onChange={(e) => setProjectDetails(e.target.value)} rows={2} className={INPUT} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Contract ref</span>
          <input value={contractRef} onChange={(e) => setContractRef(e.target.value)} className={INPUT} />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium">Line items</p>
          {lines.map((line, i) => (
            <div key={i} className="mb-2 grid gap-2 sm:grid-cols-4">
              <input
                placeholder="Description"
                value={line.description}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], description: e.target.value };
                  setLines(next);
                }}
                className={`${INPUT} sm:col-span-2`}
              />
              <input
                type="number"
                min={0}
                placeholder="Qty"
                value={line.quantity}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], quantity: Number(e.target.value) };
                  setLines(next);
                }}
                className={INPUT}
              />
              <input
                placeholder="Unit"
                value={line.unit}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], unit: e.target.value };
                  setLines(next);
                }}
                className={INPUT}
              />
              <input
                type="number"
                min={0}
                placeholder="Unit price ₦"
                value={line.unitPrice}
                onChange={(e) => {
                  const next = [...lines];
                  next[i] = { ...next[i], unitPrice: Number(e.target.value) };
                  setLines(next);
                }}
                className={`${INPUT} sm:col-span-2`}
              />
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { description: '', quantity: 1, unit: 'LS', unitPrice: 0 }])} className="text-sm text-[#e87722]">
            + Add line
          </button>
        </div>

        {approvedChanges.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Link approved changes (V-01…)</p>
            <div className="space-y-1">
              {approvedChanges.map((c) => (
                <label key={c.id} className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedChanges.includes(c.id)}
                    onChange={(e) => {
                      setSelectedChanges((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id),
                      );
                    }}
                  />
                  <span>
                    {c.changeId}: {c.description.slice(0, 80)}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Payment terms</span>
          <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} className={INPUT} />
        </label>

        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex gap-3">
          <button type="button" disabled={loading} onClick={(e) => onSubmit(e, false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60">
            Save draft
          </button>
          <button type="button" disabled={loading} onClick={(e) => onSubmit(e, true)} className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-60">
            {loading ? 'Saving…' : 'Save & send'}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
