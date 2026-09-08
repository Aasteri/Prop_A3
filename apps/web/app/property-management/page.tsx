'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type PropertyAsset = {
  id: string;
  code: string | null;
  name: string;
  address: string;
  category: string;
  estateName: string | null;
  landlordName: string | null;
  units: { id: string; unitCode: string; unitType: string | null }[];
  _count: { tenancies: number; maintenanceRequests: number };
};

export default function PropertyManagementPage() {
  const router = useRouter();
  const [rows, setRows] = useState<PropertyAsset[]>([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    address: '',
    code: '',
    category: 'RESIDENTIAL',
    estateName: '',
    landlordName: '',
    landlordPhone: '',
    unitCode: 'Unit 1',
    unitType: '',
  });

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}` : '';
    api<PropertyAsset[]>(`/properties${q}`).then(setRows).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, search]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/properties', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          code: form.code || undefined,
          category: form.category,
          estateName: form.estateName || undefined,
          landlordName: form.landlordName || undefined,
          landlordPhone: form.landlordPhone || undefined,
          unitCode: form.unitCode || undefined,
          unitType: form.unitType || undefined,
        }),
      });
      setShowForm(false);
      setForm({
        name: '',
        address: '',
        code: '',
        category: 'RESIDENTIAL',
        estateName: '',
        landlordName: '',
        landlordPhone: '',
        unitCode: 'Unit 1',
        unitType: '',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Properties · Management
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Managed property assets
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Register buildings and units for letting, maintenance, and remittance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
            >
              {showForm ? 'Cancel' : 'Add property'}
            </button>
          </div>
        </header>

        {showForm && (
          <form onSubmit={onSubmit} className={`${CARD} grid gap-4 p-6 sm:grid-cols-2`}>
            <div className="sm:col-span-2">
              <label className={LABEL}>Property name</label>
              <input
                className={INPUT}
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Address</label>
              <textarea
                className={INPUT}
                required
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Code</label>
              <input
                className={INPUT}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Category</label>
              <select
                className={INPUT}
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Estate</label>
              <input
                className={INPUT}
                value={form.estateName}
                onChange={(e) => setForm({ ...form, estateName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Landlord</label>
              <input
                className={INPUT}
                value={form.landlordName}
                onChange={(e) => setForm({ ...form, landlordName: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>First unit code</label>
              <input
                className={INPUT}
                value={form.unitCode}
                onChange={(e) => setForm({ ...form, unitCode: e.target.value })}
              />
            </div>
            <div>
              <label className={LABEL}>Unit type</label>
              <input
                className={INPUT}
                placeholder="e.g. 2-bed flat"
                value={form.unitType}
                onChange={(e) => setForm({ ...form, unitType: e.target.value })}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm font-medium text-white hover:bg-[#243a5e]"
              >
                Save property
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, address, estate…"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          />
          <Link href="/properties-hub" className="text-sm font-medium text-[#e87722] hover:underline self-center">
            ← Properties hub
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Units</th>
                <th className="px-4 py-3">Tenancies</th>
                <th className="px-4 py-3">Maintenance</th>
                <th className="px-4 py-3">Landlord</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#1a2744]">{r.name}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{r.address}</p>
                  </td>
                  <td className="px-4 py-3">{r.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{r.units.length}</td>
                  <td className="px-4 py-3">{r._count.tenancies}</td>
                  <td className="px-4 py-3">{r._count.maintenanceRequests}</td>
                  <td className="px-4 py-3">{r.landlordName ?? '—'}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No managed properties yet. Add the first asset to start PM workflows.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
