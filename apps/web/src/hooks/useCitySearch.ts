import { useEffect, useState } from 'react';

interface GeonamesCity {
  name: string;
  adminName1: string;
}

interface GeonamesResponse {
  geonames?: GeonamesCity[];
}

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

    const timer = setTimeout(() => {
      setIsLoading(true);
      const params = new URLSearchParams({ country, q: query });
      fetch(`/api/cities?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : { geonames: [] }))
        .then((data: GeonamesResponse) => {
          setResults(
            (data.geonames ?? []).map((g) => ({ name: g.name, region: g.adminName1 ?? '' })),
          );
        })
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [country, query]);

  return { results, isLoading };
}
