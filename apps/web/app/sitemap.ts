import type { MetadataRoute } from 'next';
import { fetchPublicListings } from '@/lib/public-server';
import { getSiteUrl } from '@/lib/site';

/** Always regenerate so Search Console never gets a stale empty build artifact. */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl().replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/properties`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/estates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  let listings: Awaited<ReturnType<typeof fetchPublicListings>> = [];
  try {
    listings = (await fetchPublicListings()) ?? [];
  } catch {
    listings = [];
  }

  const listingRoutes: MetadataRoute.Sitemap = (listings ?? []).map((l) => ({
    url: `${base}/properties/${l.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...listingRoutes];
}
