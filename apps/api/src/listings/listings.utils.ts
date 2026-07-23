import { ListingFinish, ListingStatus, ListingType, Prisma } from '@prisma/client';

export async function generateListingRef(
  tx: Prisma.TransactionClient,
): Promise<string> {
  const prefix = 'TAA-SALE-';
  const latest = await tx.listing.findFirst({
    where: { listingRef: { startsWith: prefix } },
    orderBy: { listingRef: 'desc' },
    select: { listingRef: true },
  });

  let seq = 1;
  if (latest) {
    const parsed = parseInt(latest.listingRef.slice(prefix.length), 10);
    if (!Number.isNaN(parsed)) seq = parsed + 1;
  }

  return `${prefix}${String(seq).padStart(3, '0')}`;
}

export function mapSeedStatus(status: string): ListingStatus {
  switch (status.toLowerCase()) {
    case 'reserved':
      return ListingStatus.RESERVED;
    case 'sold':
      return ListingStatus.SOLD;
    case 'archived':
      return ListingStatus.ARCHIVED;
    default:
      return ListingStatus.AVAILABLE;
  }
}

export function mapSeedFinish(finish: string): ListingFinish {
  if (finish === 'SF') return ListingFinish.SF;
  if (finish === 'DPC') return ListingFinish.DPC;
  return ListingFinish.FF;
}

export function displayPrice(listing: {
  priceNgn: unknown;
  priceOutrightNgn: unknown;
  price6mNgn: unknown;
  price12mNgn: unknown;
  price18mNgn: unknown;
  paymentPlan: string;
}): string {
  const outright = listing.priceOutrightNgn ?? listing.priceNgn;
  if (outright != null) return `₦${Number(outright).toLocaleString()}`;
  if (listing.price12mNgn != null) return `₦${Number(listing.price12mNgn).toLocaleString()} (12M)`;
  if (listing.price6mNgn != null) return `₦${Number(listing.price6mNgn).toLocaleString()} (6M)`;
  if (listing.price18mNgn != null) return `₦${Number(listing.price18mNgn).toLocaleString()} (18M)`;
  return listing.paymentPlan === 'TBD' ? 'Price on request' : 'TBC';
}

export const LISTING_STATUSES = Object.values(ListingStatus);
export const LISTING_FINISHES = Object.values(ListingFinish);
export const LISTING_TYPES = Object.values(ListingType);
