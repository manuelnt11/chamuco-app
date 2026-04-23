import { Test, TestingModule } from '@nestjs/testing';
import { LocationsService } from '@/modules/locations/locations.service';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('LocationsService', () => {
  let service: LocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationsService],
    }).compile();

    service = module.get<LocationsService>(LocationsService);
    mockFetch.mockReset();
    process.env.GEONAMES_USERNAME = 'testuser';
  });

  afterEach(() => {
    delete process.env.GEONAMES_USERNAME;
  });

  describe('searchCities', () => {
    it('should return transformed city results', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ geonames: [{ name: 'Medellín', adminName1: 'Antioquia' }] }),
      });

      const result = await service.searchCities('Med', 'CO');

      expect(result).toEqual([{ name: 'Medellín', region: 'Antioquia' }]);
    });

    it('should include correct query params in the GeoNames request', async () => {
      mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ geonames: [] }) });

      await service.searchCities('Med', 'CO');

      const calledUrl = String(mockFetch.mock.calls[0]?.[0]);
      expect(calledUrl).toContain('name_startsWith=Med');
      expect(calledUrl).not.toContain('q=Med');
      expect(calledUrl).toContain('country=CO');
      expect(calledUrl).toContain('username=testuser');
      expect(calledUrl).toContain('featureClass=P');
      expect(calledUrl).toContain('orderby=population');
      expect(calledUrl).toContain('maxRows=15');
    });

    it('should return [] on non-ok GeoNames response', async () => {
      mockFetch.mockResolvedValue({ ok: false });

      const result = await service.searchCities('Med', 'CO');

      expect(result).toEqual([]);
    });

    it('should return [] on network error', async () => {
      mockFetch.mockRejectedValue(new Error('network error'));

      const result = await service.searchCities('Med', 'CO');

      expect(result).toEqual([]);
    });

    it('should default region to empty string when adminName1 is absent', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ geonames: [{ name: 'Tokyo' }] }),
      });

      const result = await service.searchCities('Tok', 'JP');

      expect(result).toEqual([{ name: 'Tokyo', region: '' }]);
    });

    it('should return [] when geonames field is absent', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const result = await service.searchCities('Med', 'CO');

      expect(result).toEqual([]);
    });
  });
});
