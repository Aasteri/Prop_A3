import { getApiBaseUrl } from '@/lib/api-base';

async function publicServerFetch<T>(path: string, revalidate = 300): Promise<T | null> {
  const base = getApiBaseUrl();
  const url = `${base}/api${path.startsWith('/') ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      next: { revalidate },
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type PublicListing = {
  id: string;
  listingRef: string;
  location: string;
  propertyType: string;
  finish: string;
  paymentPlan: string;
  displayPrice: string;
  priceOutrightNgn?: number | null;
  price6mNgn?: number | null;
  price12mNgn?: number | null;
  price18mNgn?: number | null;
};

export type PublicCompany = {
  name: string;
  tagline: string;
  phone: string;
  email: string;
  whatsapp: string;
  badges: string[];
};

export type PublicProject = {
  id: string;
  name: string;
  location: string | null;
  site: { code: string; name: string };
  milestones: { stage: string; progressPct: number }[];
};

export type PublicStats = {
  listingCount: number;
  projectCount: number;
  siteCount: number;
};

export type PublicSiteMarker = {
  code: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  activeProjects: number;
  projectNames?: string[];
};

export type PublicCatalogItem = {
  id: string;
  code: string;
  category: string;
  label: string;
  description: string | null;
};

export function fetchPublicCompany() {
  return publicServerFetch<PublicCompany>('/public/company');
}

export function fetchPublicListings(search?: string) {
  const q = search ? `?search=${encodeURIComponent(search)}` : '';
  return publicServerFetch<PublicListing[]>(`/public/listings${q}`);
}

export function fetchPublicListing(id: string) {
  return publicServerFetch<PublicListing>(`/public/listings/${id}`);
}

export function fetchPublicProjects() {
  return publicServerFetch<PublicProject[]>('/public/projects');
}

export function fetchPublicStats() {
  return publicServerFetch<PublicStats>('/public/stats');
}

export function fetchPublicSitesMap() {
  return publicServerFetch<PublicSiteMarker[]>('/public/sites-map');
}

export function fetchMarketplaceCatalog(q?: string) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  return publicServerFetch<PublicCatalogItem[]>(`/marketplace/catalog${qs}`);
}
