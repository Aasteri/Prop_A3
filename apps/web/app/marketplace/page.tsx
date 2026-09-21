import type { Metadata } from 'next';
import { MarketplaceClient } from './marketplace-client';
import { fetchMarketplaceCatalog } from '@/lib/public-server';

export const metadata: Metadata = {
  title: 'Artisan marketplace in Abuja',
  description:
    'Request plumbers, electricians, AC technicians and more. Compare quotes, escrow workmanship fees, and chat safely — Triple A Realty on Propa3.',
  alternates: { canonical: '/marketplace' },
  openGraph: {
    title: 'Artisan marketplace in Abuja | Propa3',
    description:
      'Find approved tradespeople in Abuja. Workmanship escrow, gated chat, one account for property clients.',
    url: '/marketplace',
  },
};

export default async function MarketplacePage() {
  const items = (await fetchMarketplaceCatalog()) ?? [];
  return <MarketplaceClient initialItems={items} />;
}
