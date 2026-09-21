import type { Metadata } from 'next';
import { HomeClient } from './home-client';
import {
  fetchPublicCompany,
  fetchPublicListings,
  fetchPublicStats,
} from '@/lib/public-server';
import { SITE_DEFAULT_DESCRIPTION, SITE_TAGLINE } from '@/lib/site';

export const metadata: Metadata = {
  title: { absolute: `Propa3 — ${SITE_TAGLINE}` },
  description: SITE_DEFAULT_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: `Propa3 — ${SITE_TAGLINE}`,
    description: SITE_DEFAULT_DESCRIPTION,
    url: '/',
  },
};

export default async function HomePage() {
  const [company, listings, stats] = await Promise.all([
    fetchPublicCompany(),
    fetchPublicListings(),
    fetchPublicStats(),
  ]);

  return (
    <HomeClient
      initialCompany={company}
      initialFeatured={(listings ?? []).slice(0, 6)}
      initialStats={stats}
    />
  );
}
