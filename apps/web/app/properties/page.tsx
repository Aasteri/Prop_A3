import type { Metadata } from 'next';
import { PropertiesClient } from './properties-client';
import { fetchPublicListings } from '@/lib/public-server';

export const metadata: Metadata = {
  title: 'Properties for sale in Abuja',
  description:
    'Browse Triple A Realty properties for sale in Abuja — Guzape, Jikwoyi, Lifecamp and more. Prices, payment plans, and inquiry forms on Propa3.',
  alternates: { canonical: '/properties' },
  openGraph: {
    title: 'Properties for sale in Abuja | Propa3',
    description:
      'FOR SALE catalog from Triple A Realty Projects Ltd — duplexes, terraces, and developments across Abuja.',
    url: '/properties',
  },
};

export default async function PropertiesPage() {
  const listings = (await fetchPublicListings()) ?? [];
  return <PropertiesClient initialListings={listings} />;
}
