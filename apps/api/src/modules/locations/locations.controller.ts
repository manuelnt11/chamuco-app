import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FirebaseOnly } from '@/common/decorators';
import { CitySearchQueryDto } from '@/modules/locations/dto/city-search-query.dto';
import { CityResultDto } from '@/modules/locations/dto/city-search-response.dto';
import { LocationsService } from '@/modules/locations/locations.service';

@ApiTags('locations')
@Controller('v1/locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('cities')
  @FirebaseOnly()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search cities by name',
    description:
      'Proxies the GeoNames API to search for cities within a country. Requires a valid Firebase ID token. Available during onboarding before Chamuco registration is complete.',
  })
  @ApiResponse({ status: 200, description: 'City search results', type: [CityResultDto] })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase token' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  searchCities(@Query() query: CitySearchQueryDto): Promise<CityResultDto[]> {
    return this.locationsService.searchCities(query.namePrefix, query.country);
  }
}
