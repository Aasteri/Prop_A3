'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { AttachmentLinks } from '@/components/AttachmentLinks';
import { ListToolbar, PaginationBar } from '@/components/ListToolbar';
import { PhotoAttachField } from '@/components/PhotoAttachField';
import { SearchableSelect, optionsFromValues } from '@/components/SearchableSelect';
import { api, getToken, uploadPhotos } from '@/lib/api';
import { useFilteredList } from '@/lib/use-filtered-list';
import { CARD, INPUT, LABEL, PAGE_HEADER } from '@/lib/ui';

type Artisan = {
  id: string;
  fullName: string;
  phone: string;
  businessName: string | null;
  trades: string[] | null;
  status: string;
  avgRating: string | number | null;
  guarantorName: string | null;
  kycDocumentUrls?: string[] | null;
};

type ServiceReq = {
  id: string;
  number: string;
  tradeCode: string;
  description: string;
  component: string;
  workRequired: string;
  status: string;
  labourAmount: string | number | null;
  materialsAmount: string | number | null;
  platformFee: string | number | null;
  photoUrls?: string[] | null;
  artisan: { id: string; fullName: string; phone: string } | null;
};

const TRADES = [
  'plumber',
  'electrician',
  'carpenter',
  'mason',
  'welder',
  'gypsum',
  'solar',
  'painter',
  'other',
];

export default function ServicesProcurementPage() {
  const router = useRouter();
  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [requests, setRequests] = useState<ServiceReq[]>([]);

  const tradeOptions = useMemo(() => optionsFromValues(TRADES), []);

  const artisanList = useFilteredList<Artisan>({
    items: artisans,
    searchKeys: ['fullName', 'phone', 'businessName', 'status', (a) => (a.trades ?? []).join(' ')],
  });

  const requestList = useFilteredList<ServiceReq>({
    items: requests,
    searchKeys: [
      'number',
      'tradeCode',
      'description',
      'component',
      'workRequired',
      'status',
      (r) => r.artisan?.fullName ?? '',
    ],
  });
  const [tab, setTab] = useState<'requests' | 'artisans'>('requests');
  const [showArtisan, setShowArtisan] = useState(false);
  const [showReq, setShowReq] = useState(false);
  const [error, setError] = useState('');
  const [artisanForm, setArtisanForm] = useState({
    fullName: '',
    phone: '',
    businessName: '',
    address: '',
    guarantorName: '',
    guarantorPhone: '',
    trades: 'plumber',
  });
  const [reqForm, setReqForm] = useState({
    tradeCode: 'plumber',
    description: '',
    component: '',
    workRequired: '',
  });
  const [reqPhotos, setReqPhotos] = useState<File[]>([]);
  const [kycDocs, setKycDocs] = useState<File[]>([]);

  const load = () => {
    api<Artisan[]>('/artisans').then(setArtisans).catch(console.error);
    api<ServiceReq[]>('/service-requests').then(setRequests).catch(console.error);
  };

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    const t = new URLSearchParams(window.location.search).get('tab');
    if (t === 'artisans' || t === 'requests') setTab(t);
    load();
  }, [router]);

  async function saveArtisan(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const kycDocumentUrls = kycDocs.length ? await uploadPhotos(kycDocs) : undefined;
      await api('/artisans', {
        method: 'POST',
        body: JSON.stringify({
          ...artisanForm,
          businessName: artisanForm.businessName || undefined,
          address: artisanForm.address || undefined,
          trades: [artisanForm.trades],
          kycDocumentUrls,
        }),
      });
      setShowArtisan(false);
      setKycDocs([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function approveArtisan(id: string) {
    await api(`/artisans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    load();
  }

  async function saveRequest(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (!reqPhotos.length) {
        setError('Attach at least one photo of the work needed.');
        return;
      }
      const photoUrls = await uploadPhotos(reqPhotos);
      await api('/service-requests', {
        method: 'POST',
        body: JSON.stringify({
          tradeCode: reqForm.tradeCode,
          description: reqForm.description,
          component: reqForm.component,
          workRequired: reqForm.workRequired,
          photoUrls,
        }),
      });
      setShowReq(false);
      setReqPhotos([]);
      setReqForm({
        tradeCode: 'plumber',
        description: '',
        component: '',
        workRequired: '',
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function assign(req: ServiceReq) {
    const approved = artisans.filter((a) => a.status === 'APPROVED');
    if (!approved.length) {
      alert('Approve an artisan first');
      return;
    }
    const artisanId =
      approved.length === 1
        ? approved[0].id
        : window.prompt(
            approved.map((a) => `${a.id} — ${a.fullName}`).join('\n'),
            approved[0].id,
          );
    if (!artisanId) return;
    await api(`/service-requests/${req.id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ artisanId }),
    });
    load();
  }

  async function estimate(req: ServiceReq) {
    const labour = Number(window.prompt('Labour amount (₦)', '0') || 0);
    const materials = Number(window.prompt('Materials amount (₦)', '0') || 0);
    await api(`/service-requests/${req.id}/estimate`, {
      method: 'PATCH',
      body: JSON.stringify({ labourAmount: labour, materialsAmount: materials }),
    });
    load();
  }

  async function approveReq(id: string) {
    await api(`/service-requests/${id}/approve`, { method: 'PATCH' });
    load();
  }

  async function confirm(id: string) {
    const rating = Number(window.prompt('Tenant rating 1–5', '5') || 5);
    await api(`/service-requests/${id}/confirm`, {
      method: 'PATCH',
      body: JSON.stringify({ tenantSatisfied: true, tenantRating: rating }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <header className={PAGE_HEADER}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#e87722]">
            Procurement · Services
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Artisans & service requests
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-200/90">
                KYC artisans, photo service requests, estimate → confirm. Platform fee = 2.5% of
                labour only.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('artisans');
                  setShowArtisan(true);
                }}
                className="rounded-lg border border-white/30 px-3 py-2 text-sm text-white"
              >
                Add artisan
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('requests');
                  setShowReq(true);
                }}
                className="rounded-lg bg-[#e87722] px-3 py-2 text-sm font-medium text-white"
              >
                New service request
              </button>
            </div>
          </div>
        </header>

        <div className="flex gap-2 text-sm">
          <button
            type="button"
            onClick={() => setTab('requests')}
            className={`rounded-md px-3 py-1.5 ${tab === 'requests' ? 'bg-[#1a2744] text-white' : 'bg-white border'}`}
          >
            Requests
          </button>
          <button
            type="button"
            onClick={() => setTab('artisans')}
            className={`rounded-md px-3 py-1.5 ${tab === 'artisans' ? 'bg-[#1a2744] text-white' : 'bg-white border'}`}
          >
            Artisans
          </button>
          <Link href="/procurement" className="self-center text-[#e87722] hover:underline ml-2">
            ← Hub
          </Link>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {showArtisan && (
          <form onSubmit={saveArtisan} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Full name</label>
              <input className={INPUT} required value={artisanForm.fullName} onChange={(e) => setArtisanForm({ ...artisanForm, fullName: e.target.value })} />
            </div>
            <div>
              <label className={LABEL}>Phone</label>
              <input className={INPUT} required value={artisanForm.phone} onChange={(e) => setArtisanForm({ ...artisanForm, phone: e.target.value })} />
            </div>
            <div>
              <label className={LABEL}>Trade</label>
              <SearchableSelect
                className={INPUT}
                options={tradeOptions}
                value={artisanForm.trades}
                onChange={(v) => setArtisanForm({ ...artisanForm, trades: v })}
                placeholder="Trade…"
              />
            </div>
            <div>
              <label className={LABEL}>Business name</label>
              <input className={INPUT} value={artisanForm.businessName} onChange={(e) => setArtisanForm({ ...artisanForm, businessName: e.target.value })} />
            </div>
            <div>
              <label className={LABEL}>Guarantor name</label>
              <input className={INPUT} required value={artisanForm.guarantorName} onChange={(e) => setArtisanForm({ ...artisanForm, guarantorName: e.target.value })} />
            </div>
            <div>
              <label className={LABEL}>Guarantor phone</label>
              <input className={INPUT} required value={artisanForm.guarantorPhone} onChange={(e) => setArtisanForm({ ...artisanForm, guarantorPhone: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <PhotoAttachField
                label="KYC documents"
                hint="Optional · ID, CAC, or trade certificate (images / PDF)"
                files={kycDocs}
                onChange={setKycDocs}
                maxFiles={6}
              />
            </div>
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white">Save KYC</button>
              <button type="button" onClick={() => setShowArtisan(false)} className="rounded-lg border px-4 py-2 text-sm text-slate-900">Cancel</button>
            </div>
          </form>
        )}

        {showReq && (
          <form onSubmit={saveRequest} className={`${CARD} grid gap-3 p-6 sm:grid-cols-2`}>
            <div>
              <label className={LABEL}>Trade required</label>
              <SearchableSelect
                className={INPUT}
                options={tradeOptions}
                value={reqForm.tradeCode}
                onChange={(v) => setReqForm({ ...reqForm, tradeCode: v })}
                placeholder="Trade…"
              />
            </div>
            <div>
              <label className={LABEL}>Component</label>
              <input className={INPUT} required value={reqForm.component} onChange={(e) => setReqForm({ ...reqForm, component: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Description</label>
              <textarea className={INPUT} required rows={2} value={reqForm.description} onChange={(e) => setReqForm({ ...reqForm, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className={LABEL}>Work required</label>
              <textarea className={INPUT} required rows={2} value={reqForm.workRequired} onChange={(e) => setReqForm({ ...reqForm, workRequired: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <PhotoAttachField
                label="Photos of the issue"
                required
                files={reqPhotos}
                onChange={setReqPhotos}
                maxFiles={6}
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
            <div className="sm:col-span-2 flex gap-2">
              <button type="submit" className="rounded-lg bg-[#1a2744] px-4 py-2 text-sm text-white">Submit</button>
              <button type="button" onClick={() => setShowReq(false)} className="rounded-lg border px-4 py-2 text-sm text-slate-900">Cancel</button>
            </div>
          </form>
        )}

        {tab === 'artisans' && (
          <>
            {artisans.length > 0 && (
              <ListToolbar
                query={artisanList.query}
                onQueryChange={artisanList.setQuery}
                searchPlaceholder="Search artisans…"
              />
            )}
          <div className="space-y-3">
            {artisanList.pageItems.map((a) => (
              <div key={a.id} className={`${CARD} flex flex-wrap items-center justify-between gap-3 p-4`}>
                <div>
                  <p className="font-semibold text-[#1a2744]">{a.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {a.phone} · {a.status}
                    {Array.isArray(a.trades) ? ` · ${(a.trades as string[]).join(', ')}` : ''}
                    {a.avgRating != null ? ` · ★ ${Number(a.avgRating).toFixed(1)}` : ''}
                  </p>
                  <AttachmentLinks urls={a.kycDocumentUrls} label="KYC documents" />
                </div>
                {a.status === 'PENDING_REVIEW' && (
                  <button type="button" onClick={() => approveArtisan(a.id)} className="rounded-md bg-green-700 px-3 py-1.5 text-xs text-white">
                    Approve
                  </button>
                )}
              </div>
            ))}
            {artisans.length === 0 && <div className={`${CARD} p-6 text-center text-sm text-slate-500`}>No artisans yet.</div>}
          </div>
            {artisans.length > 0 && (
              <PaginationBar
                page={artisanList.page}
                pageCount={artisanList.pageCount}
                pageSize={artisanList.pageSize}
                filteredCount={artisanList.filteredCount}
                onPageChange={artisanList.setPage}
              />
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {requests.length > 0 && (
              <ListToolbar
                query={requestList.query}
                onQueryChange={requestList.setQuery}
                searchPlaceholder="Search service requests…"
              />
            )}
          <div className="space-y-3">
            {requestList.pageItems.map((r) => (
              <div key={r.id} className={`${CARD} p-4`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#e87722]">{r.number}</p>
                    <p className="mt-1 text-sm font-medium text-[#1a2744]">{r.tradeCode} · {r.component}</p>
                    <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.status}
                      {r.artisan ? ` · ${r.artisan.fullName}` : ''}
                      {r.labourAmount != null
                        ? ` · labour ₦${Number(r.labourAmount).toLocaleString()} · fee ₦${Number(r.platformFee ?? 0).toLocaleString()}`
                        : ''}
                    </p>
                    <AttachmentLinks urls={r.photoUrls} label="Photos" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status === 'SUBMITTED' && (
                      <button type="button" onClick={() => assign(r)} className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white">Assign</button>
                    )}
                    {r.status === 'ARTISAN_SELECTED' && (
                      <button type="button" onClick={() => estimate(r)} className="rounded-md bg-[#1a2744] px-3 py-1.5 text-xs text-white">Estimate</button>
                    )}
                    {r.status === 'ESTIMATED' && (
                      <button type="button" onClick={() => approveReq(r.id)} className="rounded-md bg-[#e87722] px-3 py-1.5 text-xs text-white">Approve</button>
                    )}
                    {(r.status === 'APPROVED' || r.status === 'IN_PROGRESS') && (
                      <button type="button" onClick={() => confirm(r.id)} className="rounded-md bg-green-700 px-3 py-1.5 text-xs text-white">Confirm + rate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {requests.length === 0 && <div className={`${CARD} p-6 text-center text-sm text-slate-500`}>No service requests yet.</div>}
          </div>
            {requests.length > 0 && (
              <PaginationBar
                page={requestList.page}
                pageCount={requestList.pageCount}
                pageSize={requestList.pageSize}
                filteredCount={requestList.filteredCount}
                onPageChange={requestList.setPage}
              />
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
