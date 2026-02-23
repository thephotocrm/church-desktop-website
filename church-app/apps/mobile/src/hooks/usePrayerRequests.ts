import { useState, useEffect, useCallback } from 'react';
import {
  getPrayerRequests,
  createPrayerRequest,
  prayForRequest,
  type PrayerRequest,
  type CreatePrayerRequestPayload,
} from '../services/prayerApi';

export function usePrayerRequests() {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    try {
      const data = await getPrayerRequests();
      setRequests(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prayer requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRequests();
  }, [fetchRequests]);

  const submitRequest = useCallback(
    async (payload: CreatePrayerRequestPayload) => {
      const created = await createPrayerRequest(payload);
      if (created.isPublic) {
        setRequests((prev) => [created, ...prev]);
      }
      return created;
    },
    [],
  );

  const pray = useCallback(async (id: string) => {
    const updated = await prayForRequest(id);
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, prayerCount: updated.prayerCount } : r)),
    );
    return updated;
  }, []);

  return { requests, loading, refreshing, error, refresh, submitRequest, pray };
}
