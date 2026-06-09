import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  PlatformRole,
  ProfileVisibility,
  TripStatus,
  TripVisibility,
} from '@chamuco/shared-types';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import type { TripResponseDto } from './dto/trip-response.dto';
import type { CreateDestinationDto } from './dto/create-destination.dto';
import type { UpdateDestinationDto } from './dto/update-destination.dto';
import type { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import type {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';
import type { AuthenticatedUser } from '@/types/express';

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

const mockResponse: TripResponseDto = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: null,
  status: TripStatus.DRAFT,
  visibility: TripVisibility.PUBLIC,
  startDate: '2026-12-01',
  endDate: '2026-12-08',
  participantCapacity: 10,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CANCUN',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: null,
  agencyId: null,
  createdBy: 'user-uuid',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
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

describe('TripsController', () => {
  let controller: TripsController;
  let mockCreateTrip: jest.Mock;
  let mockGetTrip: jest.Mock;
  let mockUpdateTrip: jest.Mock;
  let mockDeleteTrip: jest.Mock;
  let mockTransitionStatus: jest.Mock;
  let mockListDestinations: jest.Mock;
  let mockAddDestination: jest.Mock;
  let mockUpdateDestination: jest.Mock;
  let mockDeleteDestination: jest.Mock;
  let mockReorderDestinations: jest.Mock;

  beforeEach(async () => {
    mockCreateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockGetTrip = jest.fn().mockResolvedValue(mockResponse);
    mockUpdateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockDeleteTrip = jest.fn().mockResolvedValue(undefined);
    mockTransitionStatus = jest.fn().mockResolvedValue(mockResponse);
    mockListDestinations = jest.fn().mockResolvedValue([mockDestResponse]);
    mockAddDestination = jest.fn().mockResolvedValue(mockDestWriteResponse);
    mockUpdateDestination = jest.fn().mockResolvedValue(mockDestWriteResponse);
    mockDeleteDestination = jest.fn().mockResolvedValue(undefined);
    mockReorderDestinations = jest.fn().mockResolvedValue([mockDestResponse]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: {
            createTrip: mockCreateTrip,
            getTrip: mockGetTrip,
            updateTrip: mockUpdateTrip,
            deleteTrip: mockDeleteTrip,
            transitionStatus: mockTransitionStatus,
            listDestinations: mockListDestinations,
            addDestination: mockAddDestination,
            updateDestination: mockUpdateDestination,
            deleteDestination: mockDeleteDestination,
            reorderDestinations: mockReorderDestinations,
          },
        },
      ],
    }).compile();

    controller = module.get<TripsController>(TripsController);
  });

  it('createTrip delegates to service', async () => {
    const dto: CreateTripDto = {
      name: 'Cancún 2026',
      visibility: TripVisibility.PUBLIC,
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      participantCapacity: 10,
      departureCountry: 'MX',
      departureCity: 'CIUDAD DE MEXICO',
      landingCountry: 'MX',
      landingCity: 'CANCUN',
      isTravelingParticipant: true,
    };

    const result = await controller.createTrip(mockUser, dto);

    expect(mockCreateTrip).toHaveBeenCalledWith(mockUser, dto);
    expect(result).toBe(mockResponse);
  });

  it('getTrip delegates to service', async () => {
    const result = await controller.getTrip('trip-uuid');

    expect(mockGetTrip).toHaveBeenCalledWith('trip-uuid');
    expect(result).toBe(mockResponse);
  });

  it('updateTrip delegates to service', async () => {
    const dto: UpdateTripDto = { name: 'Updated' };

    const result = await controller.updateTrip(mockUser, 'trip-uuid', dto);

    expect(mockUpdateTrip).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockResponse);
  });

  it('deleteTrip delegates to service', async () => {
    await controller.deleteTrip(mockUser, 'trip-uuid');

    expect(mockDeleteTrip).toHaveBeenCalledWith(mockUser, 'trip-uuid');
  });

  it('transitionStatus delegates to service', async () => {
    const dto: TransitionTripStatusDto = { status: TripStatus.OPEN };

    const result = await controller.transitionStatus(mockUser, 'trip-uuid', dto);

    expect(mockTransitionStatus).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockResponse);
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
