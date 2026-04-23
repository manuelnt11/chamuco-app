import { Test, TestingModule } from '@nestjs/testing';
import { CityResultDto } from '@/modules/locations/dto/city-search-response.dto';
import { LocationsController } from '@/modules/locations/locations.controller';
import { LocationsService } from '@/modules/locations/locations.service';

describe('LocationsController', () => {
  let controller: LocationsController;
  let mockSearchCities: jest.Mock;

  beforeEach(async () => {
    mockSearchCities = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationsController],
      providers: [{ provide: LocationsService, useValue: { searchCities: mockSearchCities } }],
    }).compile();

    controller = module.get<LocationsController>(LocationsController);
  });

  describe('searchCities', () => {
    it('should delegate to LocationsService and return results', async () => {
      const cities: CityResultDto[] = [{ name: 'Medellín', region: 'Antioquia' }];
      mockSearchCities.mockResolvedValue(cities);

      const result = await controller.searchCities({ namePrefix: 'Med', country: 'CO' });

      expect(result).toEqual(cities);
      expect(mockSearchCities).toHaveBeenCalledWith('Med', 'CO');
    });

    it('should return empty array when service returns no results', async () => {
      mockSearchCities.mockResolvedValue([]);

      const result = await controller.searchCities({ namePrefix: 'Xyz', country: 'US' });

      expect(result).toEqual([]);
    });
  });
});
