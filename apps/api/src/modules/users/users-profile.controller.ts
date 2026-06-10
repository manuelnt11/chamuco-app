import { Body, Controller, Get, HttpCode, Patch } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersProfileService } from './users-profile.service';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { UserProfileResponseDto } from './dto/user-profile-response.dto';

@ApiTags({ name: 'user-profile', parent: 'users' })
@ApiBearerAuth()
@Controller('v1/users')
export class UsersProfileController {
  constructor(private readonly usersProfileService: UsersProfileService) {}

  @Get('me/profile')
  @ApiOperation({
    summary: "Get the current user's personal profile",
    description:
      "Returns the personal-detail fields from the authenticated user's profile: " +
      'first name, last name, date of birth, birth country/city, home country/city, ' +
      'phone number, and bio.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  getProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserProfileResponseDto> {
    return this.usersProfileService.getProfile(user.id);
  }

  @Patch('me/profile')
  @HttpCode(200)
  @ApiBody({ type: UpdateUserProfileDto })
  @ApiOperation({
    summary: "Update the current user's personal profile",
    description:
      'Updates any subset of personal-detail fields. ' +
      'Country codes must be ISO 3166-1 alpha-2 (two uppercase letters). ' +
      'Empty or whitespace-only text fields (birthCity, homeCity, bio) are stored as null. ' +
      'Email must be a valid address when provided; updating it resets emailVerified to false.',
  })
  @ApiResponse({ status: 200, type: UserProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed — invalid field value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserProfileDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersProfileService.updateProfile(user.id, dto);
  }
}
