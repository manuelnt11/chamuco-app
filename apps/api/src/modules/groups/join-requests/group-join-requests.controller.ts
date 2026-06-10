import {
  Controller,
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
import { GroupJoinRequestsService } from './group-join-requests.service';

@ApiTags('group-join-requests')
@ApiBearerAuth()
@Controller('v1/groups/:id')
export class GroupJoinRequestsController {
  constructor(private readonly groupJoinRequestsService: GroupJoinRequestsService) {}

  @Post('join-request')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Submit a join request',
    description:
      'Submits a join request to a public group. Only available when group visibility is PUBLIC.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Join request submitted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Group is not public.' })
  @ApiConflictResponse({ description: 'Active membership or pending request already exists.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async submitJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupJoinRequestsService.submitJoinRequest(id, user.id);
  }

  @Patch('join-requests/:userId/accept')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Accept a join request',
    description: 'Accepts a pending join request. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request accepted.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({ description: 'No pending join request found.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async acceptJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupJoinRequestsService.acceptJoinRequest(id, userId, user.id);
  }

  @Patch('join-requests/:userId/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Reject a join request',
    description: 'Rejects a pending join request. Admin only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiParam({ name: 'userId', type: String, description: 'User UUID of the requester' })
  @ApiResponse({ status: 204, description: 'Join request rejected.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not a group admin.' })
  @ApiConflictResponse({ description: 'No pending join request found.' })
  @ApiNotFoundResponse({ description: 'Group or user not found.' })
  async rejectJoinRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    return this.groupJoinRequestsService.rejectJoinRequest(id, userId, user.id);
  }
}
