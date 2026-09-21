import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/properties', '/properties/', '/projects', '/estates', '/marketplace', '/privacy'],
        disallow: [
          '/api/',
          '/login',
          '/forgot-password',
          '/reset-password',
          '/dashboard',
          '/admin',
          '/portal',
          '/account',
          '/artisan',
          '/marketplace-admin',
          '/marketplace/requests',
          '/marketplace/jobs',
          '/crm',
          '/invoices',
          '/settings',
          '/site-tracker',
          '/user-guide',
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
