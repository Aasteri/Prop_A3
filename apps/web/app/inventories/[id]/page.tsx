'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { api, getToken } from '@/lib/api';
import { CARD, INPUT, PAGE_HEADER } from '@/lib/ui';

type LineItem = {
  id: string;
  label: string;
  moveInDefects: string;
  moveOutDefects: string;
  comments: string;
  cost: number;
};

type Section = { id: string; name: string; items: LineItem[] };

type RoomsMatrix = {
  abbreviations?: { code: string; meaning: string }[];
  sections: Section[];
};

type InventoryDetail = {
  id: string;
  number: string;
  kind: string;
  status: string;
  inspectedAt: string;
  inspectedBy: string | null;
  discrepancyDeadline: string | null;
  frontDoorKeys: number | null;
  backDoorKeys: number | null;
  electricReading: string | null;
  waterReading: string | null;
  photoEvidence: boolean;
  roomsJson: RoomsMatrix | null;
  tenancy: {
    id: string;
    tenantName: string;
    status: string;
    property: { id: string; name: string };
    unit: { unitCode: string } | null;
  };
  preMoveMaintenance: {
    id: string;
    number: string;
    status: string;
    component: string | null;
    estimatedCost: string | number | null;
  }[];
};

export default function InventoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [row, setRow] = useState<InventoryDetail | null>(null);
  const [rooms, setRooms] = useState<RoomsMatrix | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sectionIdx, setSectionIdx] = useState(0);

  async function load() {
    const data = await api<InventoryDetail>(`/inventories/${id}`);
    setRow(data);
    setRooms(
      data.roomsJson?.sections?.length
        ? data.roomsJson
        : (await api<{ emptyMatrix: RoomsMatrix }>('/inventories/meta')).emptyMatrix,
    );
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    load().catch(() => router.push('/inventories'));
  }, [id, router]);

  function updateItem(si: number, ii: number, patch: Partial<LineItem>) {
    if (!rooms) return;
    const next = structuredClone(rooms);
    next.sections[si].items[ii] = { ...next.sections[si].items[ii], ...patch };
    setRooms(next);
  }

  async function save(e?: FormEvent) {
    e?.preventDefault();
    if (!rooms) return;
    setBusy(true);
    setError('');
    try {
      await api(`/inventories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ roomsJson: rooms }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setBusy(false);
    }
  }

  async function complete() {
    setBusy(true);
    setError('');
    try {
      await save();
      await api(`/inventories/${id}/complete`, {
        method: 'PATCH',
        body: JSON.stringify({
          landlordSigned: true,
          tenantSigned: true,
          spawnPreMoveRepairs: true,
        }),
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Complete failed');
    } finally {
      setBusy(false);
    }
  }

  if (!row || !rooms) {
    return (
      <AppShell>
        <p className="text-slate-500">Loading…</p>
      </AppShell>
    );
  }

  const section = rooms.sections[sectionIdx];
  const editable = row.status === 'DRAFT';

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Doc 9 · Inventory matrix
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{row.number}</h1>
              <p className="mt-2 text-sm text-slate-200/90">
                {row.kind.replace(/_/g, ' ')} · {row.tenancy.tenantName} ·{' '}
                {row.tenancy.property.name}
                {row.tenancy.unit ? ` · ${row.tenancy.unit.unitCode}` : ''} · {row.status}
              </p>
              {row.discrepancyDeadline && (
                <p className="mt-1 text-xs text-amber-200">
                  Discrepancy deadline {row.discrepancyDeadline.slice(0, 10)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/inventories"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
              >
                ← List
              </Link>
              {editable && (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => save()}
                    className="rounded-lg border border-white/30 px-4 py-2 text-sm"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={complete}
                    className="rounded-lg bg-[#e87722] px-4 py-2 text-sm text-white"
                  >
                    Complete & spawn repairs
                  </button>
                </>
              )}
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {rooms.sections.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSectionIdx(i)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                i === sectionIdx
                  ? 'bg-[#1a2744] text-white'
                  : 'bg-white text-slate-700 border border-slate-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        <div className={`${CARD} overflow-x-auto p-0`}>
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">{section?.name ?? 'Section'}</th>
                <th className="px-3 py-2 font-medium">Move-in defects</th>
                <th className="px-3 py-2 font-medium">Move-out defects</th>
                <th className="px-3 py-2 font-medium">Comments</th>
                <th className="px-3 py-2 font-medium">Cost (₦)</th>
              </tr>
            </thead>
            <tbody>
              {section?.items.map((item, ii) => (
                <tr key={item.id} className="border-b border-slate-100 align-top">
                  <td className="px-3 py-2 font-medium text-[#1a2744]">{item.label}</td>
                  {(['moveInDefects', 'moveOutDefects', 'comments'] as const).map((field) => (
                    <td key={field} className="px-3 py-2">
                      {editable ? (
                        <input
                          className={INPUT}
                          value={item[field]}
                          onChange={(e) =>
                            updateItem(sectionIdx, ii, { [field]: e.target.value })
                          }
                          placeholder={field === 'moveInDefects' ? '✓ / RP / …' : ''}
                        />
                      ) : (
                        <span className="text-slate-700">{item[field] || '—'}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    {editable ? (
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        value={item.cost || ''}
                        onChange={(e) =>
                          updateItem(sectionIdx, ii, {
                            cost: Number(e.target.value) || 0,
                          })
                        }
                      />
                    ) : (
                      Number(item.cost).toLocaleString()
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rooms.abbreviations && (
          <p className="text-xs text-slate-500">
            Abbreviations:{' '}
            {rooms.abbreviations.map((a) => `${a.code}=${a.meaning}`).join(' · ')}
          </p>
        )}

        {row.preMoveMaintenance?.length > 0 && (
          <div className={`${CARD} p-4 space-y-2`}>
            <h2 className="font-semibold text-[#1a2744]">Pre-move-in repairs (G.8)</h2>
            {row.preMoveMaintenance.map((m) => (
              <div key={m.id} className="flex flex-wrap justify-between gap-2 text-sm">
                <span>
                  {m.number} · {m.component} · {m.status}
                </span>
                <span>
                  {m.estimatedCost != null
                    ? `₦${Number(m.estimatedCost).toLocaleString()}`
                    : ''}
                  {' · '}
                  <Link href="/maintenance" className="text-[#e87722] hover:underline">
                    Maintenance
                  </Link>
                </span>
              </div>
            ))}
            <p className="text-xs text-slate-500">
              Tenancy status: {row.tenancy.status}. Activate occupancy from Tenancies after repairs
              close (or waiver).
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
