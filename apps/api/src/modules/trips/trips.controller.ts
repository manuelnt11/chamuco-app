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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripResponseDto } from './dto/trip-response.dto';
import { TransitionTripStatusDto } from './dto/transition-trip-status.dto';
import { CreateDestinationDto } from './dto/create-destination.dto';
import { UpdateDestinationDto } from './dto/update-destination.dto';
import { ReorderDestinationsDto } from './dto/reorder-destinations.dto';
import {
  DestinationResponseDto,
  DestinationWriteResponseDto,
} from './dto/destination-response.dto';

@ApiTags('trips')
@ApiBearerAuth()
@Controller('v1/trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

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

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: TripResponseDto })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async getTrip(@Param('id', ParseUUIDPipe) id: string): Promise<TripResponseDto> {
    return this.tripsService.getTrip(id);
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

  @Get(':id/destinations')
  @ApiOperation({
    summary: 'List trip destinations',
    description: 'Returns all destinations ordered by position.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [DestinationResponseDto] })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async listDestinations(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DestinationResponseDto[]> {
    return this.tripsService.listDestinations(id);
  }

  @Post(':id/destinations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a destination',
    description:
      'Appends a destination to the trip. ORGANIZER or CO_ORGANIZER only. ' +
      'Returns requiresConfirmation=true when trip is IN_PROGRESS.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 201, type: DestinationWriteResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiForbiddenResponse({ description: 'Not an organizer, or trip is COMPLETED/CANCELLED.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async addDestination(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateDestinationDto,
  ): Promise<DestinationWriteResponseDto> {
    return this.tripsService.addDestination(user, id, dto);
  }

  @Patch(':id/destinations/reorder')
  @ApiOperation({
    summary: 'Reorder destinations',
    description:
      'Reassigns positions atomically. Must include all destination IDs for the trip. ' +
      'Array index 0 → position 1.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [DestinationResponseDto] })
  @ApiBadRequestResponse({ description: "destinationIds does not match the trip's destinations." })
  @ApiForbiddenResponse({ description: 'Not an organizer, or trip is COMPLETED/CANCELLED.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async reorderDestinations(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReorderDestinationsDto,
  ): Promise<DestinationResponseDto[]> {
    return this.tripsService.reorderDestinations(user, id, dto);
  }

  @Patch(':id/destinations/:destId')
  @ApiOperation({
    summary: 'Update a destination',
    description:
      'Updates country, city, or label. ORGANIZER or CO_ORGANIZER only. ' +
      'Returns requiresConfirmation=true when trip is IN_PROGRESS.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'destId', type: String, description: 'Destination UUID' })
  @ApiResponse({ status: 200, type: DestinationWriteResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiForbiddenResponse({ description: 'Not an organizer, or trip is COMPLETED/CANCELLED.' })
  @ApiNotFoundResponse({ description: 'Trip or destination not found.' })
  async updateDestination(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('destId', ParseUUIDPipe) destId: string,
    @Body() dto: UpdateDestinationDto,
  ): Promise<DestinationWriteResponseDto> {
    return this.tripsService.updateDestination(user, id, destId, dto);
  }

  @Delete(':id/destinations/:destId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a destination',
    description: 'Deletes a destination. Cannot delete if it is the last one.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'destId', type: String, description: 'Destination UUID' })
  @ApiResponse({ status: 204, description: 'Destination deleted.' })
  @ApiForbiddenResponse({ description: 'Not an organizer, or trip is COMPLETED/CANCELLED.' })
  @ApiNotFoundResponse({ description: 'Trip or destination not found.' })
  @ApiUnprocessableEntityResponse({ description: 'Cannot delete the last destination.' })
  async deleteDestination(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('destId', ParseUUIDPipe) destId: string,
  ): Promise<void> {
    return this.tripsService.deleteDestination(user, id, destId);
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
