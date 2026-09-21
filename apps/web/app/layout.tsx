import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { PwaRegister } from '@/components/PwaRegister';
import { JsonLd } from '@/components/JsonLd';
import {
  SITE_CONTACT,
  SITE_DEFAULT_DESCRIPTION,
  SITE_LEGAL_NAME,
  SITE_NAME,
  SITE_TAGLINE,
  getSiteUrl,
} from '@/lib/site';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${SITE_NAME} — ${SITE_LEGAL_NAME}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'Abuja real estate',
    'Triple A Realty',
    'property for sale Abuja',
    'Guzape',
    'Jikwoyi',
    'artisan marketplace Nigeria',
    'construction project management',
    'Propa3',
  ],
  authors: [{ name: SITE_LEGAL_NAME }],
  creator: SITE_LEGAL_NAME,
  publisher: SITE_LEGAL_NAME,
  formatDetection: { telephone: true, email: true },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_NG',
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DEFAULT_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  category: 'real estate',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: SITE_NAME },
};

export const viewport: Viewport = {
  themeColor: '#1a2744',
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  name: SITE_LEGAL_NAME,
  alternateName: SITE_NAME,
  url: siteUrl,
  email: SITE_CONTACT.email,
  telephone: SITE_CONTACT.phone,
  description: SITE_DEFAULT_DESCRIPTION,
  address: {
    '@type': 'PostalAddress',
    addressLocality: SITE_CONTACT.locality,
    addressCountry: SITE_CONTACT.country,
  },
  areaServed: {
    '@type': 'City',
    name: 'Abuja',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: siteUrl,
  publisher: { '@type': 'Organization', name: SITE_LEGAL_NAME },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/properties?search={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased text-slate-900`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <JsonLd data={[orgJsonLd, websiteJsonLd]} />
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
