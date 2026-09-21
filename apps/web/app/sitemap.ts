import type { MetadataRoute } from 'next';
import { fetchPublicListings } from '@/lib/public-server';
import { getSiteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/properties`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/estates`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/marketplace`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const listings = (await fetchPublicListings()) ?? [];
  const listingRoutes: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${base}/properties/${l.id}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  return [...staticRoutes, ...listingRoutes];
}
