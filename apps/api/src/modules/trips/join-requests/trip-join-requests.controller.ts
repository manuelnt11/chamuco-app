import {
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripJoinRequestsService } from './trip-join-requests.service';

@ApiTags('trip-join-requests')
@ApiBearerAuth()
@Controller('v1/trips/:id')
export class TripJoinRequestsController {
  constructor(private readonly tripJoinRequestsService: TripJoinRequestsService) {}

  @Post('join-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit a join request',
    description: 'Submits a join request to a public trip.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 204, description: 'Join request submitted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({
    description:
      'Trip is not public, already at capacity, or active participation/request already exists.',
  })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async submitJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tripJoinRequestsService.submitJoinRequest(id, user.id);
  }

  @Patch('join-requests/:userId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept a join request',
    description: 'Accepts a pending join request. Organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request accepted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer.' })
  @ApiConflictResponse({ description: 'No pending join request found, or trip is at capacity.' })
  @ApiNotFoundResponse({ description: 'Trip or user not found.' })
  async acceptJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.tripJoinRequestsService.acceptJoinRequest(id, userId, user.id);
  }

  @Patch('join-requests/:userId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject a join request',
    description: 'Rejects a pending join request. Organizer only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request rejected.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a trip organizer.' })
  @ApiConflictResponse({ description: 'No pending join request found.' })
  @ApiNotFoundResponse({ description: 'Trip or user not found.' })
  async rejectJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.tripJoinRequestsService.rejectJoinRequest(id, userId, user.id);
  }

  @Delete('join-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Withdraw a join request',
    description: "Withdraws the authenticated user's pending join request.",
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 204, description: 'Join request withdrawn.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiConflictResponse({ description: 'No pending join request to withdraw.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async withdrawJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.tripJoinRequestsService.withdrawJoinRequest(id, user.id);
  }
}
