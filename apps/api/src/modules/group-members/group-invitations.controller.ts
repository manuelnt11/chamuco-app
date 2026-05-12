import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { GroupMembersService } from './group-members.service';
import { MyInvitationResponseDto } from './dto/my-invitation-response.dto';

@ApiTags('group-members')
@ApiBearerAuth()
@Controller('v1/groups')
export class GroupInvitationsController {
  constructor(private readonly groupMembersService: GroupMembersService) {}

  @Get('invitations')
  @ApiOperation({
    summary: 'List my group invitations',
    description: 'Returns all pending group invitations for the authenticated user.',
  })
  @ApiResponse({ status: 200, type: [MyInvitationResponseDto] })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  async listMyInvitations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MyInvitationResponseDto[]> {
    return this.groupMembersService.listMyInvitations(user.id);
  }
}
