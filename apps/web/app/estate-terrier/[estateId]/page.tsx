'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, ApiError, getToken, getUser, type AuthUser } from '@/lib/api';

type TerrierRow = {
  id: string;
  serialNo: number;
  propertyType: string;
  location: string;
  tenantName: string | null;
  tenantPhone: string | null;
  rentPaidFixed: string | null;
  rentAmountNgn: number | null;
  paymentMode: string | null;
  datePaid: string | null;
  tenancyStart: string | null;
  tenancyEnd: string | null;
  cautionDeposit: number | null;
  serviceCharge: number | null;
  expenseDescription: string | null;
  expenseAmount: number;
  netRentalIncome: number;
};

type Register = {
  estate: { id: string; title: string; code: string; name: string };
  rows: TerrierRow[];
  summary: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    totalRent: number;
    totalExpenses: number;
    totalNetIncome: number;
    upcomingTerminations: { id: string; serialNo: number; tenantName: string | null; tenancyEnd: string }[];
  };
};

const INPUT = 'rounded border border-slate-300 px-2 py-1 text-xs w-full min-w-[80px]';

export default function EstateTerrierRegisterPage() {
  const { estateId } = useParams<{ estateId: string }>();
  const router = useRouter();
  const [data, setData] = useState<Register | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<TerrierRow>>({});
  const [error, setError] = useState('');

  async function load() {
    const result = await api<Register>(`/estate-terrier/estates/${estateId}`);
    setData(result);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load().catch(() => router.push('/estate-terrier'));
  }, [estateId, router]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' ||
    user?.role === 'FINANCE' ||
    user?.role === 'CEO' ||
    user?.role === 'ADMIN';

  function startEdit(row: TerrierRow) {
    setEditId(row.id);
    setDraft({ ...row });
  }

  async function saveRow() {
    if (!editId) return;
    setError('');
    try {
      await api(`/estate-terrier/rows/${editId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          propertyType: draft.propertyType,
          location: draft.location,
          tenantName: draft.tenantName || undefined,
          tenantPhone: draft.tenantPhone || undefined,
          rentPaidFixed: draft.rentPaidFixed || undefined,
          rentAmountNgn: draft.rentAmountNgn ?? undefined,
          paymentMode: draft.paymentMode || undefined,
          datePaid: draft.datePaid?.slice(0, 10) || undefined,
          tenancyStart: draft.tenancyStart?.slice(0, 10) || undefined,
          tenancyEnd: draft.tenancyEnd?.slice(0, 10) || undefined,
          cautionDeposit: draft.cautionDeposit ?? undefined,
          serviceCharge: draft.serviceCharge ?? undefined,
          expenseDescription: draft.expenseDescription || undefined,
          expenseAmount: draft.expenseAmount ?? undefined,
        }),
      });
      setEditId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    }
  }

  async function vacate(rowId: string) {
    if (!confirm('Clear tenant from this unit?')) return;
    await api(`/estate-terrier/rows/${rowId}/vacate`, { method: 'POST', body: '{}' });
    await load();
  }

  if (!data) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link href="/estate-terrier" className="text-sm text-[#e87722] hover:underline">
        ← All estates
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-[#1a2744]">{data.estate.title}</h1>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Occupancy" value={`${data.summary.occupancyRate}% (${data.summary.occupiedUnits}/${data.summary.totalUnits})`} />
        <Stat label="Total rent" value={`₦${data.summary.totalRent.toLocaleString()}`} />
        <Stat label="Total expenses" value={`₦${data.summary.totalExpenses.toLocaleString()}`} />
        <Stat label="Net rental income" value={`₦${data.summary.totalNetIncome.toLocaleString()}`} />
      </div>

      {data.summary.upcomingTerminations.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <strong>Terminations within 60 days:</strong>{' '}
          {data.summary.upcomingTerminations
            .map((t) => `#${t.serialNo} ${t.tenantName} (${new Date(t.tenancyEnd).toLocaleDateString()})`)
            .join(' · ')}
        </div>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-[1400px] text-xs">
          <thead className="border-b border-slate-200 bg-[#1a2744] text-left text-white">
            <tr>
              <th className="px-2 py-2">S/NO</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Location</th>
              <th className="px-2 py-2">Tenant</th>
              <th className="px-2 py-2">Phone</th>
              <th className="px-2 py-2">Paid/Fixed</th>
              <th className="px-2 py-2">Rent (₦)</th>
              <th className="px-2 py-2">Payment mode</th>
              <th className="px-2 py-2">Date paid</th>
              <th className="px-2 py-2">Start</th>
              <th className="px-2 py-2">End</th>
              <th className="px-2 py-2">Caution</th>
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Expense desc</th>
              <th className="px-2 py-2">Expense ₦</th>
              <th className="px-2 py-2">Net income</th>
              {canManage && <th className="px-2 py-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const editing = editId === row.id;
              return (
                <tr key={row.id} className="border-b border-slate-100 align-top">
                  <td className="px-2 py-2">{row.serialNo}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.propertyType ?? ''} onChange={(e) => setDraft((d) => ({ ...d, propertyType: e.target.value }))} /> : row.propertyType}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.location ?? ''} onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))} /> : row.location}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.tenantName ?? ''} onChange={(e) => setDraft((d) => ({ ...d, tenantName: e.target.value }))} /> : (row.tenantName ?? '—')}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.tenantPhone ?? ''} onChange={(e) => setDraft((d) => ({ ...d, tenantPhone: e.target.value }))} /> : (row.tenantPhone ?? '—')}</td>
                  <td className="px-2 py-2">
                    {editing ? (
                      <select className={INPUT} value={draft.rentPaidFixed ?? ''} onChange={(e) => setDraft((d) => ({ ...d, rentPaidFixed: e.target.value }))}>
                        <option value="">—</option>
                        <option value="PAID">Paid</option>
                        <option value="FIXED">Fixed</option>
                      </select>
                    ) : (
                      row.rentPaidFixed ?? '—'
                    )}
                  </td>
                  <td className="px-2 py-2">{editing ? <input type="number" className={INPUT} value={draft.rentAmountNgn ?? ''} onChange={(e) => setDraft((d) => ({ ...d, rentAmountNgn: Number(e.target.value) }))} /> : (row.rentAmountNgn != null ? row.rentAmountNgn.toLocaleString() : '—')}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.paymentMode ?? ''} onChange={(e) => setDraft((d) => ({ ...d, paymentMode: e.target.value }))} /> : (row.paymentMode ?? '—')}</td>
                  <td className="px-2 py-2">{editing ? <input type="date" className={INPUT} value={draft.datePaid?.slice(0, 10) ?? ''} onChange={(e) => setDraft((d) => ({ ...d, datePaid: e.target.value }))} /> : fmtDate(row.datePaid)}</td>
                  <td className="px-2 py-2">{editing ? <input type="date" className={INPUT} value={draft.tenancyStart?.slice(0, 10) ?? ''} onChange={(e) => setDraft((d) => ({ ...d, tenancyStart: e.target.value }))} /> : fmtDate(row.tenancyStart)}</td>
                  <td className="px-2 py-2">{editing ? <input type="date" className={INPUT} value={draft.tenancyEnd?.slice(0, 10) ?? ''} onChange={(e) => setDraft((d) => ({ ...d, tenancyEnd: e.target.value }))} /> : fmtDate(row.tenancyEnd)}</td>
                  <td className="px-2 py-2">{editing ? <input type="number" className={INPUT} value={draft.cautionDeposit ?? ''} onChange={(e) => setDraft((d) => ({ ...d, cautionDeposit: Number(e.target.value) }))} /> : fmtMoney(row.cautionDeposit)}</td>
                  <td className="px-2 py-2">{editing ? <input type="number" className={INPUT} value={draft.serviceCharge ?? ''} onChange={(e) => setDraft((d) => ({ ...d, serviceCharge: Number(e.target.value) }))} /> : fmtMoney(row.serviceCharge)}</td>
                  <td className="px-2 py-2">{editing ? <input className={INPUT} value={draft.expenseDescription ?? ''} onChange={(e) => setDraft((d) => ({ ...d, expenseDescription: e.target.value }))} /> : (row.expenseDescription ?? '—')}</td>
                  <td className="px-2 py-2">{editing ? <input type="number" className={INPUT} value={draft.expenseAmount ?? ''} onChange={(e) => setDraft((d) => ({ ...d, expenseAmount: Number(e.target.value) }))} /> : row.expenseAmount.toLocaleString()}</td>
                  <td className="px-2 py-2 font-medium">{row.netRentalIncome.toLocaleString()}</td>
                  {canManage && (
                    <td className="px-2 py-2 whitespace-nowrap">
                      {editing ? (
                        <>
                          <button type="button" onClick={saveRow} className="text-green-700 hover:underline">Save</button>
                          {' · '}
                          <button type="button" onClick={() => setEditId(null)} className="text-slate-500 hover:underline">Cancel</button>
                        </>
                      ) : (
                        <>
                          <button type="button" onClick={() => startEdit(row)} className="text-[#e87722] hover:underline">Edit</button>
                          {row.tenantName && (
                            <>
                              {' · '}
                              <button type="button" onClick={() => vacate(row.id)} className="text-red-600 hover:underline">Vacate</button>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-semibold text-[#1a2744]">{value}</p>
    </div>
  );
}

function fmtDate(v: string | null) {
  return v ? new Date(v).toLocaleDateString() : '—';
}

function fmtMoney(v: number | null) {
  return v != null ? v.toLocaleString() : '—';
}
