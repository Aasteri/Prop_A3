'use client';

import { getApiBaseUrl } from '@/lib/api-base';

function resolveUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = getApiBaseUrl().replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}

function labelFor(path: string, index: number): string {
  if (path.startsWith('data:')) return `Attachment ${index + 1}`;
  const name = path.split('/').pop() || `File ${index + 1}`;
  return name.length > 48 ? `${name.slice(0, 45)}…` : name;
}

/**
 * Renders open/download links for paths returned by POST /uploads/photos
 * (or legacy data-URL photoUrls).
 */
export function AttachmentLinks({
  urls,
  label = 'Attachments',
  className = 'mt-2',
}: {
  urls?: string[] | null | unknown;
  label?: string;
  className?: string;
}) {
  const list = Array.isArray(urls)
    ? urls.filter((u): u is string => typeof u === 'string' && u.length > 0)
    : [];
  if (!list.length) return null;

  return (
    <div className={className}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {list.map((url, i) => (
          <li key={`${url.slice(0, 40)}-${i}`}>
            <a
              href={resolveUrl(url)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#e87722] hover:bg-slate-50"
            >
              {labelFor(url, i)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
