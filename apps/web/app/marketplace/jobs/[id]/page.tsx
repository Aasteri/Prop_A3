'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MarketplaceShell } from '@/components/MarketplaceShell';
import { AttachmentLinks } from '@/components/AttachmentLinks';
import { api, getToken, getUser, type AuthUser } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-base';
import { CARD, INPUT, LABEL } from '@/lib/ui';

type Quote = {
  id: string;
  workmanshipAmount: string | number;
  materialsEstimate: string | number | null;
  materialsNote: string | null;
  depositAmount: string | number | null;
  message: string | null;
  status: string;
  artisan: { id: string; fullName: string; businessName: string | null; source: string };
};

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
};

type Job = {
  id: string;
  publicId: string;
  title: string;
  description: string;
  locationText: string | null;
  addressText: string | null;
  status: string;
  workmanshipAmount: string | number | null;
  platformFeePctSnapshot: string | number | null;
  platformFeeAmount: string | number | null;
  escrowPaidAt: string | null;
  photoUrls?: string[] | null;
  quotes: Quote[];
  payments?: { id: string; status: string; amount: string | number; method: string }[];
};

export default function MarketplaceJobPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [addressUnlocked, setAddressUnlocked] = useState(false);
  const [chatBody, setChatBody] = useState('');
  const [quoteForm, setQuoteForm] = useState({
    workmanshipAmount: '',
    materialsEstimate: '',
    depositAmount: '',
    message: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [bankRef, setBankRef] = useState('');
  const [payMethods, setPayMethods] = useState<{
    paystack: { available: boolean; label: string };
    bankTransferProof: { available: boolean; label: string };
  } | null>(null);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const j = await api<Job>(`/marketplace/jobs/${id}`);
    setJob(j);
    if (
      ['SELECTED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(
        j.status,
      )
    ) {
      const chat = await api<{ addressUnlocked: boolean; messages: Message[] }>(
        `/marketplace/jobs/${id}/messages`,
      );
      setMessages(chat.messages);
      setAddressUnlocked(chat.addressUnlocked);
    } else {
      setMessages([]);
      setAddressUnlocked(false);
    }
  }, [id]);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/login');
      return;
    }
    setUser(getUser<AuthUser>());
    api<{
      paystack: { available: boolean; label: string };
      bankTransferProof: { available: boolean; label: string };
    }>('/marketplace/payment-methods')
      .then(setPayMethods)
      .catch(() => null);
    load().catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [load, router]);

  async function submitQuote(e: FormEvent) {
    e.preventDefault();
    setError('');
    await api(`/marketplace/jobs/${id}/quotes`, {
      method: 'POST',
      body: JSON.stringify({
        workmanshipAmount: Number(quoteForm.workmanshipAmount),
        materialsEstimate: quoteForm.materialsEstimate
          ? Number(quoteForm.materialsEstimate)
          : undefined,
        depositAmount: quoteForm.depositAmount ? Number(quoteForm.depositAmount) : undefined,
        message: quoteForm.message || undefined,
        materialsNote: 'Materials paid directly to artisan — not via Propa3.',
      }),
    });
    setOk('Quote submitted');
    load();
  }

  async function selectQuote(quoteId: string) {
    setError('');
    await api(`/marketplace/jobs/${id}/select-quote`, {
      method: 'POST',
      body: JSON.stringify({ quoteId }),
    });
    setOk('Artisan selected — chat is open. Pay workmanship to unlock full address sharing.');
    load();
  }

  async function sendChat(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api(`/marketplace/jobs/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body: chatBody }),
      });
      setChatBody('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Message blocked');
    }
  }

  async function payBank() {
    setError('');
    try {
      const token = getToken();
      if (proofFile) {
        const form = new FormData();
        form.append('proof', proofFile);
        const res = await fetch(
          `${getApiBaseUrl()}/api/marketplace/jobs/${id}/escrow/proof`,
          {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: form,
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || res.statusText);
        }
      } else {
        await api(`/marketplace/jobs/${id}/escrow`, {
          method: 'POST',
          body: JSON.stringify({
            method: 'BANK_TRANSFER_PROOF',
            proofUrl: bankRef || undefined,
            isDeposit: false,
          }),
        });
      }
      setOk(
        'Payment / proof submitted — Finance will verify. Escrow then holds and address sharing unlocks.',
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  async function payPaystack() {
    setError('');
    try {
      await api(`/marketplace/jobs/${id}/escrow`, {
        method: 'POST',
        body: JSON.stringify({ method: 'PAYSTACK' }),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Paystack unavailable');
    }
  }

  async function confirmDone() {
    await api(`/marketplace/jobs/${id}/confirm-complete`, { method: 'POST' });
    setOk('Job completed — escrow released (platform fee + artisan net).');
    load();
  }

  async function verifyPayment(paymentId: string) {
    await api(`/marketplace/payments/${paymentId}/verify`, { method: 'PATCH' });
    setOk('Escrow held — address sharing unlocked in chat.');
    load();
  }

  if (!job) {
    return (
      <MarketplaceShell>
        <div className="mx-auto max-w-3xl p-6">
          <p className="text-sm text-slate-500">{error || 'Loading…'}</p>
        </div>
      </MarketplaceShell>
    );
  }

  const isSeeker =
    user?.role === 'MARKETPLACE_SEEKER' || user?.role === 'CLIENT' || user?.role === 'CEO';
  const isArtisan = user?.role === 'ARTISAN';
  const isStaff = ['CEO', 'ADMIN', 'FINANCE', 'PROJECT_MANAGER'].includes(user?.role || '');

  return (
    <MarketplaceShell>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link href={isStaff ? '/marketplace-admin' : '/marketplace'} className="text-sm text-[#e87722]">
            ← Back
          </Link>
          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium">{job.status}</span>
        </div>

        <section className={`${CARD} p-5`}>
          <p className="text-xs text-slate-500">{job.publicId}</p>
          <h1 className="text-xl font-semibold text-[#1a2744]">{job.title}</h1>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{job.description}</p>
          <AttachmentLinks urls={job.photoUrls} label="Job photos" />
          {job.locationText && (
            <p className="mt-2 text-sm">
              <span className="font-medium">Area:</span> {job.locationText}
            </p>
          )}
          {job.addressText && (
            <p className="mt-1 text-sm">
              <span className="font-medium">Address:</span> {job.addressText}
            </p>
          )}
          {job.workmanshipAmount != null && (
            <p className="mt-3 text-sm">
              Workmanship: ₦{Number(job.workmanshipAmount).toLocaleString()} · Platform fee snapshot:{' '}
              {job.platformFeePctSnapshot}% (₦{Number(job.platformFeeAmount ?? 0).toLocaleString()})
            </p>
          )}
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {ok && <p className="text-sm text-emerald-700">{ok}</p>}

        <section className={`${CARD} p-5`}>
          <h2 className="font-semibold text-[#1a2744]">Quotes</h2>
          <p className="mt-1 text-xs text-slate-500">
            Workmanship is escrowed in Propa3. Materials estimates are informational — pay the worker
            directly for materials.
          </p>
          <ul className="mt-3 space-y-3">
            {job.quotes.map((q) => (
              <li key={q.id} className="rounded-lg border border-slate-200 p-3 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {q.artisan.fullName}
                      {q.artisan.businessName ? ` · ${q.artisan.businessName}` : ''}{' '}
                      <span className="text-xs text-slate-500">[{q.artisan.source}]</span>
                    </p>
                    <p>
                      Workmanship ₦{Number(q.workmanshipAmount).toLocaleString()}
                      {q.materialsEstimate != null && (
                        <> · Materials est. ₦{Number(q.materialsEstimate).toLocaleString()} (direct)</>
                      )}
                    </p>
                    {q.message && <p className="mt-1 text-slate-600">{q.message}</p>}
                    <p className="text-xs text-slate-500">{q.status}</p>
                  </div>
                  {isSeeker && q.status === 'SUBMITTED' && job.status === 'QUOTED' && (
                    <button
                      type="button"
                      className="rounded bg-[#e87722] px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => selectQuote(q.id)}
                    >
                      Select
                    </button>
                  )}
                </div>
              </li>
            ))}
            {!job.quotes.length && <p className="text-sm text-slate-500">No quotes yet.</p>}
          </ul>

          {isArtisan && ['ASSIGNED', 'QUOTED'].includes(job.status) && (
            <form onSubmit={submitQuote} className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium">Submit / update your quote</p>
              <input
                className={INPUT}
                placeholder="Workmanship amount (₦)"
                required
                value={quoteForm.workmanshipAmount}
                onChange={(e) => setQuoteForm((f) => ({ ...f, workmanshipAmount: e.target.value }))}
              />
              <input
                className={INPUT}
                placeholder="Materials estimate (₦, optional — paid directly to you)"
                value={quoteForm.materialsEstimate}
                onChange={(e) => setQuoteForm((f) => ({ ...f, materialsEstimate: e.target.value }))}
              />
              <input
                className={INPUT}
                placeholder="Deposit required (₦, optional)"
                value={quoteForm.depositAmount}
                onChange={(e) => setQuoteForm((f) => ({ ...f, depositAmount: e.target.value }))}
              />
              <textarea
                className={INPUT}
                rows={2}
                placeholder="Note (no phones)"
                value={quoteForm.message}
                onChange={(e) => setQuoteForm((f) => ({ ...f, message: e.target.value }))}
              />
              <button type="submit" className="rounded-lg bg-[#1a2744] px-3 py-2 text-sm text-white">
                Submit quote
              </button>
            </form>
          )}
        </section>

        {['SELECTED', 'AWAITING_PAYMENT', 'IN_PROGRESS', 'AWAITING_CONFIRM', 'COMPLETED', 'DISPUTED'].includes(
          job.status,
        ) && (
          <section id="chat" className={`${CARD} p-5`}>
            <h2 className="font-semibold text-[#1a2744]">Request chat</h2>
            <p className="mt-1 text-xs text-slate-500">
              This thread is only for this job. Phone numbers always blocked. Full addresses{' '}
              {addressUnlocked ? 'allowed (escrow paid)' : 'blocked until workmanship escrow is paid'}.
              Areas/landmarks OK.
            </p>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-slate-100 p-3 text-sm">
              {messages.map((m) => (
                <div key={m.id}>
                  <span className="font-medium">
                    {m.sender.firstName} {m.sender.lastName}
                  </span>
                  <span className="text-xs text-slate-500"> · {new Date(m.createdAt).toLocaleString()}</span>
                  <p>{m.body}</p>
                </div>
              ))}
              {!messages.length && <p className="text-slate-500">No messages yet.</p>}
            </div>
            <form onSubmit={sendChat} className="mt-3 flex gap-2">
              <input
                className={INPUT}
                value={chatBody}
                onChange={(e) => setChatBody(e.target.value)}
                placeholder="Message…"
                required
              />
              <button type="submit" className="rounded-lg bg-[#1a2744] px-3 py-2 text-sm text-white">
                Send
              </button>
            </form>
          </section>
        )}

        {job.status === 'AWAITING_PAYMENT' && isSeeker && (
          <section className={`${CARD} p-5`}>
            <h2 className="font-semibold text-[#1a2744]">Pay workmanship (escrow)</h2>
            <p className="mt-1 text-sm text-slate-600">
              Materials are not paid here. Bank transfer + proof, or Paystack when configured.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <p>{payMethods?.bankTransferProof.label}</p>
              <div>
                <label className={LABEL}>Upload bank proof (image / PDF)</label>
                <input
                  className={INPUT}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div>
                <label className={LABEL}>Bank transfer reference (optional)</label>
                <input
                  className={INPUT}
                  value={bankRef}
                  onChange={(e) => setBankRef(e.target.value)}
                  placeholder="e.g. bank ref — not a public file URL"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Prefer uploading the receipt above. This field is for a transfer reference only.
                </p>
              </div>
              <button
                type="button"
                onClick={payBank}
                className="rounded-lg bg-[#e87722] px-4 py-2 text-sm font-semibold text-white"
              >
                Submit bank transfer + proof
              </button>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={payPaystack}
                  disabled={!payMethods?.paystack.available}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 text-slate-900"
                >
                  {payMethods?.paystack.label ?? 'Paystack'}
                </button>
              </div>
            </div>
          </section>
        )}

        {isStaff &&
          job.payments?.map((p) =>
            ['PENDING_VERIFICATION', 'PENDING_PROOF'].includes(p.status) ? (
              <button
                key={p.id}
                type="button"
                className="rounded bg-emerald-700 px-3 py-2 text-sm text-white"
                onClick={() => verifyPayment(p.id)}
              >
                Verify payment ₦{Number(p.amount).toLocaleString()} ({p.method})
              </button>
            ) : null,
          )}

        {job.status === 'IN_PROGRESS' && isSeeker && (
          <button
            type="button"
            onClick={confirmDone}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Confirm job complete — release escrow
          </button>
        )}
      </div>
    </MarketplaceShell>
  );
}
