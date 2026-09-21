import type { Metadata } from 'next';
import { EstatesClient } from './estates-client';
import { fetchPublicSitesMap } from '@/lib/public-server';

export const metadata: Metadata = {
  title: 'Development sites in Abuja',
  description:
    'Map of Triple A Realty development sites across Abuja — Guzape, Jikwoyi, Mpape and more. Find estates and browse units for sale.',
  alternates: { canonical: '/estates' },
  openGraph: {
    title: 'Development sites in Abuja | Propa3',
    description: 'Active Triple A project locations on an interactive map.',
    url: '/estates',
  },
};

export default async function EstatesMapPage() {
  const sites = (await fetchPublicSitesMap()) ?? [];
  return <EstatesClient initialSites={sites} />;
}
