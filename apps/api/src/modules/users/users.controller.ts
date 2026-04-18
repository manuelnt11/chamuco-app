import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';
import { UpdateUserHealthDto } from './dto/update-user-health.dto';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserHealthResponseDto } from './dto/user-health-response.dto';
import { UserPreferencesResponseDto } from './dto/user-preferences-response.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';
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

  @Patch('me')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({
    summary: 'Update the current authenticated user',
    description: 'Updates any subset of editable user fields: displayName, avatarUrl, timezone.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed — invalid field value' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateMe(user, dto);
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
  @ApiBody({ type: UpdateUserHealthDto })
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

  @Get('me/emergency-contacts')
  @ApiOperation({
    summary: "List the current user's emergency contacts",
    description: "Returns all emergency contacts stored on the authenticated user's profile.",
  })
  @ApiResponse({ status: 200, type: EmergencyContactDto, isArray: true })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  getEmergencyContacts(@CurrentUser() user: AuthenticatedUser): Promise<EmergencyContactDto[]> {
    return this.usersService.getEmergencyContacts(user.id);
  }

  @Post('me/emergency-contacts')
  @HttpCode(201)
  @ApiBody({ type: EmergencyContactDto })
  @ApiOperation({
    summary: 'Add an emergency contact',
    description:
      'Adds a new emergency contact. The id must be a client-generated UUID. ' +
      'If isPrimary is true, the current primary contact is automatically demoted.',
  })
  @ApiResponse({ status: 201, type: EmergencyContactDto })
  @ApiResponse({ status: 400, description: 'Validation failed — invalid field value' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  addEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    return this.usersService.addEmergencyContact(user.id, dto);
  }

  @Patch('me/emergency-contacts/:id')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'UUID of the emergency contact to update' })
  @ApiBody({ type: UpdateEmergencyContactDto })
  @ApiOperation({
    summary: 'Update an emergency contact',
    description:
      'Updates any subset of fields on a single emergency contact identified by its UUID. ' +
      'If isPrimary is set to true, all other contacts are automatically demoted.',
  })
  @ApiResponse({ status: 200, type: EmergencyContactDto })
  @ApiResponse({
    status: 400,
    description:
      'Validation failed — invalid field value, or isPrimary: false (assign a new primary instead)',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile or emergency contact not found' })
  updateEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    return this.usersService.updateEmergencyContact(user.id, contactId, dto);
  }

  @Delete('me/emergency-contacts/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'UUID of the emergency contact to delete' })
  @ApiOperation({
    summary: 'Delete an emergency contact',
    description:
      'Removes a single emergency contact. ' +
      'Returns 409 if the contact is the primary and other contacts exist — re-assign primary first.',
  })
  @ApiResponse({ status: 204, description: 'Contact deleted' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile or emergency contact not found' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete primary contact while other contacts exist',
  })
  deleteEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') contactId: string,
  ): Promise<void> {
    return this.usersService.deleteEmergencyContact(user.id, contactId);
  }

  @Get('me/profile')
  @ApiOperation({
    summary: "Get the current user's personal profile",
    description:
      "Returns the personal-detail fields from the authenticated user's profile: " +
      'first name, last name, date of birth, birth country/city, home country/city, ' +
      'phone number, and bio.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponseDto> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me/profile')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiOperation({
    summary: "Update the current user's personal profile",
    description:
      'Updates any subset of personal-detail fields. ' +
      'Country codes must be ISO 3166-1 alpha-2 (two uppercase letters). ' +
      'Empty or whitespace-only text fields (birthCity, homeCity, bio) are stored as null.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed — invalid field value' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User profile not found' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Get('me/preferences')
  @ApiOperation({
    summary: "Get the current user's preferences",
    description: "Returns the authenticated user's preferences: language, currency, theme.",
  })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User preferences not found' })
  getPreferences(@CurrentUser() user: AuthenticatedUser): Promise<UserPreferencesResponseDto> {
    return this.usersService.getPreferences(user.id);
  }

  @Patch('me/preferences')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserPreferencesDto })
  @ApiOperation({
    summary: "Update the current user's preferences",
    description: 'Updates any subset of preference fields: language, currency, theme.',
  })
  @ApiResponse({ status: 200, type: UserPreferencesResponseDto })
  @ApiResponse({ status: 400, description: 'Validation failed — invalid enum value' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  @ApiResponse({ status: 404, description: 'User preferences not found' })
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.usersService.updatePreferences(user.id, dto);
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
