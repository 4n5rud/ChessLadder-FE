import { useState, useEffect, useRef, useCallback } from 'react';
import { getSyncStatus } from '../api/userService';
import type { SyncStatusResponse } from '../api/userService';
import { useAuthStore } from '../store/authStore';

const POLL_INTERVAL_MS = 2000;

const TERMINAL_STATUSES = new Set(['COMPLETED', 'FAILED', 'TOKEN_EXPIRED']);

interface UseSyncPollingResult {
  syncStatus: SyncStatusResponse | null;
  loading: boolean;
  refresh: () => void;
}

export function useSyncPolling(platform?: 'LICHESS' | 'CHESSCOM'): UseSyncPollingResult {
  const storedPlatform = useAuthStore(state => state.getStoredPlatform);
  const resolvedPlatform = platform ?? storedPlatform();

  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback((plt: 'LICHESS' | 'CHESSCOM') => {
    stopPolling();
    intervalRef.current = setInterval(async () => {
      try {
        const s = await getSyncStatus(plt);
        if (!mountedRef.current) return;
        setSyncStatus(s);
        if (TERMINAL_STATUSES.has(s.status)) stopPolling();
      } catch {
        stopPolling();
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling]);

  const fetch = useCallback(async (plt: 'LICHESS' | 'CHESSCOM') => {
    setLoading(true);
    try {
      const s = await getSyncStatus(plt);
      if (!mountedRef.current) return;
      setSyncStatus(s);
      if (!TERMINAL_STATUSES.has(s.status)) startPolling(plt);
    } catch {
      // ignore
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [startPolling]);

  useEffect(() => {
    fetch(resolvedPlatform);
    return stopPolling;
  }, [resolvedPlatform, fetch, stopPolling]);

  const refresh = useCallback(() => {
    stopPolling();
    fetch(resolvedPlatform);
  }, [resolvedPlatform, fetch, stopPolling]);

  return { syncStatus, loading, refresh };
}
