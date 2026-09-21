/** Public site identity for SEO / metadata (unpaid organic). */
export const SITE_NAME = 'Propa3';
export const SITE_LEGAL_NAME = 'Triple A Realty Projects Ltd.';
export const SITE_TAGLINE = 'Premium property development, sales & artisan marketplace in Abuja';
export const SITE_DEFAULT_DESCRIPTION =
  'Triple A Realty Projects Ltd — Abuja property development & sales, construction project delivery, and artisan marketplace on Propa3.';

/** Canonical origin for absolute URLs in sitemap, OG, JSON-LD. */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.WEB_URL?.split(',')[0]?.trim() ||
    '';
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return 'https://propa3.com';
  return 'http://localhost:3000';
}

export const SITE_CONTACT = {
  email: 'info@propa3.com',
  phone: '+2348000000000',
  locality: 'Abuja',
  country: 'NG',
};
