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

describe('TripsController', () => {
  let controller: TripsController;
  let mockCreateTrip: jest.Mock;
  let mockGetTrip: jest.Mock;
  let mockUpdateTrip: jest.Mock;
  let mockCancelTrip: jest.Mock;
  let mockTransitionStatus: jest.Mock;

  beforeEach(async () => {
    mockCreateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockGetTrip = jest.fn().mockResolvedValue(mockResponse);
    mockUpdateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockCancelTrip = jest.fn().mockResolvedValue(undefined);
    mockTransitionStatus = jest.fn().mockResolvedValue(mockResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: {
            createTrip: mockCreateTrip,
            getTrip: mockGetTrip,
            updateTrip: mockUpdateTrip,
            cancelTrip: mockCancelTrip,
            transitionStatus: mockTransitionStatus,
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

  it('cancelTrip delegates to service', async () => {
    await controller.cancelTrip(mockUser, 'trip-uuid');

    expect(mockCancelTrip).toHaveBeenCalledWith(mockUser, 'trip-uuid');
  });

  it('transitionStatus delegates to service', async () => {
    const dto: TransitionTripStatusDto = { status: TripStatus.OPEN };

    const result = await controller.transitionStatus(mockUser, 'trip-uuid', dto);

    expect(mockTransitionStatus).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockResponse);
  });
});
