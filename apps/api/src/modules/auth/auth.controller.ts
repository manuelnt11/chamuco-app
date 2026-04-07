import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { Public } from '@/common/decorators/public.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';
import { UsernameCheckResponseDto } from './dto/username-check-response.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new user on first login',
    description:
      'Creates a user record and default preferences on the first login. ' +
      'Requires a valid Firebase ID token in the Authorization header. ' +
      'The username must be unique and match the allowed format.',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: RegisterResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid username format or unsupported auth provider' })
  @ApiResponse({
    status: 401,
    description:
      'Missing or invalid Firebase ID token. Verified by the service, not by FirebaseAuthGuard (route is @Public)',
  })
  @ApiResponse({ status: 409, description: 'User already registered or username already taken' })
  register(@Req() req: Request, @Body() dto: RegisterDto): Promise<RegisterResponseDto> {
    return this.authService.register(req.headers.authorization, dto);
  }

  @Get('username/:username/available')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check if a username is available',
    description:
      'Returns whether the given username is available for registration. ' +
      'No authentication required. Rate-limited to 30 requests per minute per IP.',
  })
  @ApiParam({ name: 'username', description: 'Username to check (3–30 chars, a-z 0-9 _ -)' })
  @ApiResponse({ status: 200, type: UsernameCheckResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid username format' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  checkUsernameAvailability(
    @Param('username') username: string,
  ): Promise<UsernameCheckResponseDto> {
    const normalized = username.toLowerCase();
    if (!/^[a-z0-9_-]{3,30}$/.test(normalized)) {
      throw new BadRequestException('Invalid username format');
    }
    return this.authService.checkUsernameAvailability(normalized);
  }
}
