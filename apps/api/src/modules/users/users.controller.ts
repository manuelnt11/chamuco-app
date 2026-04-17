import { BadRequestException, Body, Controller, Get, HttpCode, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersService } from './users.service';
import { UpdateUserHealthDto } from './dto/update-user-health.dto';
import { UserHealthResponseDto } from './dto/user-health-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsernameAvailabilityDto } from './dto/username-availability.dto';

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
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User record not found — registration not completed' })
  getMe(@CurrentUser() user: AuthenticatedUser): UserResponseDto {
    // The guard already fetched this user from the DB; return it directly
    // to avoid a redundant query. Destructure to exclude firebaseUid from
    // the serialized response.
    const { firebaseUid: _, ...dto } = user;
    return dto;
  }

  @Get('me/health')
  @ApiOperation({
    summary: "Get the current user's health profile",
    description:
      "Returns the health-related fields from the authenticated user's profile: " +
      'dietary preference, dietary notes, general medical notes, food allergies, ' +
      'phobias, physical limitations, and medical conditions.',
  })
  @ApiResponse({ status: 200, type: UserHealthResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  getHealthProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserHealthResponseDto> {
    return this.usersService.getHealth(user.id);
  }

  @Patch('me/health')
  @HttpCode(200)
  @ApiOperation({
    summary: "Update the current user's health profile",
    description:
      'Replaces any subset of health fields. JSONB arrays (food allergies, phobias, ' +
      'physical limitations, medical conditions) are replaced wholesale, not merged. ' +
      'description is required when the enum value is OTHER.',
  })
  @ApiResponse({ status: 200, type: UserHealthResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Validation failed — invalid enum value or missing description for OTHER',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  updateHealthProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserHealthDto,
  ): Promise<UserHealthResponseDto> {
    return this.usersService.updateHealth(user.id, dto);
  }

  @Get('username-available')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @ApiOperation({
    summary: 'Check if a username is available',
    description:
      'Returns whether the given username is available for registration. ' +
      'No authentication required. Rate-limited to 30 requests per minute per IP.',
  })
  @ApiQuery({ name: 'username', description: 'Username to check (3–30 chars, a-z 0-9 _ -)' })
  @ApiResponse({ status: 200, type: UsernameAvailabilityDto })
  @ApiResponse({ status: 400, description: 'Invalid username format' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  checkUsernameAvailability(@Query('username') username: string): Promise<UsernameAvailabilityDto> {
    const normalized = (username ?? '').toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      throw new BadRequestException(
        'Username must be 3–30 characters and contain only lowercase letters, numbers, _ and -',
      );
    }
    return this.usersService.checkUsernameAvailability(normalized);
  }
}
