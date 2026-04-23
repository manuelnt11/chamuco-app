import axios from 'axios';
import { useEffect, useState } from 'react';
import { apiClient } from '@/services/api-client';

export interface CityResult {
  name: string;
  region: string;
}

export function useCitySearch(country: string, query: string) {
  const [results, setResults] = useState<CityResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!country || query.length < 2) {
      setResults([]);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setIsLoading(true);

      apiClient
        .get<CityResult[]>('/v1/locations/cities', {
          params: { namePrefix: query, country },
          signal: controller.signal,
        })
        .then((res) => {
          setResults(res.data);
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
  }, [country, query]);

  return { results, isLoading };
}
