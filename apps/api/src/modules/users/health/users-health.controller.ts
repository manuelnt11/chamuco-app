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
import { UsersHealthService } from './users-health.service';
import { UpdateUserHealthDto } from './dto/update-user-health.dto';
import { UserHealthResponseDto } from './dto/user-health-response.dto';

@ApiTags({ name: 'user-health', parent: 'users' })
@ApiBearerAuth()
@Controller('v1/users')
export class UsersHealthController {
  constructor(private readonly usersHealthService: UsersHealthService) {}

  @Get('me/health')
  @ApiOperation({
    summary: "Get the current user's health profile",
    description:
      "Returns the health-related fields from the authenticated user's profile: " +
      'dietary preference, dietary notes, general medical notes, food allergies, ' +
      'phobias, physical limitations, and medical conditions.',
  })
  @ApiResponse({ status: 200, type: UserHealthResponseDto })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  getHealthProfile(@CurrentUser() user: AuthenticatedUser): Promise<UserHealthResponseDto> {
    return this.usersHealthService.getHealth(user.id);
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
  @ApiBadRequestResponse({
    description: 'Validation failed — invalid enum value or missing description for OTHER.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  updateHealthProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserHealthDto,
  ): Promise<UserHealthResponseDto> {
    return this.usersHealthService.updateHealth(user.id, dto);
  }
}
