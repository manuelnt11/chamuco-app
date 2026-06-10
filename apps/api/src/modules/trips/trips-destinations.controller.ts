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
import { TripsDestinationsService } from './trips-destinations.service';
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
export class TripsDestinationsController {
  constructor(private readonly tripsDestinationsService: TripsDestinationsService) {}

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
    return this.tripsDestinationsService.listDestinations(id);
  }

  @Post(':id/destinations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a destination',
    description:
      'Appends a destination to the trip. ORGANIZER or CO_ORGANIZER only. ' +
      'Returns requiresConfirmation=true when trip is CONFIRMED or IN_PROGRESS.',
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
    return this.tripsDestinationsService.addDestination(user, id, dto);
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
    return this.tripsDestinationsService.reorderDestinations(user, id, dto);
  }

  @Patch(':id/destinations/:destId')
  @ApiOperation({
    summary: 'Update a destination',
    description:
      'Updates country, city, or label. ORGANIZER or CO_ORGANIZER only. ' +
      'Returns requiresConfirmation=true when trip is CONFIRMED or IN_PROGRESS.',
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
    return this.tripsDestinationsService.updateDestination(user, id, destId, dto);
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
    return this.tripsDestinationsService.deleteDestination(user, id, destId);
  }
}
