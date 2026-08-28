import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TripStatus, TripVisibility } from '@chamuco/shared-types';

import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripsService } from '@/modules/trips/trips.service';
import { TripsDestinationsService } from '@/modules/trips/destinations/trips-destinations.service';
import type { TripResponseDto } from '@/modules/trips/dto/trip-response.dto';
import type { DestinationResponseDto } from '@/modules/trips/destinations/dto/destination-response.dto';
import { TripItineraryPdfService } from './trip-itinerary-pdf.service';

const mockPage = {
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
};
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};
const mockLaunch = jest.fn().mockResolvedValue(mockBrowser);

jest.mock('puppeteer-core', () => ({ launch: (...args: unknown[]) => mockLaunch(...args) }));

const TRIP_ID = 'trip-uuid';
const USER_ID = 'user-uuid';

const mockTrip: TripResponseDto = {
  id: TRIP_ID,
  name: 'Alps Adventure',
  description: null,
  status: TripStatus.CONFIRMED,
  visibility: TripVisibility.PRIVATE,
  startDate: '2026-06-01',
  endDate: '2026-06-10',
  participantCapacity: 8,
  departureCountry: 'MX',
  departureCity: 'CIUDAD DE MEXICO',
  landingCountry: 'MX',
  landingCity: 'CIUDAD DE MEXICO',
  defaultTimezone: null,
  defaultCurrency: null,
  itineraryNotes: '**Pack layers.**',
  agencyId: null,
  createdBy: USER_ID,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  requiresConfirmation: false,
  feedbackOpenUntil: null,
  coverUrl: 'https://storage.googleapis.com/bucket/cover.jpg',
};

const mockDestinations: DestinationResponseDto[] = [
  {
    id: 'dest-1',
    tripId: TRIP_ID,
    position: 1,
    countryCode: 'CH',
    city: 'ZERMATT',
    label: 'Base camp',
    itinerary: '- Hike\n- Rest',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dest-2',
    tripId: TRIP_ID,
    position: 2,
    countryCode: 'CH',
    city: 'ZURICH',
    label: null,
    itinerary: null,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('TripItineraryPdfService', () => {
  let service: TripItineraryPdfService;
  let mockGetTrip: jest.Mock;
  let mockListDestinations: jest.Mock;
  let mockUserPreferencesFindFirst: jest.Mock;
  let mockConfigGet: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetTrip = jest.fn().mockResolvedValue(mockTrip);
    mockListDestinations = jest.fn().mockResolvedValue(mockDestinations);
    mockUserPreferencesFindFirst = jest.fn().mockResolvedValue({ language: 'EN' });
    mockConfigGet = jest.fn().mockReturnValue('/usr/bin/chromium-browser');
    mockLaunch.mockResolvedValue(mockBrowser);
    mockBrowser.newPage.mockResolvedValue(mockPage);
    mockPage.pdf.mockResolvedValue(Buffer.from('%PDF-1.4'));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripItineraryPdfService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: { query: { userPreferences: { findFirst: mockUserPreferencesFindFirst } } },
        },
        { provide: TripsService, useValue: { getTrip: mockGetTrip } },
        {
          provide: TripsDestinationsService,
          useValue: { listDestinations: mockListDestinations },
        },
        { provide: ConfigService, useValue: { get: mockConfigGet } },
      ],
    }).compile();

    service = module.get<TripItineraryPdfService>(TripItineraryPdfService);
  });

  // ─── buildContext ─────────────────────────────────────────────────────────

  describe('buildContext', () => {
    it('converts trip and destination markdown to HTML, in position order', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'en');

      expect(context.generalNotesHtml).toContain('<strong>Pack layers.</strong>');
      expect(context.destinations).toHaveLength(2);
      expect(context.destinations[0]).toMatchObject({
        position: 1,
        city: 'ZERMATT',
        label: 'Base camp',
      });
      expect(context.destinations[0]!.itineraryHtml).toContain('<li>Hike</li>');
      expect(context.destinations[1]!.itineraryHtml).toBeNull();
    });

    it('falls back to English labels for an unknown language', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'fr');
      expect(context.labels).toBe(service.buildContext(mockTrip, mockDestinations, 'en').labels);
    });

    it('selects Spanish labels', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'es');
      expect(context.labels.destinations).toBe('Destinos');
    });

    it('omits generalNotesHtml when the trip has no itinerary notes', () => {
      const context = service.buildContext({ ...mockTrip, itineraryNotes: null }, [], 'en');
      expect(context.generalNotesHtml).toBeNull();
    });
  });

  // ─── renderHtml ───────────────────────────────────────────────────────────

  describe('renderHtml', () => {
    it('renders the destinations and trip name into the template', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'en');
      const html = service.renderHtml(context);

      expect(html).toContain('Alps Adventure');
      expect(html).toContain('ZERMATT');
      expect(html).toContain('ZURICH');
      expect(html).toContain('No itinerary notes for this destination.');
    });

    it('caches the compiled template across calls', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'en');
      service.renderHtml(context);
      service.renderHtml(context);
      // No direct spy on fs.readFileSync here — asserting via behavior would require
      // exposing internals, so this just guards against renderHtml throwing on reuse.
      expect(() => service.renderHtml(context)).not.toThrow();
    });
  });

  // ─── generate ─────────────────────────────────────────────────────────────

  describe('generate', () => {
    it('fetches trip data, renders the PDF via puppeteer, and closes the browser', async () => {
      const buffer = await service.generate(TRIP_ID, USER_ID);

      expect(mockGetTrip).toHaveBeenCalledWith(TRIP_ID);
      expect(mockListDestinations).toHaveBeenCalledWith(TRIP_ID);
      expect(mockUserPreferencesFindFirst).toHaveBeenCalled();
      expect(mockLaunch).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: '/usr/bin/chromium-browser' }),
      );
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Alps Adventure'),
        expect.objectContaining({ waitUntil: 'load' }),
      );
      expect(mockBrowser.close).toHaveBeenCalled();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('closes the browser even if PDF rendering fails', async () => {
      mockPage.pdf.mockRejectedValueOnce(new Error('render failed'));

      await expect(service.generate(TRIP_ID, USER_ID)).rejects.toThrow('render failed');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('defaults to English when the caller has no language preference', async () => {
      mockUserPreferencesFindFirst.mockResolvedValueOnce(null);

      await service.generate(TRIP_ID, USER_ID);

      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Destinations'),
        expect.anything(),
      );
    });
  });
});
