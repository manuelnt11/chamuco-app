import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { TripsDestinationsController } from './trips-destinations.controller';
import { TripsDestinationsService } from './trips-destinations.service';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({})),
}));

const mockUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'john_doe',
  displayName: 'John Doe',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockDestResponse: DestinationResponseDto = {
  id: 'dest-uuid',
  tripId: 'trip-uuid',
  position: 1,
  countryCode: 'MX',
  city: 'CANCUN',
  label: null,
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
