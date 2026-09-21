import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/components/JsonLd';
import { fetchPublicListing } from '@/lib/public-server';
import { SITE_LEGAL_NAME, getSiteUrl } from '@/lib/site';
import { PropertyDetailClient } from './property-detail-client';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) {
    return { title: 'Property not found', robots: { index: false } };
  }
  const title = `${listing.propertyType} in ${listing.location}`;
  const description = `${listing.propertyType} for sale in ${listing.location} — ${listing.displayPrice}. ${listing.finish} finish. ${SITE_LEGAL_NAME} on Propa3.`;
  const url = `${getSiteUrl()}/properties/${listing.id}`;
  return {
    title,
    description,
    alternates: { canonical: `/properties/${listing.id}` },
    openGraph: {
      title,
      description,
      url,
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await fetchPublicListing(id);
  if (!listing) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: `${listing.propertyType} in ${listing.location}`,
    description: `${listing.propertyType} — ${listing.finish} — ${listing.paymentPlan}`,
    url: `${getSiteUrl()}/properties/${listing.id}`,
    sku: listing.listingRef,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price:
        listing.priceOutrightNgn != null
          ? String(listing.priceOutrightNgn)
          : undefined,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'RealEstateAgent',
        name: SITE_LEGAL_NAME,
      },
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.location,
      addressCountry: 'NG',
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PropertyDetailClient listing={listing} />
    </>
  );
}
