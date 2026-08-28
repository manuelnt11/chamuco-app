import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { MyTripListItemResponseDto } from './dto/my-trip-list-item-response.dto';
import { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import { TripDiscoveryService } from './discovery/trip-discovery.service';
import { SearchTripsQueryDto } from './discovery/dto/search-trips-query.dto';
import { TripSearchResponseDto } from './discovery/dto/trip-search-result.dto';
import { TripJoinRequestsService } from './join-requests/trip-join-requests.service';
import { MyTripJoinRequestResponseDto } from './join-requests/dto/my-trip-join-request-response.dto';
import { TripItineraryPdfService } from './itinerary-pdf/trip-itinerary-pdf.service';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('v1/trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly tripDiscoveryService: TripDiscoveryService,
    private readonly tripJoinRequestsService: TripJoinRequestsService,
    private readonly tripItineraryPdfService: TripItineraryPdfService,
  ) {}

  @Get()
  @ApiOperation({
    summary: "List the authenticated user's trips",
    description:
      'Returns all trips where the authenticated user is an ACCEPTED or CONFIRMED participant. ' +
      "Includes resolved cover URL, confirmed participant count, and the caller's role.",
  })
  @ApiResponse({ status: 200, type: [MyTripListItemResponseDto] })
  async getMyTrips(@CurrentUser() user: AuthenticatedUser): Promise<MyTripListItemResponseDto[]> {
    return this.tripsService.getMyTrips(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a trip',
    description:
      'Creates a new trip in DRAFT status. The authenticated user becomes the first ORGANIZER ' +
      'and is inserted into trip_participants in the same transaction.',
  })
  @ApiResponse({ status: 201, type: TripResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in request body.' })
  async createTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.createTrip(user, dto);
  }

  @Get('join-requests/mine')
  @ApiOperation({
    summary: "List the authenticated user's pending join requests",
    description: 'Returns all trips where the authenticated user has a PENDING_REQUEST.',
  })
  @ApiResponse({ status: 200, type: [MyTripJoinRequestResponseDto] })
  async listMyPendingJoinRequests(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyTripJoinRequestResponseDto[]> {
    return this.tripJoinRequestsService.listMyPendingRequests(user.id);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search public open trips',
    description:
      'Returns paginated PUBLIC + OPEN trips matching the optional name filter. ' +
      "Includes destination list, confirmed participant count, and the caller's participation status.",
  })
  @ApiResponse({ status: 200, type: TripSearchResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  async searchTrips(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchTripsQueryDto,
  ): Promise<TripSearchResponseDto> {
    return this.tripDiscoveryService.searchTrips(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: TripResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async getTrip(@Param('id', ParseUUIDPipe) id: string): Promise<TripResponseDto> {
    return this.tripsService.getTrip(id);
  }

  @Get(':id/itinerary/pdf')
  @ApiOperation({
    summary: 'Export the trip itinerary as a PDF',
    description:
      'Renders trip details (dates, departure/return, cover) plus the itinerary notes for each ' +
      'destination in position order, followed by the general trip-level notes, into a printable ' +
      "PDF. Uses the caller's app language for section labels.",
  })
  @ApiProduces('application/pdf')
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({
    status: 200,
    description: 'PDF file with the trip itinerary.',
    schema: { type: 'string', format: 'binary' },
  })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async exportItineraryPdf(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const buffer = await this.tripItineraryPdfService.generate(id, user.id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="itinerary-${id}.pdf"`,
    });
    return new StreamableFile(buffer);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a trip',
    description:
      'Updates trip fields. ORGANIZER or CO_ORGANIZER only. ' +
      'Returns requiresConfirmation=true when status is CONFIRMED or IN_PROGRESS — ' +
      'participants should be notified of the change. ' +
      'COMPLETED and CANCELLED trips are immutable.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: TripResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation error, or trip is COMPLETED/CANCELLED (immutable), ' +
      'or participantCapacity would be reduced below the confirmed traveler count.',
  })
  @ApiForbiddenResponse({ description: 'Only trip organizers can update this trip.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async updateTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTripDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.updateTrip(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a trip',
    description:
      'Permanently deletes a trip and all its related data. ' +
      'ORGANIZER may delete their own DRAFT trips only. ' +
      'SUPPORT_ADMIN may delete trips in any status.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 204, description: 'Trip deleted.' })
  @ApiForbiddenResponse({
    description:
      'User is not the trip organizer, or trip is not in DRAFT status (non-SUPPORT_ADMIN).',
  })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async deleteTrip(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tripsService.deleteTrip(user, id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Transition trip status',
    description:
      'Manually advances or cancels the trip lifecycle. ORGANIZER only. ' +
      'Valid transitions: DRAFT→OPEN (requires ≥1 destination), DRAFT→CANCELLED, ' +
      'OPEN→CONFIRMED, OPEN→CANCELLED, CONFIRMED→IN_PROGRESS, CONFIRMED→CANCELLED, ' +
      'IN_PROGRESS→COMPLETED, IN_PROGRESS→CANCELLED.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: TripResponseDto })
  @ApiBadRequestResponse({
    description: 'Invalid status transition, or DRAFT→OPEN attempted without any destinations.',
  })
  @ApiForbiddenResponse({ description: 'Only the trip organizer can transition status.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async transitionStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransitionTripStatusDto,
  ): Promise<TripResponseDto> {
    return this.tripsService.transitionStatus(user, id, dto);
  }
}
