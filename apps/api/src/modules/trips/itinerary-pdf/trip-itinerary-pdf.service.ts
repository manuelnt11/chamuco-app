import { readFileSync } from 'fs';
import { join } from 'path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Handlebars from 'handlebars';
import { marked } from 'marked';
import { PDFDocument } from 'pdf-lib';
import sanitizeHtml from 'sanitize-html';

import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { resolveCallerLanguage } from '@/modules/trips/caller-language.util';
import { TripsService } from '@/modules/trips/trips.service';
import { TripsDestinationsService } from '@/modules/trips/destinations/trips-destinations.service';
import { TripParticipantsService } from '@/modules/trips/participants/trip-participants.service';
import type { TripResponseDto } from '@/modules/trips/dto/trip-response.dto';
import type { DestinationResponseDto } from '@/modules/trips/destinations/dto/destination-response.dto';

// Itinerary notes/destination text is organizer-authored markdown, converted to HTML and
// rendered by a real (scriptable, networked) Chromium instance. marked passes raw HTML through
// unsanitized by default, so without this allowlist an organizer could embed <script>,
// <img onerror=...>, or <iframe src="http://169.254.169.254/..."> and trigger server-side script
// execution or SSRF against the container's network the moment anyone exports the PDF.
// No <img> here on purpose: the only intentional image in the document is the trip cover, bound
// directly in the template — user-authored content never gets a tag that can trigger a fetch.
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'h1',
    'h2',
    'h3',
    'h4',
    'blockquote',
    'code',
    'pre',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
  ],
  allowedAttributes: { a: ['href'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  disallowedTagsMode: 'discard',
};

// Render timeout for the whole page (navigation + any resource the trip cover image needs to
// load) — bounds worst-case latency per PDF export instead of trusting Puppeteer's own default.
const RENDER_TIMEOUT_MS = 10_000;

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
  description: string | null;
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

const WATERMARK_OPACITY = 0.06;
// Fraction of each page's width the watermark image occupies — its height follows from its own
// aspect ratio (280x320), so this alone keeps it proportionally sized across page formats.
const WATERMARK_WIDTH_RATIO = 0.6;

@Injectable()
export class TripItineraryPdfService {
  private readonly logger = new Logger(TripItineraryPdfService.name);
  private compiledTemplate: Handlebars.TemplateDelegate<ItineraryPdfContext> | null = null;
  private watermarkPng: Buffer | null = null;

  constructor(
    @Inject(DRIZZLE_CLIENT) private readonly db: DrizzleClient,
    private readonly tripsService: TripsService,
    private readonly tripsDestinationsService: TripsDestinationsService,
    private readonly tripParticipantsService: TripParticipantsService,
    private readonly config: ConfigService,
  ) {}

  async generate(tripId: string, requestingUserId: string): Promise<Buffer> {
    await this.tripParticipantsService.assertActiveParticipant(tripId, requestingUserId);

    const [trip, destinations, lang] = await Promise.all([
      this.tripsService.getTrip(tripId),
      this.tripsDestinationsService.listDestinations(tripId),
      resolveCallerLanguage(this.db, requestingUserId),
    ]);

    const context = this.buildContext(trip, destinations, lang);
    const html = this.renderHtml(context);
    return this.renderPdf(html, context);
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
      description: trip.description,
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
    const html = marked.parse(source, { async: false });
    return sanitizeHtml(html, SANITIZE_OPTIONS);
  }

  private async renderPdf(html: string, context: ItineraryPdfContext): Promise<Buffer> {
    // puppeteer-core is ESM-only; dynamic import lets this CJS-compiled service load it
    // without forcing every static importer of this file to parse its ESM dependency tree.
    const { launch } = await import('puppeteer-core');
    const browser = await launch({
      executablePath: this.config.get<string>('CHROMIUM_EXECUTABLE_PATH'),
      headless: true,
      // --disable-dev-shm-usage: Docker/Cloud Run default /dev/shm to ~64MB, which Chromium's
      // renderer can exhaust under real page content, crashing mid-render; this makes it fall
      // back to disk-backed shared memory instead.
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      // The template needs no JavaScript — disabling it removes any script-execution path
      // (e.g. an onerror handler) that sanitization missed, as defense in depth.
      await page.setJavaScriptEnabled(false);
      page.setDefaultNavigationTimeout(RENDER_TIMEOUT_MS);
      await page.setContent(html, { waitUntil: 'load', timeout: RENDER_TIMEOUT_MS });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '40px', right: '40px', bottom: '70px', left: '40px' },
        displayHeaderFooter: true,
        headerTemplate: '<span></span>',
        // Chromium renders header/footer templates in an isolated context (no access to the
        // main document's <style>), so this needs its own inline styles. pageNumber/totalPages
        // are special classes Chromium fills in per page — this is what makes the footer repeat,
        // correctly numbered, on every page instead of once at the end of the document flow.
        footerTemplate: `
          <div style="width:100%;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:9px;color:#94a3b8;padding:6px 40px 0;border-top:1px solid #bae6fd;display:flex;justify-content:space-between;">
            <span>${context.labels.generatedOn} ${context.generatedAt} &middot; Chamuco Travel</span>
            <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>
        `,
      });
      return this.applyWatermark(pdf);
    } finally {
      // Swallow (don't await-throw) a close() failure here — if the try block above already
      // threw (e.g. Chromium's renderer crashed), letting close() reject too would replace that
      // real, actionable error with an unrelated "close" one in the caller's catch.
      await browser.close().catch((err: unknown) => {
        this.logger.warn(`Failed to close Chromium after render: ${String(err)}`);
      });
    }
  }

  // Neither `position: fixed` nor a `background-attachment: fixed` image reliably repeats per
  // printed page in Chromium's PDF engine — both were verified (via a real multi-page render) to
  // behave like one tall canvas: the watermark landed on one arbitrary page, or none, instead of
  // every page. Drawing it onto each page of the already-generated PDF with pdf-lib is the
  // approach that actually guarantees "every page", because it operates on the PDF's real page
  // list rather than depending on how Chromium chose to paginate a CSS layout.
  private async applyWatermark(pdfBytes: Uint8Array): Promise<Buffer> {
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const watermarkImage = await pdfDoc.embedPng(this.getWatermarkPng());
    const aspectRatio = watermarkImage.height / watermarkImage.width;

    for (const page of pdfDoc.getPages()) {
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const width = pageWidth * WATERMARK_WIDTH_RATIO;
      const height = width * aspectRatio;
      page.drawImage(watermarkImage, {
        x: (pageWidth - width) / 2,
        y: (pageHeight - height) / 2,
        width,
        height,
        opacity: WATERMARK_OPACITY,
      });
    }

    return Buffer.from(await pdfDoc.save());
  }

  private getWatermarkPng(): Buffer {
    if (!this.watermarkPng) {
      this.watermarkPng = readFileSync(join(__dirname, 'templates', 'watermark.png'));
    }
    return this.watermarkPng;
  }
}
