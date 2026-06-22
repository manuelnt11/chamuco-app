import axios from 'axios';
import { useEffect, useState } from 'react';

import { searchTrips } from '@/services/trips.service';
import type { TripSearchResult } from '@/services/trips.types';

export function useTripSearch(query: string, limit = 20, offset = 0) {
  const [results, setResults] = useState<TripSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (!query.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);

      searchTrips({ q: query, limit, offset }, controller.signal)
        .then((res) => {
          setResults(res.data);
          setTotal(res.total);
        })
        .catch((err: unknown) => {
          if (!axios.isCancel(err)) {
            setResults([]);
            setTotal(0);
          }
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit, offset]);

  return { results, total, isLoading };
}
