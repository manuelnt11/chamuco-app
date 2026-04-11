import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { AuthService } from '@/modules/auth/auth.service';
import type { AuthenticatedUser } from '@/types/express';
import { RegisterDto } from './dto/register.dto';
import { RegisterResponseDto } from './dto/register-response.dto';

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

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Log out the current user',
    description:
      'Revokes the Firebase refresh tokens for the current user server-side, invalidating all active sessions ' +
      'across all devices. The frontend should call Firebase signOut() after this endpoint.',
  })
  @ApiResponse({ status: 204, description: 'Successfully logged out' })
  @ApiResponse({ status: 401, description: 'Missing or invalid Firebase ID token' })
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logout(user.firebaseUid);
  }
}
