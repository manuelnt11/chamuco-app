import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersLoyaltyProgramsService } from './users-loyalty-programs.service';
import { LoyaltyProgramDto, UpdateLoyaltyProgramDto } from './dto/loyalty-program.dto';

@ApiTags({ name: 'user-loyalty-programs', parent: 'users' })
@ApiBearerAuth()
@Controller('v1/users')
export class UsersLoyaltyProgramsController {
  constructor(private readonly usersLoyaltyProgramsService: UsersLoyaltyProgramsService) {}

  @Get('me/loyalty-programs')
  @ApiOperation({
    summary: "List the current user's loyalty programs",
    description:
      "Returns all loyalty programs stored on the authenticated user's profile. " +
      'Visible only to the user themselves.',
  })
  @ApiResponse({ status: 200, type: LoyaltyProgramDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  getLoyaltyPrograms(@CurrentUser() user: AuthenticatedUser): Promise<LoyaltyProgramDto[]> {
    return this.usersLoyaltyProgramsService.getLoyaltyPrograms(user.id);
  }

  @Post('me/loyalty-programs')
  @HttpCode(201)
  @ApiBody({ type: LoyaltyProgramDto })
  @ApiOperation({
    summary: 'Add a loyalty program',
    description:
      'Adds a new loyalty program. The id must be a client-generated UUID. ' +
      'No uniqueness check — a user may hold multiple memberships in the same program.',
  })
  @ApiResponse({ status: 201, type: LoyaltyProgramDto })
  @ApiBadRequestResponse({ description: 'Validation failed — invalid field value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  addLoyaltyProgram(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: LoyaltyProgramDto,
  ): Promise<LoyaltyProgramDto> {
    return this.usersLoyaltyProgramsService.addLoyaltyProgram(user.id, dto);
  }

  @Patch('me/loyalty-programs/:id')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'UUID of the loyalty program to update', format: 'uuid' })
  @ApiBody({ type: UpdateLoyaltyProgramDto })
  @ApiOperation({
    summary: 'Update a loyalty program',
    description: 'Updates any subset of fields on a single loyalty program identified by its UUID.',
  })
  @ApiResponse({ status: 200, type: LoyaltyProgramDto })
  @ApiBadRequestResponse({ description: 'Validation failed — invalid field value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile or loyalty program not found.' })
  updateLoyaltyProgram(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) programId: string,
    @Body() dto: UpdateLoyaltyProgramDto,
  ): Promise<LoyaltyProgramDto> {
    return this.usersLoyaltyProgramsService.updateLoyaltyProgram(user.id, programId, dto);
  }

  @Delete('me/loyalty-programs/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'UUID of the loyalty program to delete', format: 'uuid' })
  @ApiOperation({
    summary: 'Delete a loyalty program',
    description: 'Removes a single loyalty program identified by its UUID.',
  })
  @ApiResponse({ status: 204, description: 'Loyalty program deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile or loyalty program not found.' })
  deleteLoyaltyProgram(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) programId: string,
  ): Promise<void> {
    return this.usersLoyaltyProgramsService.deleteLoyaltyProgram(user.id, programId);
  }
}
