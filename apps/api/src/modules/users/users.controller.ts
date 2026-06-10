import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { FirebaseOnly } from '@/common/decorators/firebase-only.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersService } from './users.service';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PublicProfileResponseDto } from './dto/public-profile-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsernameAvailabilityDto } from './dto/username-availability.dto';
import { SearchUsersQueryDto } from './dto/search-users-query.dto';
import { UserSearchResponseDto } from './dto/user-search-result.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Get the current authenticated user',
    description:
      'Returns the Chamuco user record for the authenticated Firebase user. ' +
      'Returns 404 if the user has authenticated with Firebase but has not yet completed ' +
      'Chamuco registration (i.e. has not chosen a username).',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User record not found — registration not completed.' })
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.getMe(user);
  }

  @Patch('me')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({
    summary: 'Update the current authenticated user',
    description:
      'Updates any subset of editable user fields: displayName, timezone, profileVisibility.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — invalid field value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user, dto);
  }

  @Patch('me/avatar')
  @HttpCode(200)
  @ApiBody({ type: UpdateAvatarDto })
  @ApiOperation({
    summary: "Update the current user's avatar",
    description:
      'Sets a new avatar for the authenticated user. ' +
      'source=gcs: provide the objectKey returned by POST /v1/uploads/signed-url. ' +
      'source=emoji: provide the emoji character (max 8 chars). ' +
      'The previous avatar asset is deleted after the new one is stored.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid source or target.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  updateAvatar(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAvatarDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateAvatar(user, dto);
  }

  @Get('username-available')
  @FirebaseOnly()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if a username is available',
    description:
      'Returns whether the given username is available for registration. ' +
      'Requires a valid Firebase ID token. Available during onboarding before Chamuco registration is complete. ' +
      'Rate-limited to 30 requests per minute.',
  })
  @ApiQuery({ name: 'username', description: 'Username to check (3–30 chars, a-z 0-9 _ -)' })
  @ApiResponse({ status: 200, type: UsernameAvailabilityDto })
  @ApiBadRequestResponse({ description: 'Invalid username format.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase token.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  checkUsernameAvailability(@Query('username') username: string): Promise<UsernameAvailabilityDto> {
    const normalized = (username ?? '').toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      throw new BadRequestException(
        'Username must be 3–30 characters and contain only lowercase letters, numbers, _ and -',
      );
    }
    return this.usersService.checkUsernameAvailability(normalized);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search users by username or display name',
    description:
      'Returns users matching the search query. ' +
      'Prefix the query with @ to search by username only (prefix match). ' +
      'Without @, searches both username (prefix match) and display name (partial match). ' +
      'The requesting user is always excluded from results.',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query. Prefix with @ to search by username only.',
    example: '@john',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results to return (1–20, default 10)',
    example: 10,
  })
  @ApiResponse({ status: 200, type: UserSearchResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error in query params.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  searchUsers(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchUsersQueryDto,
  ): Promise<UserSearchResponseDto> {
    return this.usersService.searchUsers(user.id, query);
  }

  @Get(':username/profile')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({
    summary: "Get a user's public profile",
    description:
      'Returns the public-facing profile of any user by their username (without @ prefix). ' +
      'Does not require authentication. ' +
      'Gamification fields (travelerScore, achievements, recognitions, keyStats, discoveryMap) are ' +
      'included only when the target user has set their profile visibility to PUBLIC.',
  })
  @ApiParam({ name: 'username', description: 'Username without @ prefix' })
  @ApiResponse({ status: 200, type: PublicProfileResponseDto })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiResponse({ status: 429, description: 'Too many requests.' })
  getPublicProfile(@Param('username') username: string): Promise<PublicProfileResponseDto> {
    return this.usersService.getPublicProfile(username);
  }
}
