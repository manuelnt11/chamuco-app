import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripsGroupsService } from './trips-groups.service';
import { TripGroupResponseDto } from './dto/trip-group-response.dto';
import { AddTripGroupDto } from './dto/add-trip-group.dto';

@ApiTags({ name: 'trip-groups', parent: 'trips' })
@ApiBearerAuth()
@Controller('v1/trips')
export class TripsGroupsController {
  constructor(private readonly tripsGroupsService: TripsGroupsService) {}

  @Get(':id/groups')
  @ApiOperation({
    summary: 'List groups linked to a trip',
    description: 'Returns all groups associated with the trip. ORGANIZER only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [TripGroupResponseDto] })
  @ApiForbiddenResponse({ description: 'Only the trip organizer can manage linked groups.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async listTripGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripGroupResponseDto[]> {
    return this.tripsGroupsService.listTripGroups(user, id);
  }

  @Post(':id/groups')
  @ApiOperation({
    summary: 'Link a group to a trip',
    description:
      'Associates a group with a trip. Idempotent — linking an already-linked group is a no-op. ' +
      'ORGANIZER only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: TripGroupResponseDto })
  @ApiForbiddenResponse({ description: 'Only the trip organizer can manage linked groups.' })
  @ApiNotFoundResponse({ description: 'Trip or group not found.' })
  async addTripGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddTripGroupDto,
  ): Promise<TripGroupResponseDto> {
    return this.tripsGroupsService.addTripGroup(user, id, dto);
  }

  @Delete(':id/groups/:groupId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Unlink a group from a trip',
    description: 'Removes the association between a group and a trip. ORGANIZER only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'groupId', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Group unlinked.' })
  @ApiForbiddenResponse({ description: 'Only the trip organizer can manage linked groups.' })
  @ApiNotFoundResponse({ description: 'Trip not found, or group is not linked to this trip.' })
  async removeTripGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('groupId', ParseUUIDPipe) groupId: string,
  ): Promise<void> {
    return this.tripsGroupsService.removeTripGroup(user, id, groupId);
  }
}
