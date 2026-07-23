const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export async function publicApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<T>;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('propa3_token');
}

export function setToken(token: string) {
  localStorage.setItem('propa3_token', token);
}

export function clearToken() {
  localStorage.removeItem('propa3_token');
  localStorage.removeItem('propa3_user');
}

export function setUser(user: unknown) {
  localStorage.setItem('propa3_user', JSON.stringify(user));
}

export function getUser<T = Record<string, unknown>>(): T | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('propa3_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
      if (Array.isArray(message)) message = message.join(', ');
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  primarySite?: { code: string; name: string } | null;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

export async function login(email: string, password: string) {
  const data = await api<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setToken(data.accessToken);
  setUser(data.user);
  return data;
}

export function logout() {
  clearToken();
  window.location.href = '/login';
}

export async function downloadCsv(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError('Export failed', res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadSiteLogPhotos(
  logId: string,
  files: File[],
  opts?: { section?: string; lat?: number; lng?: number },
) {
  const token = getToken();
  const form = new FormData();
  for (const f of files) form.append('photos', f);
  if (opts?.section) form.append('section', opts.section);
  if (opts?.lat != null) form.append('lat', String(opts.lat));
  if (opts?.lng != null) form.append('lng', String(opts.lng));

  const res = await fetch(`${API_URL}/api/site-tracker/logs/${logId}/photos`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export async function syncOfflineSiteLogs() {
  const { getOfflineQueue, removeOfflineLog, dataUrlToFile } = await import(
    './offline-site-log'
  );
  const queue = getOfflineQueue();
  const results: { localId: string; ok: boolean; error?: string }[] = [];

  for (const entry of queue) {
    try {
      const log = await api<{ id: string }>('/site-tracker/logs', {
        method: 'POST',
        body: JSON.stringify(entry.payload),
      });

      if (entry.photoDataUrls.length) {
        const files = entry.photoDataUrls.map((p) => dataUrlToFile(p.dataUrl, p.name));
        await uploadSiteLogPhotos(log.id, files, { section: 'site' });
      }

      await api(`/site-tracker/logs/${log.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          supervisorSignature: entry.supervisorSignature,
        }),
      });

      removeOfflineLog(entry.localId);
      results.push({ localId: entry.localId, ok: true });
    } catch (err) {
      results.push({
        localId: entry.localId,
        ok: false,
        error: err instanceof ApiError ? err.message : 'Sync failed',
      });
    }
  }

  return results;
}

export async function downloadPdf(path: string, filename: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new ApiError('Download failed', res.status);
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function uploadFcdaPermit(projectId: string, file: File) {
  const token = getToken();
  const form = new FormData();
  form.append('permit', file);

  const res = await fetch(`${API_URL}/api/projects/${projectId}/fcda-permit`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export async function submitInquiry(data: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  listingId?: string;
  message?: string;
}) {
  return publicApi('/inquiries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function uploadPaymentProof(
  invoiceId: string,
  amount: number,
  file?: File,
) {
  const token = getToken();
  const form = new FormData();
  form.append('amount', String(amount));
  if (file) form.append('proof', file);

  const res = await fetch(`${API_URL}/api/invoices/${invoiceId}/payments`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json();
}

export type DocumentRecord = {
  id: string;
  category: string;
  entityType: string;
  entityId: string;
  title: string;
  version: number;
  isLatest: boolean;
  fileUrl: string;
  filename: string;
  createdAt: string;
  uploadedBy?: { firstName: string; lastName: string } | null;
};

export async function uploadDocument(
  params: {
    entityType: string;
    entityId: string;
    category: string;
    title: string;
    notes?: string;
  },
  file: File,
) {
  const token = getToken();
  const form = new FormData();
  form.append('entityType', params.entityType);
  form.append('entityId', params.entityId);
  form.append('category', params.category);
  form.append('title', params.title);
  if (params.notes) form.append('notes', params.notes);
  form.append('file', file);

  const res = await fetch(`${API_URL}/api/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  return res.json() as Promise<DocumentRecord>;
}

export async function generateAllocationLetter(clientId: string, projectId: string) {
  return api<DocumentRecord>('/documents/allocation-letter', {
    method: 'POST',
    body: JSON.stringify({ clientId, projectId }),
  });
}
