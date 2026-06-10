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
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupResponseDto } from './dto/group-response.dto';
import { SearchGroupsQueryDto } from './dto/search-groups-query.dto';
import { GroupSearchResponseDto } from './dto/group-search-result.dto';

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
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
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
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  async listMyGroups(@CurrentUser() user: AuthenticatedUser): Promise<GroupResponseDto[]> {
    return this.groupsService.listMyGroups(user.id);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Discover public groups',
    description:
      'Returns a paginated list of PUBLIC groups matching the optional name filter. ' +
      'Excludes groups the authenticated user already belongs to as an active member.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Name filter (case-insensitive, partial match)',
    example: 'mountain',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Results per page (1–50, default 20)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of results to skip (default 0)',
  })
  @ApiResponse({ status: 200, type: GroupSearchResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in query params.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  async searchGroups(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchGroupsQueryDto,
  ): Promise<GroupSearchResponseDto> {
    return this.groupsService.searchGroups(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a group by ID' })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async getGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GroupResponseDto> {
    return this.groupsService.getGroup(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a group',
    description: 'Updates group name, description, visibility, or cover. Owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Group UUID' })
  @ApiResponse({ status: 200, type: GroupResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation error in request body, or GROUP_CANNOT_BE_MADE_PUBLIC: group has non-owner members and cannot be switched to PUBLIC.',
  })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
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
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Only the group owner can delete this group.' })
  @ApiNotFoundResponse({ description: 'Group not found.' })
  async deleteGroup(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.groupsService.deleteGroup(user, id);
  }
}
