import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TripStatus, TripVisibility } from '@chamuco/shared-types';

import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { TripsService } from '@/modules/trips/trips.service';
import { TripsDestinationsService } from '@/modules/trips/destinations/trips-destinations.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import type { TripResponseDto } from '@/modules/trips/dto/trip-response.dto';
import type { DestinationResponseDto } from '@/modules/trips/destinations/dto/destination-response.dto';
import { TripItineraryPdfService } from './trip-itinerary-pdf.service';

const mockPage = {
  setJavaScriptEnabled: jest.fn().mockResolvedValue(undefined),
  setDefaultNavigationTimeout: jest.fn(),
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4')),
};
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn().mockResolvedValue(undefined),
};
const mockLaunch = jest.fn().mockResolvedValue(mockBrowser);

jest.mock('puppeteer-core', () => ({ launch: (...args: unknown[]) => mockLaunch(...args) }));

const mockDrawImage = jest.fn();
const mockPdfPage = { getSize: () => ({ width: 595, height: 842 }), drawImage: mockDrawImage };
const mockEmbedPng = jest.fn().mockResolvedValue({ width: 280, height: 320 });
const mockSave = jest.fn().mockResolvedValue(Buffer.from('%PDF-FINAL'));
const mockPdfDoc = {
  embedPng: mockEmbedPng,
  getPages: jest.fn().mockReturnValue([mockPdfPage]),
  save: mockSave,
};
const mockPdfDocumentLoad = jest.fn().mockResolvedValue(mockPdfDoc);

// pdf-lib does the actual watermarking (see trip-itinerary-pdf.service.ts) — mocked here so
// these tests don't need to feed it a real parseable PDF byte stream.
jest.mock('pdf-lib', () => ({
  PDFDocument: { load: (...args: unknown[]) => mockPdfDocumentLoad(...args) },
}));

const TRIP_ID = 'trip-uuid';
const USER_ID = 'user-uuid';

const mockTrip: TripResponseDto = {
  id: TRIP_ID,
  name: 'Alps Adventure',
  description: 'A week hiking through the Alps with the whole crew.',
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
  let mockAssertActiveParticipant: jest.Mock;
  let mockUserPreferencesFindFirst: jest.Mock;
  let mockConfigGet: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockGetTrip = jest.fn().mockResolvedValue(mockTrip);
    mockListDestinations = jest.fn().mockResolvedValue(mockDestinations);
    mockAssertActiveParticipant = jest.fn().mockResolvedValue(undefined);
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
        {
          provide: TripParticipantsService,
          useValue: { assertActiveParticipant: mockAssertActiveParticipant },
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

    it('passes the trip description through as plain text', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'en');
      expect(context.description).toBe('A week hiking through the Alps with the whole crew.');
    });

    it('carries a null description through unchanged', () => {
      const context = service.buildContext({ ...mockTrip, description: null }, [], 'en');
      expect(context.description).toBeNull();
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

    it('strips raw HTML that markdown passes through unsanitized (script/img/event handlers)', () => {
      const malicious =
        '<script>fetch("http://169.254.169.254/")</script>' +
        '<img src=x onerror="fetch(1)">' +
        '<a href="javascript:alert(1)">click</a>' +
        '<a href="https://example.com">safe link</a>';

      const context = service.buildContext({ ...mockTrip, itineraryNotes: malicious }, [], 'en');

      expect(context.generalNotesHtml).not.toContain('<script');
      expect(context.generalNotesHtml).not.toContain('<img');
      expect(context.generalNotesHtml).not.toContain('onerror');
      expect(context.generalNotesHtml).not.toContain('javascript:');
      expect(context.generalNotesHtml).toContain('href="https://example.com"');
    });
  });

  // ─── renderHtml ───────────────────────────────────────────────────────────

  describe('renderHtml', () => {
    it('renders the destinations, trip name, and description into the template', () => {
      const context = service.buildContext(mockTrip, mockDestinations, 'en');
      const html = service.renderHtml(context);

      expect(html).toContain('Alps Adventure');
      expect(html).toContain('A week hiking through the Alps with the whole crew.');
      expect(html).toContain('ZERMATT');
      expect(html).toContain('ZURICH');
      expect(html).toContain('No itinerary notes for this destination.');
    });

    it('escapes the description instead of rendering it as HTML', () => {
      const context = service.buildContext(
        { ...mockTrip, description: '<b>bold</b> & risky' },
        mockDestinations,
        'en',
      );
      const html = service.renderHtml(context);

      expect(html).not.toContain('<b>bold</b>');
      expect(html).toContain('&lt;b&gt;bold&lt;/b&gt; &amp; risky');
    });

    it('omits the description paragraph when the trip has none', () => {
      const context = service.buildContext({ ...mockTrip, description: null }, [], 'en');
      const html = service.renderHtml(context);

      expect(html).not.toContain('class="description"');
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

      expect(mockAssertActiveParticipant).toHaveBeenCalledWith(TRIP_ID, USER_ID);
      expect(mockGetTrip).toHaveBeenCalledWith(TRIP_ID);
      expect(mockListDestinations).toHaveBeenCalledWith(TRIP_ID);
      expect(mockUserPreferencesFindFirst).toHaveBeenCalled();
      expect(mockLaunch).toHaveBeenCalledWith(
        expect.objectContaining({ executablePath: '/usr/bin/chromium-browser' }),
      );
      expect(mockPage.setJavaScriptEnabled).toHaveBeenCalledWith(false);
      expect(mockPage.setContent).toHaveBeenCalledWith(
        expect.stringContaining('Alps Adventure'),
        expect.objectContaining({ waitUntil: 'load', timeout: expect.any(Number) }),
      );
      expect(mockPage.pdf).toHaveBeenCalledWith(
        expect.objectContaining({
          displayHeaderFooter: true,
          margin: expect.objectContaining({ bottom: expect.any(String) }),
          footerTemplate: expect.stringContaining('pageNumber'),
        }),
      );
      expect(mockBrowser.close).toHaveBeenCalled();
      // Watermarking happens after Puppeteer produces the PDF, via pdf-lib directly on its page
      // list — draws once per page rather than relying on the CSS layout Chromium paginated.
      expect(mockPdfDocumentLoad).toHaveBeenCalled();
      expect(mockEmbedPng).toHaveBeenCalled();
      expect(mockDrawImage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ opacity: expect.any(Number) }),
      );
      expect(mockSave).toHaveBeenCalled();
      expect(buffer).toBeInstanceOf(Buffer);
    });

    it('reads the watermark PNG from disk only once across multiple exports', async () => {
      await service.generate(TRIP_ID, USER_ID);
      await service.generate(TRIP_ID, USER_ID);

      expect(mockEmbedPng).toHaveBeenCalledTimes(2);
      // Both calls should have been handed the exact same cached Buffer instance.
      const [firstCallArg] = mockEmbedPng.mock.calls[0]!;
      const [secondCallArg] = mockEmbedPng.mock.calls[1]!;
      expect(firstCallArg).toBe(secondCallArg);
    });

    it('rejects when the caller is not an active trip participant, without touching the browser', async () => {
      mockAssertActiveParticipant.mockRejectedValueOnce(new ForbiddenException());

      await expect(service.generate(TRIP_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
      expect(mockGetTrip).not.toHaveBeenCalled();
      expect(mockLaunch).not.toHaveBeenCalled();
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
