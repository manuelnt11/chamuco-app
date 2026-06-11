import axios from 'axios';
import { useEffect, useState } from 'react';
import type { CityResult } from '@/services/places.types';
import { searchCities } from '@/services/places.service';

export type { CityResult };

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

      searchCities(country, query, controller.signal)
        .then((results) => {
          setResults(results);
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
