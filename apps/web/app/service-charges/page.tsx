'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Account = {
  id: string;
  propertyId: string;
  balanceAvailable: string | number;
  balanceReserved: string | number;
  property: { id: string; name: string; code: string | null; address: string };
  _count: { entries: number };
};

type Ledger = {
  id: string;
  propertyId: string;
  balanceAvailable: number;
  balanceReserved: number;
  property?: { name: string };
  entries: {
    id: string;
    entryDate: string;
    description: string;
    debit: number;
    credit: number;
    workOrderId: string | null;
  }[];
};

export default function ServiceChargesPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Service charge levy received');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadAccounts = () =>
    api<Account[]>('/service-charges').then(setAccounts).catch(console.error);

  const loadLedger = (propertyId: string) =>
    api<Ledger>(`/service-charges/property/${propertyId}`)
      .then(setLedger)
      .catch(console.error);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    loadAccounts();
  }, [router]);

  useEffect(() => {
    if (selectedId) loadLedger(selectedId);
    else setLedger(null);
  }, [selectedId]);

  async function credit(e: FormEvent) {
    e.preventDefault();
    if (!selectedId) return;
    setBusy(true);
    setError('');
    try {
      await api(`/service-charges/property/${selectedId}/credit`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount),
          description,
        }),
      });
      setAmount('');
      await loadAccounts();
      await loadLedger(selectedId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credit failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Finance · Service charges
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Service charge ledger
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
            Available balance is the FM maintenance spend ceiling. Work orders over this balance
            escalate to landlord approval.
          </p>
        </header>

        <div className="grid gap-6 xl:grid-cols-5">
          <div className={`xl:col-span-2 ${CARD} overflow-hidden`}>
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-semibold text-[#1a2744]">Property accounts</h2>
            </div>
            <ul className="divide-y divide-slate-100">
              {accounts.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(a.propertyId)}
                    className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 ${
                      selectedId === a.propertyId ? 'bg-orange-50' : ''
                    }`}
                  >
                    <p className="font-medium text-[#1a2744]">{a.property.name}</p>
                    <p className="text-xs text-slate-500">
                      Available ₦{Number(a.balanceAvailable).toLocaleString()} · {a._count.entries}{' '}
                      entries
                    </p>
                  </button>
                </li>
              ))}
              {accounts.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  No SC accounts yet. Create a managed property or approve a tenant onto a Terrier
                  unit.
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-4 xl:col-span-3">
            {selectedId && ledger ? (
              <>
                <div className={`${CARD} p-5`}>
                  <p className="text-sm text-slate-500">Available balance</p>
                  <p className="mt-1 text-3xl font-semibold text-[#1a2744]">
                    ₦{ledger.balanceAvailable.toLocaleString()}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Reserved ₦{ledger.balanceReserved.toLocaleString()}
                  </p>
                </div>

                <form onSubmit={credit} className={`${CARD} grid gap-3 p-5 sm:grid-cols-3`}>
                  <div className="sm:col-span-3">
                    <h3 className="text-sm font-semibold text-[#1a2744]">Post levy (credit)</h3>
                  </div>
                  <div>
                    <label className={LABEL}>Amount (₦)</label>
                    <input
                      type="number"
                      min={0.01}
                      step="0.01"
                      required
                      className={INPUT}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={LABEL}>Description</label>
                    <input
                      className={INPUT}
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      disabled={busy}
                      className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                    >
                      Credit account
                    </button>
                  </div>
                </form>

                <div className={`${CARD} overflow-x-auto`}>
                  <table className="min-w-full text-sm">
                    <thead className="border-b bg-slate-50 text-left text-slate-600">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3">Debit</th>
                        <th className="px-4 py-3">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.entries.map((e) => (
                        <tr key={e.id} className="border-b">
                          <td className="px-4 py-2 text-xs">{e.entryDate.slice(0, 10)}</td>
                          <td className="px-4 py-2">
                            {e.description}
                            {e.workOrderId ? (
                              <span className="ml-1 text-xs text-slate-400">(WO)</span>
                            ) : null}
                          </td>
                          <td className="px-4 py-2">
                            {e.debit ? `₦${e.debit.toLocaleString()}` : '—'}
                          </td>
                          <td className="px-4 py-2">
                            {e.credit ? `₦${e.credit.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))}
                      {ledger.entries.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                            No ledger entries yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className={`${CARD} p-8 text-center text-sm text-slate-500`}>
                Select a property account to view the statement and post levies.
              </div>
            )}
            <Link href="/properties-hub" className="text-sm font-medium text-[#e87722] hover:underline">
              ← Properties hub
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
