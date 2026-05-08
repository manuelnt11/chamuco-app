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
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';

@ApiTags('groups')
@ApiBearerAuth()
@Controller('v1/groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a group',
    description:
      'Creates a new group. The authenticated user becomes the group owner. ' +
      'Supply an emoji cover or a GCS objectKey obtained from POST /v1/uploads/signed-url.',
  })
  @ApiResponse({ status: 201, type: GroupResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in request body.' })
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.createGroup(user, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List the authenticated user's groups",
    description:
      'Returns all groups the authenticated user belongs to. ' +
      'Currently returns an empty list until group membership is implemented.',
  })
  @ApiResponse({ status: 200, type: [GroupResponseDto] })
  async listMyGroups(@CurrentUser() user: AuthenticatedUser): Promise<GroupResponseDto[]> {
    return this.groupsService.listMyGroups(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async getGroup(@Param('id', ParseUUIDPipe) id: string): Promise<GroupResponseDto> {
    return this.groupsService.getGroup(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a group',
    description: 'Updates group name, description, visibility, or cover. Owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in request body.' })
  @ApiForbiddenResponse({ description: 'Only the group owner can update this group.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async updateGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGroupDto,
  ): Promise<GroupResponseDto> {
    return this.groupsService.updateGroup(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a group',
    description: 'Permanently deletes the group and its cover asset. Owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 204, description: 'Group deleted.' })
  @ApiForbiddenResponse({ description: 'Only the group owner can delete this group.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async deleteGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupsService.deleteGroup(user, id);
  }
}
