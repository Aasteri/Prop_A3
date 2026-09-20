'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Project = { id: string; name: string; location: string | null; site?: { code: string } };

type LabourLine = {
  id?: string;
  sn: number;
  description: string;
  teamTrade: string | null;
  gangLeader: string | null;
  gangSize: number | null;
  workStart: string | null;
  workEnd: string | null;
  costPerUnit: string | number | null;
  costUnit: string | null;
  totalAmount: string | number | null;
  supervisedBy: string | null;
  remark: string | null;
};

type LabourSchedule = {
  id: string;
  number: string;
  projectId: string;
  projectTitle: string | null;
  projectPhase: string | null;
  projectManager: string | null;
  sheetNo: string | null;
  scheduleDate: string | null;
  notes: string | null;
  project: { id: string; name: string; site?: { code: string } };
  lines: LabourLine[];
};

type LineForm = {
  sn: string;
  description: string;
  teamTrade: string;
  gangLeader: string;
  gangSize: string;
  workStart: string;
  workEnd: string;
  costPerUnit: string;
  costUnit: string;
  totalAmount: string;
  supervisedBy: string;
  remark: string;
};

function emptyLine(sn: number): LineForm {
  return {
    sn: String(sn),
    description: '',
    teamTrade: '',
    gangLeader: '',
    gangSize: '',
    workStart: '',
    workEnd: '',
    costPerUnit: '',
    costUnit: 'DAY',
    totalAmount: '',
    supervisedBy: '',
    remark: '',
  };
}

export default function LabourSchedulesPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [rows, setRows] = useState<LabourSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LabourSchedule | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    projectTitle: '',
    projectPhase: '',
    projectManager: '',
    sheetNo: '',
    scheduleDate: '',
    notes: '',
  });
  const [createLines, setCreateLines] = useState<LineForm[]>([emptyLine(1)]);
  const [editLines, setEditLines] = useState<LineForm[]>([emptyLine(1)]);

  const canManage =
    user?.role === 'PROJECT_MANAGER' || user?.role === 'CEO' || user?.role === 'ADMIN';

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'Select…' },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.site?.code ? `${p.site.code} · ` : ''}${p.name}`,
        keywords: p.name,
      })),
    ],
    [projects],
  );

  const costUnitOptions = useMemo(() => optionsFromValues(['DAY', 'HOUR']), []);

  const {
    query,
    setQuery,
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<LabourSchedule>({
    items: rows,
    searchKeys: [
      'number',
      'projectTitle',
      'projectPhase',
      'projectManager',
      'project.name',
      'notes',
    ],
  });

  const load = () => {
    api<LabourSchedule[]>('/labour-schedules')
      .then(setRows)
      .catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    load();
    api<Project[]>('/projects').then(setProjects).catch(console.error);
  }, [router]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    api<LabourSchedule>(`/labour-schedules/${selectedId}`)
      .then((row) => {
        setDetail(row);
        setEditLines(
          row.lines.length
            ? row.lines.map((l) => ({
                sn: String(l.sn),
                description: l.description,
                teamTrade: l.teamTrade ?? '',
                gangLeader: l.gangLeader ?? '',
                gangSize: l.gangSize != null ? String(l.gangSize) : '',
                workStart: (l.workStart ?? '').slice(0, 10),
                workEnd: (l.workEnd ?? '').slice(0, 10),
                costPerUnit: l.costPerUnit != null ? String(l.costPerUnit) : '',
                costUnit: l.costUnit ?? 'DAY',
                totalAmount: l.totalAmount != null ? String(l.totalAmount) : '',
                supervisedBy: l.supervisedBy ?? '',
                remark: l.remark ?? '',
              }))
            : [emptyLine(1)],
        );
      })
      .catch(console.error);
  }, [selectedId]);

  function updateCreateLine(i: number, patch: Partial<LineForm>) {
    setCreateLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function updateEditLine(i: number, patch: Partial<LineForm>) {
    setEditLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function serializeLines(items: LineForm[]) {
    return items
      .filter((l) => l.description.trim())
      .map((l, i) => ({
        sn: Number(l.sn) || i + 1,
        description: l.description.trim(),
        teamTrade: l.teamTrade || undefined,
        gangLeader: l.gangLeader || undefined,
        gangSize: l.gangSize ? Number(l.gangSize) : undefined,
        workStart: l.workStart || undefined,
        workEnd: l.workEnd || undefined,
        costPerUnit: l.costPerUnit ? Number(l.costPerUnit) : undefined,
        costUnit: l.costUnit || undefined,
        totalAmount: l.totalAmount ? Number(l.totalAmount) : undefined,
        supervisedBy: l.supervisedBy || undefined,
        remark: l.remark || undefined,
      }));
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const created = await api<LabourSchedule>('/labour-schedules', {
        method: 'POST',
        body: JSON.stringify({
          projectId: form.projectId,
          projectTitle: form.projectTitle || undefined,
          projectPhase: form.projectPhase || undefined,
          projectManager: form.projectManager || undefined,
          sheetNo: form.sheetNo || undefined,
          scheduleDate: form.scheduleDate || undefined,
          notes: form.notes || undefined,
          lines: serializeLines(createLines),
        }),
      });
      setShowForm(false);
      setForm({
        projectId: '',
        projectTitle: '',
        projectPhase: '',
        projectManager: '',
        sheetNo: '',
        scheduleDate: '',
        notes: '',
      });
      setCreateLines([emptyLine(1)]);
      load();
      setSelectedId(created.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create schedule');
    } finally {
      setBusy(false);
    }
  }

  async function saveLines() {
    if (!detail || !canManage) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api<LabourSchedule>(`/labour-schedules/${detail.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          projectTitle: detail.projectTitle ?? undefined,
          projectPhase: detail.projectPhase ?? undefined,
          projectManager: detail.projectManager ?? undefined,
          sheetNo: detail.sheetNo ?? undefined,
          scheduleDate: detail.scheduleDate
            ? detail.scheduleDate.slice(0, 10)
            : undefined,
          notes: detail.notes ?? undefined,
          lines: serializeLines(editLines),
        }),
      });
      setDetail(updated);
      setEditLines(
        updated.lines.length
          ? updated.lines.map((l) => ({
              sn: String(l.sn),
              description: l.description,
              teamTrade: l.teamTrade ?? '',
              gangLeader: l.gangLeader ?? '',
              gangSize: l.gangSize != null ? String(l.gangSize) : '',
              workStart: (l.workStart ?? '').slice(0, 10),
              workEnd: (l.workEnd ?? '').slice(0, 10),
              costPerUnit: l.costPerUnit != null ? String(l.costPerUnit) : '',
              costUnit: l.costUnit ?? 'DAY',
              totalAmount: l.totalAmount != null ? String(l.totalAmount) : '',
              supervisedBy: l.supervisedBy ?? '',
              remark: l.remark ?? '',
            }))
          : [emptyLine(1)],
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lines');
    } finally {
      setBusy(false);
    }
  }

  function openDetail(row: LabourSchedule) {
    setSelectedId(row.id);
    setError('');
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Projects · Labour
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Labour schedules
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                Sheet 5 gang lines: trade, leader, size, dates, cost, and supervision.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/projects-hub"
                className="rounded-lg border border-white/20 px-4 py-2 text-sm"
              >
                Projects hub
              </Link>
              {canManage && (
                <button
                  type="button"
                  onClick={() => setShowForm((v) => !v)}
                  className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white"
                >
                  {showForm ? 'Cancel' : 'New schedule'}
                </button>
              )}
            </div>
          </div>
        </header>

        {showForm && canManage && (
          <form onSubmit={onCreate} className={`${CARD} space-y-4 p-6`}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={LABEL}>Project</label>
                <SearchableSelect
                  className={INPUT}
                  required
                  options={projectOptions}
                  value={form.projectId}
                  onChange={(id) => {
                    const p = projects.find((x) => x.id === id);
                    setForm({
                      ...form,
                      projectId: id,
                      projectTitle: p?.name ?? form.projectTitle,
                    });
                  }}
                  emptyLabel="Select…"
                  placeholder="Search projects…"
                />
              </div>
              <div>
                <label className={LABEL}>Project title</label>
                <input
                  className={INPUT}
                  value={form.projectTitle}
                  onChange={(e) => setForm({ ...form, projectTitle: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Project phase</label>
                <input
                  className={INPUT}
                  value={form.projectPhase}
                  onChange={(e) => setForm({ ...form, projectPhase: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Project manager</label>
                <input
                  className={INPUT}
                  value={form.projectManager}
                  onChange={(e) => setForm({ ...form, projectManager: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Sheet no.</label>
                <input
                  className={INPUT}
                  value={form.sheetNo}
                  onChange={(e) => setForm({ ...form, sheetNo: e.target.value })}
                />
              </div>
              <div>
                <label className={LABEL}>Schedule date</label>
                <input
                  type="date"
                  className={INPUT}
                  value={form.scheduleDate}
                  onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })}
                />
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
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[#1a2744]">Line rows</h2>
                <button
                  type="button"
                  className="text-sm text-[#e87722] hover:underline"
                  onClick={() => setCreateLines((prev) => [...prev, emptyLine(prev.length + 1)])}
                >
                  Add row
                </button>
              </div>
              <div className="space-y-3">
                {createLines.map((line, i) => (
                  <div
                    key={i}
                    className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-6"
                  >
                    <div>
                      <label className={LABEL}>S/N</label>
                      <input
                        className={INPUT}
                        value={line.sn}
                        onChange={(e) => updateCreateLine(i, { sn: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className={LABEL}>Description</label>
                      <input
                        className={INPUT}
                        required={i === 0}
                        value={line.description}
                        onChange={(e) => updateCreateLine(i, { description: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Team / trade</label>
                      <input
                        className={INPUT}
                        value={line.teamTrade}
                        onChange={(e) => updateCreateLine(i, { teamTrade: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Gang leader</label>
                      <input
                        className={INPUT}
                        value={line.gangLeader}
                        onChange={(e) => updateCreateLine(i, { gangLeader: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Gang size</label>
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        value={line.gangSize}
                        onChange={(e) => updateCreateLine(i, { gangSize: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Work start</label>
                      <input
                        type="date"
                        className={INPUT}
                        value={line.workStart}
                        onChange={(e) => updateCreateLine(i, { workStart: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Work end</label>
                      <input
                        type="date"
                        className={INPUT}
                        value={line.workEnd}
                        onChange={(e) => updateCreateLine(i, { workEnd: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Cost / unit</label>
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        value={line.costPerUnit}
                        onChange={(e) => updateCreateLine(i, { costPerUnit: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Unit</label>
                      <SearchableSelect
                        className={INPUT}
                        options={costUnitOptions}
                        value={line.costUnit}
                        onChange={(v) => updateCreateLine(i, { costUnit: v })}
                        placeholder="Unit…"
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Total amount</label>
                      <input
                        type="number"
                        min={0}
                        className={INPUT}
                        value={line.totalAmount}
                        onChange={(e) => updateCreateLine(i, { totalAmount: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={LABEL}>Supervised by</label>
                      <input
                        className={INPUT}
                        value={line.supervisedBy}
                        onChange={(e) => updateCreateLine(i, { supervisedBy: e.target.value })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Create labour schedule'}
            </button>
          </form>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            {rows.length > 0 && (
              <ListToolbar
                query={query}
                onQueryChange={setQuery}
                searchPlaceholder="Search labour schedules…"
              />
            )}
            <div className={`${CARD} divide-y divide-slate-100`}>
            {pageItems.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => openDetail(r)}
                className={`block w-full px-4 py-3 text-left hover:bg-slate-50 ${
                  selectedId === r.id ? 'bg-orange-50' : ''
                }`}
              >
                <p className="font-medium text-[#1a2744]">{r.number}</p>
                <p className="text-sm text-slate-600">
                  {r.projectTitle ?? r.project.name}
                  {r.projectPhase ? ` · ${r.projectPhase}` : ''}
                </p>
                <p className="text-xs text-slate-500">
                  {r.lines?.length ?? 0} line{(r.lines?.length ?? 0) === 1 ? '' : 's'}
                  {r.scheduleDate ? ` · ${(r.scheduleDate ?? '').slice(0, 10)}` : ''}
                </p>
              </button>
            ))}
            {!rows.length && (
              <p className="px-4 py-8 text-center text-sm text-slate-500">
                No labour schedules yet.
              </p>
            )}
            </div>
            {rows.length > 0 && (
              <PaginationBar
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                filteredCount={filteredCount}
                onPageChange={setPage}
              />
            )}
          </div>

          <div className={`${CARD} p-5`}>
            {!detail ? (
              <p className="text-sm text-slate-500">Select a schedule to view lines.</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a2744]">{detail.number}</h2>
                  <p className="text-sm text-slate-600">
                    {detail.projectTitle ?? detail.project.name}
                    {detail.projectManager ? ` · PM: ${detail.projectManager}` : ''}
                  </p>
                </div>

                {canManage ? (
                  <>
                    <div className="space-y-3">
                      {editLines.map((line, i) => (
                        <div
                          key={i}
                          className="grid gap-2 rounded-lg border border-slate-200 p-3 sm:grid-cols-3"
                        >
                          <div>
                            <label className={LABEL}>S/N</label>
                            <input
                              className={INPUT}
                              value={line.sn}
                              onChange={(e) => updateEditLine(i, { sn: e.target.value })}
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className={LABEL}>Description</label>
                            <input
                              className={INPUT}
                              value={line.description}
                              onChange={(e) =>
                                updateEditLine(i, { description: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Team</label>
                            <input
                              className={INPUT}
                              value={line.teamTrade}
                              onChange={(e) =>
                                updateEditLine(i, { teamTrade: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Gang leader</label>
                            <input
                              className={INPUT}
                              value={line.gangLeader}
                              onChange={(e) =>
                                updateEditLine(i, { gangLeader: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Size</label>
                            <input
                              type="number"
                              className={INPUT}
                              value={line.gangSize}
                              onChange={(e) => updateEditLine(i, { gangSize: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Start</label>
                            <input
                              type="date"
                              className={INPUT}
                              value={line.workStart}
                              onChange={(e) =>
                                updateEditLine(i, { workStart: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={LABEL}>End</label>
                            <input
                              type="date"
                              className={INPUT}
                              value={line.workEnd}
                              onChange={(e) => updateEditLine(i, { workEnd: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Cost</label>
                            <input
                              type="number"
                              className={INPUT}
                              value={line.costPerUnit}
                              onChange={(e) =>
                                updateEditLine(i, { costPerUnit: e.target.value })
                              }
                            />
                          </div>
                          <div>
                            <label className={LABEL}>Supervised</label>
                            <input
                              className={INPUT}
                              value={line.supervisedBy}
                              onChange={(e) =>
                                updateEditLine(i, { supervisedBy: e.target.value })
                              }
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="text-sm text-[#e87722] hover:underline"
                        onClick={() =>
                          setEditLines((prev) => [...prev, emptyLine(prev.length + 1)])
                        }
                      >
                        Add row
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={saveLines}
                        className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {busy ? 'Saving…' : 'Save lines'}
                      </button>
                    </div>
                    {error && <p className="text-sm text-red-600">{error}</p>}
                  </>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="border-b text-xs uppercase text-slate-500">
                        <tr>
                          <th className="py-2 pr-3">S/N</th>
                          <th className="py-2 pr-3">Description</th>
                          <th className="py-2 pr-3">Team</th>
                          <th className="py-2 pr-3">Leader</th>
                          <th className="py-2">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.lines.map((l) => (
                          <tr key={l.id ?? l.sn} className="border-b border-slate-100">
                            <td className="py-2 pr-3">{l.sn}</td>
                            <td className="py-2 pr-3">{l.description}</td>
                            <td className="py-2 pr-3">{l.teamTrade ?? '—'}</td>
                            <td className="py-2 pr-3">{l.gangLeader ?? '—'}</td>
                            <td className="py-2">{l.gangSize ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
