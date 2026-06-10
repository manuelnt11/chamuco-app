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
import { UsersTravelDocsService } from './users-travel-docs.service';
import {
  CreateNationalityDto,
  NationalityResponseDto,
  UpdateNationalityDto,
} from './dto/nationality.dto';
import { CreateVisaDto, UpdateVisaDto, VisaResponseDto } from './dto/visa.dto';
import { CreateEtaDto, EtaResponseDto, UpdateEtaDto } from './dto/eta.dto';

@ApiTags('user-travel-docs')
@ApiBearerAuth()
@Controller('v1/users')
export class UsersTravelDocsController {
  constructor(private readonly usersTravelDocsService: UsersTravelDocsService) {}

  @Get('me/nationalities')
  @ApiOperation({
    summary: "List the current user's nationalities",
    description:
      'Returns all nationality records for the authenticated user, ordered by primary first.',
  })
  @ApiResponse({ status: 200, type: NationalityResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  getNationalities(@CurrentUser() user: AuthenticatedUser): Promise<NationalityResponseDto[]> {
    return this.usersTravelDocsService.getNationalities(user.id);
  }

  @Post('me/nationalities')
  @HttpCode(201)
  @ApiBody({ type: CreateNationalityDto })
  @ApiOperation({
    summary: 'Add a nationality',
    description:
      'Adds a new nationality record. If isPrimary is true, the current primary is automatically demoted. ' +
      'Returns 409 if a nationality for the same country already exists. ' +
      'If any passport field is provided, all three must be present.',
  })
  @ApiResponse({ status: 201, type: NationalityResponseDto })
  @ApiBadRequestResponse({
    description: 'Validation failed — invalid field value or incomplete passport data.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiConflictResponse({ description: 'Nationality for this country already exists.' })
  addNationality(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNationalityDto,
  ): Promise<NationalityResponseDto> {
    return this.usersTravelDocsService.addNationality(user.id, dto);
  }

  @Patch('me/nationalities/:id')
  @HttpCode(200)
  @ApiParam({ name: 'id', description: 'UUID of the nationality record to update', format: 'uuid' })
  @ApiBody({ type: UpdateNationalityDto })
  @ApiOperation({
    summary: 'Update a nationality',
    description:
      'Updates any subset of fields on a single nationality record. ' +
      'If isPrimary is true, all other nationalities are automatically demoted. ' +
      'isPrimary: false is rejected — assign a new primary instead. ' +
      'If any passport field is provided, all three must be present.',
  })
  @ApiResponse({ status: 200, type: NationalityResponseDto })
  @ApiBadRequestResponse({
    description:
      'Validation failed — invalid field value, incomplete passport data, or isPrimary: false.',
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  updateNationality(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) nationalityId: string,
    @Body() dto: UpdateNationalityDto,
  ): Promise<NationalityResponseDto> {
    return this.usersTravelDocsService.updateNationality(user.id, nationalityId, dto);
  }

  @Delete('me/nationalities/:id')
  @HttpCode(204)
  @ApiParam({ name: 'id', description: 'UUID of the nationality record to delete', format: 'uuid' })
  @ApiOperation({
    summary: 'Delete a nationality',
    description:
      'Removes a single nationality record. ' +
      'Returns 409 if the record is the primary and other nationalities exist — re-assign primary first.',
  })
  @ApiResponse({ status: 204, description: 'Nationality deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  @ApiConflictResponse({
    description: 'Cannot delete primary nationality while other nationalities exist.',
  })
  deleteNationality(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) nationalityId: string,
  ): Promise<void> {
    return this.usersTravelDocsService.deleteNationality(user.id, nationalityId);
  }

  // ---------------------------------------------------------------------------
  // Visas
  // ---------------------------------------------------------------------------

  @Get('me/nationalities/:nationalityId/visas')
  @ApiOperation({ summary: 'List visas for a nationality' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, type: VisaResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  getVisas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
  ): Promise<VisaResponseDto[]> {
    return this.usersTravelDocsService.getVisas(user.id, nationalityId);
  }

  @Post('me/nationalities/:nationalityId/visas')
  @ApiOperation({ summary: 'Add a visa to a nationality' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiBody({ type: CreateVisaDto })
  @ApiResponse({ status: 201, type: VisaResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  addVisa(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Body() dto: CreateVisaDto,
  ): Promise<VisaResponseDto> {
    return this.usersTravelDocsService.addVisa(user.id, nationalityId, dto);
  }

  @Patch('me/nationalities/:nationalityId/visas/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update a visa' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiParam({ name: 'id', description: 'UUID of the visa record', format: 'uuid' })
  @ApiBody({ type: UpdateVisaDto })
  @ApiResponse({ status: 200, type: VisaResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality or visa not found.' })
  updateVisa(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVisaDto,
  ): Promise<VisaResponseDto> {
    return this.usersTravelDocsService.updateVisa(user.id, nationalityId, id, dto);
  }

  @Delete('me/nationalities/:nationalityId/visas/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a visa' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiParam({ name: 'id', description: 'UUID of the visa record', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Visa deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality or visa not found.' })
  deleteVisa(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.usersTravelDocsService.deleteVisa(user.id, nationalityId, id);
  }

  // ---------------------------------------------------------------------------
  // ETAs
  // ---------------------------------------------------------------------------

  @Get('me/nationalities/:nationalityId/etas')
  @ApiOperation({ summary: 'List ETAs for a nationality' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, type: EtaResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  getEtas(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
  ): Promise<EtaResponseDto[]> {
    return this.usersTravelDocsService.getEtas(user.id, nationalityId);
  }

  @Post('me/nationalities/:nationalityId/etas')
  @ApiOperation({ summary: 'Add an ETA to a nationality' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiBody({ type: CreateEtaDto })
  @ApiResponse({ status: 201, type: EtaResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality not found.' })
  addEta(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Body() dto: CreateEtaDto,
  ): Promise<EtaResponseDto> {
    return this.usersTravelDocsService.addEta(user.id, nationalityId, dto);
  }

  @Patch('me/nationalities/:nationalityId/etas/:id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Update an ETA' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiParam({ name: 'id', description: 'UUID of the ETA record', format: 'uuid' })
  @ApiBody({ type: UpdateEtaDto })
  @ApiResponse({ status: 200, type: EtaResponseDto })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality or ETA not found.' })
  updateEta(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEtaDto,
  ): Promise<EtaResponseDto> {
    return this.usersTravelDocsService.updateEta(user.id, nationalityId, id, dto);
  }

  @Delete('me/nationalities/:nationalityId/etas/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete an ETA' })
  @ApiParam({
    name: 'nationalityId',
    description: 'UUID of the nationality record',
    format: 'uuid',
  })
  @ApiParam({ name: 'id', description: 'UUID of the ETA record', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'ETA deleted.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid Firebase ID token.' })
  @ApiNotFoundResponse({ description: 'Nationality or ETA not found.' })
  deleteEta(
    @CurrentUser() user: AuthenticatedUser,
    @Param('nationalityId', ParseUUIDPipe) nationalityId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.usersTravelDocsService.deleteEta(user.id, nationalityId, id);
  }
}
