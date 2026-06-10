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
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { UsersEmergencyContactsService } from './users-emergency-contacts.service';
import { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';

@ApiTags('user-emergency-contacts')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersEmergencyContactsController {
  constructor(private readonly usersEmergencyContactsService: UsersEmergencyContactsService) {}

  @Get('me/emergency-contacts')
  @ApiOperation({
    summary: "List the current user's emergency contacts",
    description: "Returns all emergency contacts stored on the authenticated user's profile.",
  })
  @ApiResponse({ status: 200, type: EmergencyContactDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  getEmergencyContacts(@CurrentUser() user: AuthenticatedUser): Promise<EmergencyContactDto[]> {
    return this.usersEmergencyContactsService.getEmergencyContacts(user.id);
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
  @ApiBadRequestResponse({ description: 'Validation failed — invalid field value.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile not found.' })
  addEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    return this.usersEmergencyContactsService.addEmergencyContact(user.id, dto);
  }

  @Patch('me/emergency-contacts/:id')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'UUID of the emergency contact to update', format: 'uuid' })
  @ApiBody({ type: UpdateEmergencyContactDto })
  @ApiOperation({
    summary: 'Update an emergency contact',
    description:
      'Updates any subset of fields on a single emergency contact identified by its UUID. ' +
      'If isPrimary is set to true, all other contacts are automatically demoted.',
  })
  @ApiResponse({ status: 200, type: EmergencyContactDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed — invalid field value, or isPrimary: false (assign a new primary instead).',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile or emergency contact not found.' })
  updateEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) contactId: string,
    @Body() dto: UpdateEmergencyContactDto,
  ): Promise<EmergencyContactDto> {
    return this.usersEmergencyContactsService.updateEmergencyContact(user.id, contactId, dto);
  }

  @Delete('me/emergency-contacts/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'UUID of the emergency contact to delete', format: 'uuid' })
  @ApiOperation({
    summary: 'Delete an emergency contact',
    description:
      'Removes a single emergency contact. ' +
      'Returns 409 if the contact is the primary and other contacts exist — re-assign primary first.',
  })
  @ApiResponse({ status: 204, description: 'Contact deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'User profile or emergency contact not found.' })
  @ApiConflictResponse({ description: 'Cannot delete primary contact while other contacts exist.' })
  deleteEmergencyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) contactId: string,
  ): Promise<void> {
    return this.usersEmergencyContactsService.deleteEmergencyContact(user.id, contactId);
  }
}
