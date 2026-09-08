/**
 * API origin for fetch calls.
 * - Browser: same-origin `/api` (nginx proxies to Nest) when env is unset.
 * - SSR: internal API URL on the server.
 */
export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '';
  }
  return process.env.API_URL ?? 'http://127.0.0.1:4000';
}
