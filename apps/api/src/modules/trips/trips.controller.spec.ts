import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { TripRole, TripStatus, TripVisibility } from '@chamuco/shared-types';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { TripDiscoveryService } from './discovery/trip-discovery.service';
import { TripJoinRequestsService } from './join-requests/trip-join-requests.service';
import { TripItineraryPdfService } from './itinerary-pdf/trip-itinerary-pdf.service';
import type { CreateTripDto } from './dto/create-trip.dto';
import type { UpdateTripDto } from './dto/update-trip.dto';
import type { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import type { TripResponseDto } from './dto/trip-response.dto';
import type { MyTripListItemResponseDto } from './dto/my-trip-list-item-response.dto';
import type { MyTripJoinRequestResponseDto } from './join-requests/dto/my-trip-join-request-response.dto';
import { makeAuthenticatedUser } from '@/test/fixtures/user.fixture';

const mockUser = makeAuthenticatedUser();

const mockListItemResponse: MyTripListItemResponseDto = {
  id: 'trip-uuid',
  name: 'Cancún 2026',
  description: null,
  status: TripStatus.OPEN,
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
  coverUrl: null,
  confirmedParticipantCount: 3,
  userRole: TripRole.ORGANIZER,
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
  coverUrl: null,
};

describe('TripsController', () => {
  let controller: TripsController;
  let mockGetMyTrips: jest.Mock;
  let mockCreateTrip: jest.Mock;
  let mockGetTrip: jest.Mock;
  let mockUpdateTrip: jest.Mock;
  let mockDeleteTrip: jest.Mock;
  let mockTransitionStatus: jest.Mock;
  let mockListMyPendingRequests: jest.Mock;
  let mockGenerateItineraryPdf: jest.Mock;

  beforeEach(async () => {
    mockGetMyTrips = jest.fn().mockResolvedValue([mockListItemResponse]);
    mockCreateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockGetTrip = jest.fn().mockResolvedValue(mockResponse);
    mockUpdateTrip = jest.fn().mockResolvedValue(mockResponse);
    mockDeleteTrip = jest.fn().mockResolvedValue(undefined);
    mockTransitionStatus = jest.fn().mockResolvedValue(mockResponse);
    mockListMyPendingRequests = jest.fn().mockResolvedValue([]);
    mockGenerateItineraryPdf = jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4'));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsController],
      providers: [
        {
          provide: TripsService,
          useValue: {
            getMyTrips: mockGetMyTrips,
            createTrip: mockCreateTrip,
            getTrip: mockGetTrip,
            updateTrip: mockUpdateTrip,
            deleteTrip: mockDeleteTrip,
            transitionStatus: mockTransitionStatus,
          },
        },
        {
          provide: TripDiscoveryService,
          useValue: { searchTrips: jest.fn().mockResolvedValue({ data: [], total: 0 }) },
        },
        {
          provide: TripJoinRequestsService,
          useValue: { listMyPendingRequests: mockListMyPendingRequests },
        },
        {
          provide: TripItineraryPdfService,
          useValue: { generate: mockGenerateItineraryPdf },
        },
      ],
    }).compile();

    controller = module.get<TripsController>(TripsController);
  });

  it('getMyTrips delegates to service', async () => {
    const result = await controller.getMyTrips(mockUser);

    expect(mockGetMyTrips).toHaveBeenCalledWith(mockUser);
    expect(result).toEqual([mockListItemResponse]);
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
      cover: { source: 'emoji', target: '🏖️' },
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

  describe('GET /v1/trips/:id/itinerary/pdf', () => {
    const mockRes = () => ({ set: jest.fn() }) as unknown as Response;

    it('delegates to TripItineraryPdfService and streams a PDF', async () => {
      const res = mockRes();
      const result = await controller.exportItineraryPdf(mockUser, 'trip-uuid', res);

      expect(mockGenerateItineraryPdf).toHaveBeenCalledWith('trip-uuid', mockUser.id);
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/pdf',
          'Content-Disposition': expect.stringContaining('itinerary-trip-uuid.pdf'),
        }),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });

  it('listMyPendingJoinRequests delegates to TripJoinRequestsService', async () => {
    const mockJoinRequest: MyTripJoinRequestResponseDto = {
      tripId: 'trip-uuid',
      name: 'Cancún 2026',
      coverUrl: null,
      visibility: TripVisibility.PUBLIC,
      startDate: '2026-12-01',
      endDate: '2026-12-08',
      initiatedAt: '2026-01-01T00:00:00.000Z',
    };
    mockListMyPendingRequests.mockResolvedValueOnce([mockJoinRequest]);

    const result = await controller.listMyPendingJoinRequests(mockUser);

    expect(mockListMyPendingRequests).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual([mockJoinRequest]);
  });
});
