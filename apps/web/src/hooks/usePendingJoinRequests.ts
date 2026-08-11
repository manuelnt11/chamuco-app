'use client';

import { useCallback, useEffect, useState } from 'react';

interface UsePendingJoinRequestsOptions<T> {
  fetchRequests: () => Promise<T[]>;
  cancelRequest: (id: string) => Promise<void>;
  getId: (item: T) => string;
}

interface UsePendingJoinRequestsResult<T> {
  requests: T[];
  isLoading: boolean;
  cancellingIds: Set<string>;
  errorIds: Set<string>;
  cancel: (item: T) => Promise<void>;
  refresh: () => void;
}

export function usePendingJoinRequests<T>({
  fetchRequests,
  cancelRequest,
  getId,
}: UsePendingJoinRequestsOptions<T>): UsePendingJoinRequestsResult<T> {
  const [requests, setRequests] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => {
    fetchRequests()
      .then(setRequests)
      .catch(() => setRequests([]))
      .finally(() => setIsLoading(false));
  }, [fetchRequests]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cancel = useCallback(
    async (item: T) => {
      const id = getId(item);
      setCancellingIds((prev) => new Set(prev).add(id));
      setErrorIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      try {
        await cancelRequest(id);
        setRequests((prev) => prev.filter((request) => getId(request) !== id));
      } catch {
        setErrorIds((prev) => new Set(prev).add(id));
      } finally {
        setCancellingIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [cancelRequest, getId],
  );

  return { requests, isLoading, cancellingIds, errorIds, cancel, refresh };
}
