import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersService } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { UsernameAvailabilityDto } from './dto/username-availability.dto';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/v1/users')
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
  getMe(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return this.usersService.findByFirebaseUid(user.firebaseUid);
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
