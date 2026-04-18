import { KeyStatsDto, PublicProfileResponseDto } from './public-profile-response.dto';

describe('KeyStatsDto', () => {
  it('can be instantiated and assigned values', () => {
    const dto = new KeyStatsDto();
    dto.tripsCompleted = 12;
    dto.countriesVisited = 8;
    dto.citiesVisited = 25;
    dto.kmTraveled = 45000;
    dto.tripsAsOrganizer = 3;

    expect(dto.tripsCompleted).toBe(12);
    expect(dto.countriesVisited).toBe(8);
    expect(dto.citiesVisited).toBe(25);
    expect(dto.kmTraveled).toBe(45000);
    expect(dto.tripsAsOrganizer).toBe(3);
  });
});

describe('PublicProfileResponseDto', () => {
  it('can be instantiated and assigned values', () => {
    const dto = new PublicProfileResponseDto();
    dto.username = 'jsmith';
    dto.displayName = 'John Smith';
    dto.avatarUrl = null;
    dto.bio = null;
    dto.travelerScore = null;
    dto.achievements = null;
    dto.recognitions = null;
    dto.keyStats = null;
    dto.discoveryMap = null;

    expect(dto.username).toBe('jsmith');
    expect(dto.keyStats).toBeNull();
  });
});
