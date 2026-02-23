import { useState, useEffect, useCallback } from 'react';
import type { Event } from '@church-app/shared';
import { api } from '../services/api';

export function useEvents(month?: number, year?: number) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params: { startDate?: string; endDate?: string } = {};

      if (month !== undefined && year !== undefined) {
        // First day of the month
        const start = new Date(year, month, 1);
        // Last day of the month
        const end = new Date(year, month + 1, 0);
        params.startDate = start.toISOString().split('T')[0];
        params.endDate = end.toISOString().split('T')[0];
      }

      const data = await api.getEvents(params);
      setEvents(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
}
