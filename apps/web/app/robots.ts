import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl().replace(/\/$/, '');
  // Hostname only (no https://) — Google ignores Host, but invalid values confuse other tools.
  const host = base.replace(/^https?:\/\//, '');

  return {
    rules: [
      {
        userAgent: '*',
        // Default-allow everything public; only block app/auth surfaces.
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/dashboard',
          '/admin',
          '/portal/',
          '/account',
          '/artisan',
          '/marketplace-admin',
          '/marketplace/requests',
          '/marketplace/jobs/',
          '/crm/',
          '/invoices',
          '/settings',
          '/site-tracker',
          '/user-guide',
          '/workflow',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/login',
          '/dashboard',
          '/admin',
          '/portal/',
          '/account',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host,
  };
}
