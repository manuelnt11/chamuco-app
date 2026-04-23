import { Injectable, Logger } from '@nestjs/common';
import { CityResultDto } from '@/modules/locations/dto/city-search-response.dto';

interface GeonamesResponse {
  geonames?: Array<{ name: string; adminName1?: string }>;
}

@Injectable()
export class LocationsService {
  private readonly logger = new Logger(LocationsService.name);

  async searchCities(namePrefix: string, country: string): Promise<CityResultDto[]> {
    const url = new URL('https://secure.geonames.org/searchJSON');
    url.searchParams.set('name_startsWith', namePrefix);
    url.searchParams.set('country', country);
    url.searchParams.set('featureClass', 'P');
    url.searchParams.set('orderby', 'population');
    url.searchParams.set('maxRows', '15');
    url.searchParams.set('username', process.env.GEONAMES_USERNAME!);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        this.logger.warn(
          `GeoNames returned ${res.status.toString()} for namePrefix="${namePrefix}" country="${country}"`,
        );
        return [];
      }
      const data = (await res.json()) as GeonamesResponse;
      return (data.geonames ?? []).map((g) => ({ name: g.name, region: g.adminName1 ?? '' }));
    } catch (err) {
      this.logger.error('GeoNames API error', err instanceof Error ? err.message : String(err));
      return [];
    }
  }
}
