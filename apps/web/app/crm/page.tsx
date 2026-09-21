'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ListToolbar } from '@/components/ListToolbar';
import { SearchableSelect } from '@/components/SearchableSelect';
import { ApiError, api, getToken } from '@/lib/api';
import { INPUT, LABEL } from '@/lib/ui';

type Lead = {
  id: string;
  leadRef: string;
  firstName: string;
  lastName: string;
  phone: string;
  source: string;
  stage: string;
  listing: { listingRef: string; location: string } | null;
};

type Pipeline = {
  stages: { stage: string; label: string; count: number; leads: Lead[] }[];
  totals: { active: number; won: number; lost: number };
};

type PortalUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
};

type ClientRow = {
  id: string;
  clientRef: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  portalUser: PortalUser | null;
};

export default function CrmPipelinePage() {
  const router = useRouter();
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [linkable, setLinkable] = useState<PortalUser[]>([]);
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [mode, setMode] = useState<'existing' | 'manual'>('existing');
  const [existingUserId, setExistingUserId] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    createLogin: false,
    password: '',
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [linkBusyId, setLinkBusyId] = useState('');

  const leadMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (lead: Lead) => {
      if (!q) return true;
      const hay = [
        lead.firstName,
        lead.lastName,
        lead.leadRef,
        lead.phone,
        lead.source,
        lead.listing?.location,
        lead.listing?.listingRef,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    };
  }, [query]);

  const userOptions = useMemo(
    () =>
      linkable.map((u) => ({
        value: u.id,
        label: `${u.firstName} ${u.lastName} · ${u.email}`,
        keywords: `${u.phone ?? ''} ${u.role}`,
      })),
    [linkable],
  );

  function refreshClients() {
    return api<ClientRow[]>('/crm/clients').then(setClients);
  }

  function refreshLinkable() {
    return api<PortalUser[]>('/crm/users/linkable').then(setLinkable);
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    api<Pipeline>('/crm/pipeline').then(setPipeline).catch(console.error);
    refreshClients().catch(console.error);
    refreshLinkable().catch(console.error);
  }, [router]);

  async function submitClient(e: FormEvent) {
    e.preventDefault();
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      const body =
        mode === 'existing'
          ? { existingUserId }
          : {
              firstName: form.firstName,
              lastName: form.lastName,
              phone: form.phone,
              email: form.email || undefined,
              createLogin: form.createLogin,
              password: form.createLogin ? form.password : undefined,
            };
      const res = await api<{
        client: ClientRow;
        portalLinked: boolean;
        temporaryPassword?: string;
      }>('/crm/clients', { method: 'POST', body: JSON.stringify(body) });

      setMsg(
        res.portalLinked
          ? `Created ${res.client.clientRef} and linked portal login (${res.client.portalUser?.email ?? 'ok'}). They can use marketplace and client portal with the same account.`
          : `Created ${res.client.clientRef} without a login. Use “Link portal” when they already have a Propa3 account.`,
      );
      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        createLogin: false,
        password: '',
      });
      setExistingUserId('');
      setShowAdd(false);
      await refreshClients();
      await refreshLinkable();
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : 'Could not create client');
    } finally {
      setBusy(false);
    }
  }

  async function linkPortal(clientId: string) {
    setErr('');
    setMsg('');
    setLinkBusyId(clientId);
    try {
      await api(`/crm/clients/${clientId}/link-portal`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setMsg('Portal login linked (matched by email). User upgraded to CLIENT if they were a seeker.');
      await refreshClients();
      await refreshLinkable();
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : 'Could not link portal user');
    } finally {
      setLinkBusyId('');
    }
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#1a2744]">CRM pipeline</h1>
          {pipeline && (
            <p className="text-sm text-slate-600">
              {pipeline.totals.active} active · {pipeline.totals.won} won · {pipeline.totals.lost} lost
            </p>
          )}
        </div>
        <Link
          href="/crm/leads/new"
          className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818]"
        >
          New lead
        </Link>
      </div>

      {!pipeline ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <>
          <ListToolbar
            query={query}
            onQueryChange={setQuery}
            searchPlaceholder="Search leads in pipeline…"
          />
          <div className="flex gap-4 overflow-x-auto pb-4">
            {pipeline.stages
              .filter((s) => s.stage !== 'WON' && s.stage !== 'LOST')
              .map((col) => {
                const visibleLeads = col.leads.filter(leadMatches);
                return (
                  <div
                    key={col.stage}
                    className="min-w-[240px] flex-shrink-0 rounded-lg border border-slate-200 bg-slate-50"
                  >
                    <div className="border-b border-slate-200 px-3 py-2">
                      <p className="font-semibold text-[#1a2744]">{col.label}</p>
                      <p className="text-xs text-slate-500">
                        {query.trim() ? `${visibleLeads.length} / ${col.count}` : col.count} leads
                      </p>
                    </div>
                    <div className="space-y-2 p-2">
                      {visibleLeads.map((lead) => (
                        <Link
                          key={lead.id}
                          href={`/crm/leads/${lead.id}`}
                          className="block rounded-md border border-slate-200 bg-white p-3 text-sm hover:border-[#e87722]"
                        >
                          <p className="font-medium">
                            {lead.firstName} {lead.lastName}
                          </p>
                          <p className="text-xs text-slate-500">{lead.leadRef}</p>
                          {lead.listing && (
                            <p className="mt-1 text-xs text-slate-600">{lead.listing.location}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-[#1a2744]">Clients</h2>
            <p className="text-xs text-slate-500">
              Add from an existing Propa3 user (upgrades marketplace seekers to CLIENT) or create
              manually. One login works for portal and artisan marketplace.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAdd((v) => !v);
              setErr('');
              setMsg('');
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 text-slate-900"
          >
            {showAdd ? 'Cancel' : 'Add client'}
          </button>
        </div>

        {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
        {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

        {showAdd && (
          <form
            onSubmit={submitClient}
            className="mb-4 space-y-3 rounded-lg border border-slate-200 bg-white p-4"
          >
            <div className="flex flex-wrap gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode('existing')}
                className={`rounded-md px-3 py-1.5 ${
                  mode === 'existing'
                    ? 'bg-[#1a2744] text-white'
                    : 'border border-slate-300 text-slate-900'
                }`}
              >
                Existing user
              </button>
              <button
                type="button"
                onClick={() => setMode('manual')}
                className={`rounded-md px-3 py-1.5 ${
                  mode === 'manual'
                    ? 'bg-[#1a2744] text-white'
                    : 'border border-slate-300 text-slate-900'
                }`}
              >
                Add manually
              </button>
            </div>

            {mode === 'existing' ? (
              <div>
                <label className={LABEL}>Select marketplace seeker or unlinked user</label>
                <SearchableSelect
                  options={userOptions}
                  value={existingUserId}
                  onChange={setExistingUserId}
                  placeholder="Search by name or email…"
                  emptyLabel="No linkable users"
                  required
                />
                <p className="mt-1 text-xs text-slate-500">
                  Selecting a seeker upgrades them to CLIENT and opens the client portal — same email,
                  no new signup.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>First name</label>
                    <input
                      className={INPUT}
                      required
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Last name</label>
                    <input
                      className={INPUT}
                      required
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className={LABEL}>Phone</label>
                    <input
                      className={INPUT}
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input
                      className={INPUT}
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      If this email already belongs to a seeker, they are linked and upgraded
                      automatically.
                    </p>
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.createLogin}
                    onChange={(e) => setForm({ ...form, createLogin: e.target.checked })}
                  />
                  Create new CLIENT login (only if email is not already registered)
                </label>
                {form.createLogin && (
                  <div>
                    <label className={LABEL}>Temporary password</label>
                    <input
                      className={INPUT}
                      type="password"
                      required
                      minLength={8}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={busy || (mode === 'existing' && !existingUserId)}
              className="rounded-md bg-[#e87722] px-4 py-2 text-sm font-medium text-white hover:bg-[#d06818] disabled:opacity-60"
            >
              {busy ? 'Saving…' : 'Save client'}
            </button>
          </form>
        )}

        <div className="rounded-lg border bg-white">
          {clients.length ? (
            <ul className="divide-y">
              {clients.map((c) => (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
                >
                  <div>
                    <p>
                      <span className="font-medium">{c.clientRef}</span> — {c.firstName}{' '}
                      {c.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {c.phone}
                      {c.email ? ` · ${c.email}` : ''}
                      {c.portalUser
                        ? ` · Portal: ${c.portalUser.email}`
                        : ' · No portal login linked'}
                    </p>
                  </div>
                  {!c.portalUser && (
                    <button
                      type="button"
                      disabled={linkBusyId === c.id}
                      onClick={() => linkPortal(c.id)}
                      className="rounded-md border border-slate-300 px-2.5 py-1 text-xs hover:bg-slate-50 disabled:opacity-60 text-slate-900"
                      title="Match by client email to an existing user"
                    >
                      {linkBusyId === c.id ? 'Linking…' : 'Link portal by email'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-slate-500">
              No clients yet. Convert a won lead, or add a client above.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
