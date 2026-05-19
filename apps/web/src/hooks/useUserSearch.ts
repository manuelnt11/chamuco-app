import axios from 'axios';
import { useEffect, useState } from 'react';

import { apiClient } from '@/services/api-client';
import type { UserSearchResponse, UserSearchResult } from '@/types/user';

export function useUserSearch(query: string, limit = 10) {
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    if (!query.trim() || query === '@') {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsLoading(true);

      apiClient
        .get<UserSearchResponse>('/v1/users/search', {
          params: { q: query, limit },
          signal: controller.signal,
        })
        .then((res) => {
          setResults(res.data.data);
        })
        .catch((err: unknown) => {
          if (!axios.isCancel(err)) {
            setResults([]);
          }
        })
        .finally(() => setIsLoading(false));
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, limit]);

  return { results, isLoading };
}
