/** Persist marketplace job request while user signs up / logs in. */

export const MARKETPLACE_DRAFT_KEY = 'propa3_marketplace_job_draft';
export const MARKETPLACE_DRAFT_FLAG = 'propa3_marketplace_draft_pending';

export type MarketplaceJobDraft = {
  catalogItemId: string;
  catalogLabel: string;
  catalogCategory: string;
  title: string;
  description: string;
  locationText: string;
  addressText: string;
  savedAt: number;
};

export function saveMarketplaceDraft(draft: Omit<MarketplaceJobDraft, 'savedAt'>) {
  if (typeof window === 'undefined') return;
  const payload: MarketplaceJobDraft = { ...draft, savedAt: Date.now() };
  localStorage.setItem(MARKETPLACE_DRAFT_KEY, JSON.stringify(payload));
  localStorage.setItem(MARKETPLACE_DRAFT_FLAG, '1');
}

export function loadMarketplaceDraft(): MarketplaceJobDraft | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(MARKETPLACE_DRAFT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as MarketplaceJobDraft;
  } catch {
    return null;
  }
}

export function clearMarketplaceDraft() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MARKETPLACE_DRAFT_KEY);
  localStorage.removeItem(MARKETPLACE_DRAFT_FLAG);
}

export function hasPendingMarketplaceDraft(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(MARKETPLACE_DRAFT_FLAG) === '1';
}
