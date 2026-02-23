import { STREAM_API_URL } from './api';

export interface PrayerRequest {
  id: string;
  authorName: string | null;
  isAnonymous: boolean;
  title: string;
  body: string;
  isPublic: boolean;
  prayerCount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrayerRequestPayload {
  title: string;
  body: string;
  authorName: string;
  isAnonymous: boolean;
  isPublic: boolean;
}

async function prayerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${STREAM_API_URL}/api/prayer-requests${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export async function getPrayerRequests(
  limit = 20,
  offset = 0,
): Promise<PrayerRequest[]> {
  return prayerFetch<PrayerRequest[]>(
    `?status=active&limit=${limit}&offset=${offset}`,
  );
}

export async function createPrayerRequest(
  payload: CreatePrayerRequestPayload,
): Promise<PrayerRequest> {
  return prayerFetch<PrayerRequest>('', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function prayForRequest(id: string): Promise<{ prayerCount: number }> {
  return prayerFetch<{ prayerCount: number }>(`/${id}/pray`, {
    method: 'POST',
  });
}
