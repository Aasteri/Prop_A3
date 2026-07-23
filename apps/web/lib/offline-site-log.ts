const QUEUE_KEY = 'propa3_offline_site_logs';

export type OfflineSiteLogEntry = {
  localId: string;
  payload: Record<string, unknown>;
  supervisorSignature: string;
  photoDataUrls: { name: string; dataUrl: string }[];
  createdAt: string;
};

export function getOfflineQueue(): OfflineSiteLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]') as OfflineSiteLogEntry[];
  } catch {
    return [];
  }
}

export function enqueueOfflineLog(entry: OfflineSiteLogEntry) {
  const queue = getOfflineQueue();
  queue.push(entry);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function removeOfflineLog(localId: string) {
  const queue = getOfflineQueue().filter((e) => e.localId !== localId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], filename, { type: mime });
}

export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
