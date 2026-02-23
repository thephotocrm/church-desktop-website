import { useState, useEffect, useCallback } from 'react';
import { STREAM_API_URL } from '../services/api';

export interface StreamStatus {
  isLive: boolean;
  title: string;
  description: string | null;
  hlsUrl: string | null;
  thumbnailUrl: string | null;
  startedAt: string | null;
}

const POLL_INTERVAL_MS = 15_000;

export function useStreamStatus() {
  const [status, setStatus] = useState<StreamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${STREAM_API_URL}/api/stream/status`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: StreamStatus = await res.json();
      setStatus(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stream status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Build the full HLS URL from the relative path returned by the API
  const hlsUrl = status?.hlsUrl ? `${STREAM_API_URL}${status.hlsUrl}` : null;

  return { status, loading, error, hlsUrl, refetch: fetchStatus };
}
