import { Test, TestingModule } from '@nestjs/testing';
import { TripsDestinationsController } from './trips-destinations.controller';
import { TripsDestinationsService } from './trips-destinations.service';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';
import { makeAuthenticatedUser } from '@/test/fixtures/user.fixture';

const mockUser = makeAuthenticatedUser();

const mockDestResponse: DestinationResponseDto = {
  id: 'dest-uuid',
  tripId: 'trip-uuid',
  position: 1,
  countryCode: 'MX',
  city: 'CANCUN',
  label: null,
  itinerary: null,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const mockDestWriteResponse: DestinationWriteResponseDto = {
  ...mockDestResponse,
  requiresConfirmation: false,
};

describe('TripsDestinationsController', () => {
  let controller: TripsDestinationsController;
  let mockListDestinations: jest.Mock;
  let mockAddDestination: jest.Mock;
  let mockUpdateDestination: jest.Mock;
  let mockDeleteDestination: jest.Mock;
  let mockReorderDestinations: jest.Mock;

  beforeEach(async () => {
    mockListDestinations = jest.fn().mockResolvedValue([mockDestResponse]);
    mockAddDestination = jest.fn().mockResolvedValue(mockDestWriteResponse);
    mockUpdateDestination = jest.fn().mockResolvedValue(mockDestWriteResponse);
    mockDeleteDestination = jest.fn().mockResolvedValue(undefined);
    mockReorderDestinations = jest.fn().mockResolvedValue([mockDestResponse]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsDestinationsController],
      providers: [
        {
          provide: TripsDestinationsService,
          useValue: {
            listDestinations: mockListDestinations,
            addDestination: mockAddDestination,
            updateDestination: mockUpdateDestination,
            deleteDestination: mockDeleteDestination,
            reorderDestinations: mockReorderDestinations,
          },
        },
      ],
    }).compile();

    controller = module.get<TripsDestinationsController>(TripsDestinationsController);
  });

  it('listDestinations delegates to service', async () => {
    const result = await controller.listDestinations('trip-uuid');

    expect(mockListDestinations).toHaveBeenCalledWith('trip-uuid');
    expect(result).toEqual([mockDestResponse]);
  });

  it('addDestination delegates to service', async () => {
    const dto: CreateDestinationDto = { countryCode: 'MX', city: 'CANCUN' };

    const result = await controller.addDestination(mockUser, 'trip-uuid', dto);

    expect(mockAddDestination).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockDestWriteResponse);
  });

  it('updateDestination delegates to service', async () => {
    const dto: UpdateDestinationDto = { city: 'TULUM' };

    const result = await controller.updateDestination(mockUser, 'trip-uuid', 'dest-uuid', dto);

    expect(mockUpdateDestination).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'dest-uuid', dto);
    expect(result).toBe(mockDestWriteResponse);
  });

  it('deleteDestination delegates to service', async () => {
    await controller.deleteDestination(mockUser, 'trip-uuid', 'dest-uuid');

    expect(mockDeleteDestination).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'dest-uuid');
  });

  it('reorderDestinations delegates to service', async () => {
    const dto: ReorderDestinationsDto = { destinationIds: ['dest-uuid'] };

    const result = await controller.reorderDestinations(mockUser, 'trip-uuid', dto);

    expect(mockReorderDestinations).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toEqual([mockDestResponse]);
  });
});
