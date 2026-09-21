'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MarketplaceShell } from '@/components/MarketplaceShell';
import { api, getToken } from '@/lib/api';
import {
  clearMarketplaceDraft,
  hasPendingMarketplaceDraft,
  loadMarketplaceDraft,
  saveMarketplaceDraft,
  type MarketplaceJobDraft,
} from '@/lib/marketplace-draft';
import { PaginationBar } from '@/components/ListToolbar';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type CatalogItem = {
  id: string;
  code: string;
  category: string;
  label: string;
  description: string | null;
};

export function MarketplaceClient({
  initialItems,
}: {
  initialItems: CatalogItem[];
}) {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [draftPending, setDraftPending] = useState(false);
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [selected, setSelected] = useState<CatalogItem | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationText, setLocationText] = useState('');
  const [addressText, setAddressText] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const autoSubmitTried = useRef(false);

  const refreshAuth = useCallback(() => {
    setAuthed(Boolean(getToken()));
    setDraftPending(hasPendingMarketplaceDraft());
  }, []);

  useEffect(() => {
    refreshAuth();
    const onFocus = () => refreshAuth();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refreshAuth]);

  useEffect(() => {
    api<CatalogItem[]>(`/marketplace/catalog${q ? `?q=${encodeURIComponent(q)}` : ''}`)
      .then(setItems)
      .catch(() => setItems([]));
  }, [q]);

  // Restore draft after signup/login
  useEffect(() => {
    const draft = loadMarketplaceDraft();
    if (!draft) return;
    setDraftPending(true);
    applyDraftToForm(draft, items);
  }, [items]);

  function applyDraftToForm(draft: MarketplaceJobDraft, catalog: CatalogItem[]) {
    const match = catalog.find((i) => i.id === draft.catalogItemId);
    if (match) setSelected(match);
    else {
      setSelected({
        id: draft.catalogItemId,
        code: '',
        category: draft.catalogCategory,
        label: draft.catalogLabel,
        description: null,
      });
    }
    setTitle(draft.title);
    setDescription(draft.description);
    setLocationText(draft.locationText);
    setAddressText(draft.addressText);
  }

  const {
    page,
    setPage,
    pageItems,
    filteredCount,
    pageCount,
    pageSize,
  } = useFilteredList<CatalogItem>({
    items,
    searchKeys: ['label', 'category', 'code', 'description'],
    pageSize: 20,
  });

  const grouped = useMemo(() => {
    const map = new Map<string, CatalogItem[]>();
    for (const item of pageItems) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [pageItems]);

  function persistDraft() {
    if (!selected) return;
    saveMarketplaceDraft({
      catalogItemId: selected.id,
      catalogLabel: selected.label,
      catalogCategory: selected.category,
      title: title || selected.label,
      description,
      locationText,
      addressText,
    });
    setDraftPending(true);
  }

  async function createJobFromForm(override?: MarketplaceJobDraft) {
    const catalogItemId = override?.catalogItemId ?? selected?.id;
    const jobTitle = override?.title ?? (title || selected?.label);
    const jobDescription = override?.description ?? description;
    const jobLocation = override?.locationText ?? locationText;
    const jobAddress = override?.addressText ?? addressText;

    if (!catalogItemId) {
      setError('Select a job type from the catalog');
      return;
    }
    if (!jobDescription?.trim()) {
      setError('Please describe the work before submitting');
      return;
    }
    setLoading(true);
    setError('');
    setOk('');
    try {
      const job = await api<{ id: string; publicId: string }>('/marketplace/jobs', {
        method: 'POST',
        body: JSON.stringify({
          catalogItemId,
          title: jobTitle || 'Job request',
          description: jobDescription,
          locationText: jobLocation,
          addressText: jobAddress,
        }),
      });
      clearMarketplaceDraft();
      setDraftPending(false);
      setOk(`Request submitted (${job.publicId}). Admin will assign artisans to quote.`);
      router.push(`/marketplace/jobs/${job.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit');
      setLoading(false);
      autoSubmitTried.current = false;
    }
  }

  // After return from signup/login with a draft → auto-submit once
  useEffect(() => {
    if (autoSubmitTried.current) return;
    if (!authed) return;
    if (!hasPendingMarketplaceDraft()) return;
    const draft = loadMarketplaceDraft();
    if (!draft?.description?.trim() || !draft.catalogItemId) return;
    // Wait until form has been hydrated from draft (selected matches)
    if (!selected || selected.id !== draft.catalogItemId) return;
    autoSubmitTried.current = true;
    setOk('Welcome back — submitting your saved request…');
    void createJobFromForm(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when auth + draft ready
  }, [authed, selected]);

  async function submitJob(e: FormEvent) {
    e.preventDefault();
    setError('');
    setOk('');
    if (!selected) {
      setError('Select a job type from the catalog');
      return;
    }
    if (!getToken()) {
      persistDraft();
      router.push('/marketplace/register?next=/marketplace');
      return;
    }
    await createJobFromForm();
  }

  function goLogin() {
    persistDraft();
    router.push('/login?next=/marketplace');
  }

  return (
    <MarketplaceShell
      onBeforeRegister={persistDraft}
      onBeforeLogin={persistDraft}
      onAuthChange={refreshAuth}
    >
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section>
          <h1 className={PAGE_HEADER}>What do you need done?</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Search every common job type, fill the form, and Triple A assigns approved artisans to quote.
            Only the <strong>workmanship / job fee</strong> is paid into Propa3 escrow (platform fee{' '}
            typically 2.5%). Materials are paid directly to the worker. Property clients use the same
            login — no second account.
          </p>
          {authed && (
            <p className="mt-2 text-sm">
              <Link href="/marketplace/requests" className="font-medium text-[#e87722] hover:underline">
                View my requests →
              </Link>
            </p>
          )}
          {draftPending && !authed && (
            <p className="mt-2 text-sm text-amber-800">
              Your request draft is saved. Sign up or log in and we’ll submit it for you.
            </p>
          )}
          <input
            className={`${INPUT} mt-4 max-w-md`}
            placeholder="Search plumbing, AC, tiling, solar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className={`${CARD} max-h-[70vh] overflow-y-auto p-4`}>
            {grouped.map(([category, list]) => (
              <div key={category} className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {category}
                </p>
                <ul className="space-y-1">
                  {list.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(item);
                          setTitle(item.label);
                        }}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                          selected?.id === item.id
                            ? 'bg-[#1a2744] text-white'
                            : 'hover:bg-slate-100'
                        }`}
                      >
                        <span className="font-medium">{item.label}</span>
                        {item.description && (
                          <span className="mt-0.5 block text-xs opacity-80">{item.description}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {!items.length && <p className="text-sm text-slate-500">No matches.</p>}
            {items.length > 0 && (
              <PaginationBar
                page={page}
                pageCount={pageCount}
                pageSize={pageSize}
                filteredCount={filteredCount}
                onPageChange={setPage}
              />
            )}
          </section>

          <section className={`${CARD} p-5`}>
            <h2 className="text-lg font-semibold text-[#1a2744]">Request form</h2>
            {!selected ? (
              <p className="mt-3 text-sm text-slate-500">Select a job type on the left.</p>
            ) : (
              <form onSubmit={submitJob} className="mt-4 space-y-3">
                <div>
                  <label className={LABEL}>Selected</label>
                  <p className="text-sm font-medium">
                    {selected.category} · {selected.label}
                  </p>
                </div>
                <div>
                  <label className={LABEL}>Title</label>
                  <input
                    className={INPUT}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Describe the work</label>
                  <textarea
                    className={INPUT}
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={LABEL}>Area / landmark (optional)</label>
                  <input
                    className={INPUT}
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="e.g. Guzape near Apo"
                  />
                </div>
                <div>
                  <label className={LABEL}>Full address (optional — shared after escrow payment)</label>
                  <input
                    className={INPUT}
                    value={addressText}
                    onChange={(e) => setAddressText(e.target.value)}
                    placeholder="Street / plot — unlocked in chat after you pay job fee"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {ok && <p className="text-sm text-emerald-700">{ok}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-[#e87722] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading
                    ? 'Submitting…'
                    : authed
                      ? 'Submit request'
                      : 'Save & sign up to submit'}
                </button>
                {!authed && (
                  <p className="text-xs text-slate-500">
                    Your form is saved on this device. After signup you’ll return here and we’ll submit
                    it automatically. Already have a Propa3 account (including property clients)?{' '}
                    <button type="button" className="text-[#e87722] underline" onClick={goLogin}>
                      Log in
                    </button>
                  </p>
                )}
              </form>
            )}
          </section>
        </div>
      </div>
    </MarketplaceShell>
  );
}
