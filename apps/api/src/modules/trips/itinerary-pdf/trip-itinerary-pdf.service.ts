import { readFileSync } from 'fs';
import { join } from 'path';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import Handlebars from 'handlebars';
import { marked } from 'marked';

import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { userPreferences } from '@/modules/users/schema/user-preferences.schema';
import { TripsService } from '@/modules/trips/trips.service';
import { TripsDestinationsService } from '@/modules/trips/destinations/trips-destinations.service';
import type { TripResponseDto } from '@/modules/trips/dto/trip-response.dto';
import type { DestinationResponseDto } from '@/modules/trips/destinations/dto/destination-response.dto';

interface ItineraryPdfLabels {
  dates: string;
  departure: string;
  arrival: string;
  generalNotes: string;
  destinations: string;
  noItinerary: string;
  generatedOn: string;
}

// One-off translation dict for generated document copy — same pattern as
// EXPORT_TRANSLATIONS in TripParticipantsService. Not routed through nestjs-i18n.
const ITINERARY_PDF_TRANSLATIONS: Record<string, ItineraryPdfLabels> = {
  en: {
    dates: 'Dates',
    departure: 'Departure',
    arrival: 'Arrival',
    generalNotes: 'General notes',
    destinations: 'Destinations',
    noItinerary: 'No itinerary notes for this destination.',
    generatedOn: 'Generated on',
  },
  es: {
    dates: 'Fechas',
    departure: 'Salida',
    arrival: 'Llegada',
    generalNotes: 'Notas generales',
    destinations: 'Destinos',
    noItinerary: 'Sin notas de itinerario para este destino.',
    generatedOn: 'Generado el',
  },
};

export interface ItineraryPdfContext {
  lang: string;
  labels: ItineraryPdfLabels;
  tripName: string;
  startDate: string;
  endDate: string;
  coverUrl: string | null;
  departureCity: string;
  departureCountry: string;
  landingCity: string;
  landingCountry: string;
  generalNotesHtml: string | null;
  destinations: Array<{
    position: number;
    city: string;
    countryCode: string;
    label: string | null;
    itineraryHtml: string | null;
  }>;
  generatedAt: string;
}

@Injectable()
export class TripItineraryPdfService {
  private compiledTemplate: Handlebars.TemplateDelegate<ItineraryPdfContext> | null = null;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
    private readonly tripsDestinationsService: TripsDestinationsService,
    private readonly config: ConfigService,
  ) {}

  async generate(tripId: string, requestingUserId: string): Promise<Buffer> {
    const [trip, destinations, prefs] = await Promise.all([
      this.tripsService.getTrip(tripId),
      this.tripsDestinationsService.listDestinations(tripId),
      this.db.query.userPreferences.findFirst({
        where: eq(userPreferences.userId, requestingUserId),
        columns: { language: true },
      }),
    ]);

    const lang = (prefs?.language ?? 'EN').toLowerCase();
    const context = this.buildContext(trip, destinations, lang);
    const html = this.renderHtml(context);
    return this.renderPdf(html);
  }

  buildContext(
    trip: TripResponseDto,
    destinations: DestinationResponseDto[],
    lang: string,
  ): ItineraryPdfContext {
    const labels = ITINERARY_PDF_TRANSLATIONS[lang] ?? ITINERARY_PDF_TRANSLATIONS['en']!;

    return {
      lang,
      labels,
      tripName: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      coverUrl: trip.coverUrl,
      departureCity: trip.departureCity,
      departureCountry: trip.departureCountry,
      landingCity: trip.landingCity,
      landingCountry: trip.landingCountry,
      generalNotesHtml: trip.itineraryNotes ? this.renderMarkdown(trip.itineraryNotes) : null,
      destinations: destinations.map((d) => ({
        position: d.position,
        city: d.city,
        countryCode: d.countryCode,
        label: d.label,
        itineraryHtml: d.itinerary ? this.renderMarkdown(d.itinerary) : null,
      })),
      generatedAt: new Date().toISOString().slice(0, 10),
    };
  }

  renderHtml(context: ItineraryPdfContext): string {
    if (!this.compiledTemplate) {
      const source = readFileSync(join(__dirname, 'templates', 'itinerary.hbs'), 'utf-8');
      this.compiledTemplate = Handlebars.compile<ItineraryPdfContext>(source);
    }
    return this.compiledTemplate(context);
  }

  private renderMarkdown(source: string): string {
    return marked.parse(source, { async: false });
  }

  private async renderPdf(html: string): Promise<Buffer> {
    // puppeteer-core is ESM-only; dynamic import lets this CJS-compiled service load it
    // without forcing every static importer of this file to parse its ESM dependency tree.
    const { launch } = await import('puppeteer-core');
    const browser = await launch({
      executablePath: this.config.get<string>('CHROMIUM_EXECUTABLE_PATH'),
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pdf = await page.pdf({ format: 'A4', printBackground: true });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
