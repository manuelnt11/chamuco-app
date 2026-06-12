import { apiClient } from '@/services/api-client';
import type { CityResult } from '@chamuco/shared-types';

export async function searchCities(
  country: string,
  namePrefix: string,
  signal?: AbortSignal,
): Promise<CityResult[]> {
  const { data } = await apiClient.get<CityResult[]>('/v1/locations/cities', {
    params: { namePrefix, country },
    signal,
  });
  return data;
}
