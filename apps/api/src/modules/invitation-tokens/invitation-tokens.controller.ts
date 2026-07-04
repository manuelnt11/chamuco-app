import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { InvitationTokenContext } from '@chamuco/shared-types';
import type { AuthenticatedUser } from '@/types/express';
import { InvitationTokensService } from './invitation-tokens.service';
import { CreateInvitationTokenDto } from './dto/create-invitation-token.dto';
import { InvitationTokenCreateResponseDto } from './dto/invitation-token-create-response.dto';
import { InvitationTokenResolveResponseDto } from './dto/invitation-token-resolve-response.dto';
import { InvitationTokenRedeemResponseDto } from './dto/invitation-token-redeem-response.dto';

@ApiTags('invitation-tokens')
@Controller('v1/invitation-tokens')
export class InvitationTokensController {
  constructor(private readonly invitationTokensService: InvitationTokensService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create an invitation token',
    description:
      'Generates a shareable invitation link. ' +
      'For trip/group contexts the caller must be an organizer or admin. ' +
      'Any authenticated user can generate a referral token. ' +
      'If recipientEmail is provided, the link is targeted and an invitation email is sent immediately.',
  })
  @ApiBody({ type: CreateInvitationTokenDto })
  @ApiResponse({ status: 201, type: InvitationTokenCreateResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller lacks organizer/admin role for the context.' })
  @ApiConflictResponse({
    description:
      'An open link already exists for this context, or recipientEmail is already registered.',
  })
  async createToken(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInvitationTokenDto,
  ): Promise<InvitationTokenCreateResponseDto> {
    return this.invitationTokensService.createToken(dto, user.id);
  }

  @Get('open')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get the existing open invitation link for a context',
    description:
      'Returns the token and URL of the existing open invitation link for the given context, ' +
      "or 404 if none exists. For referral context, returns the caller's own token. " +
      'Requires the same permissions as creating a token.',
  })
  @ApiQuery({ name: 'contextType', enum: InvitationTokenContext })
  @ApiQuery({ name: 'contextId', type: String, required: false })
  @ApiResponse({ status: 200, type: InvitationTokenCreateResponseDto })
  @ApiNotFoundResponse({ description: 'No open link exists for this context.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller lacks permission for this context.' })
  async getOpenToken(
    @CurrentUser() user: AuthenticatedUser,
    @Query('contextType') contextType: InvitationTokenContext,
    @Query('contextId') contextId?: string,
  ): Promise<InvitationTokenCreateResponseDto> {
    const result = await this.invitationTokensService.findOpenToken(
      contextType,
      contextId ?? null,
      user.id,
    );
    if (!result) {
      throw new NotFoundException('No open invitation link found for this context.');
    }
    return result;
  }

  @Get(':token')
  @Public()
  @ApiOperation({
    summary: 'Resolve an invitation token',
    description:
      'Returns token metadata and context info (trip/group name, inviter name). ' +
      'Public endpoint — no authentication required. ' +
      'Used by the frontend to display the invitation before the user registers or logs in.',
  })
  @ApiParam({ name: 'token', type: String, description: 'Invitation token string' })
  @ApiResponse({ status: 200, type: InvitationTokenResolveResponseDto })
  @ApiNotFoundResponse({ description: 'Token not found.' })
  async resolveToken(@Param('token') token: string): Promise<InvitationTokenResolveResponseDto> {
    return this.invitationTokensService.resolveToken(token);
  }

  @Post(':token/redeem')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redeem an invitation token',
    description:
      'Processes the token for the authenticated user. ' +
      'Creates the appropriate membership record (INVITED or accepted request) based on context. ' +
      'Idempotent: returns the current outcome without error if the user is already a member.',
  })
  @ApiParam({ name: 'token', type: String, description: 'Invitation token string' })
  @ApiResponse({ status: 200, type: InvitationTokenRedeemResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiNotFoundResponse({ description: 'Token not found.' })
  @ApiConflictResponse({ description: 'Token is deactivated or has already been used.' })
  async redeemToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<InvitationTokenRedeemResponseDto> {
    return this.invitationTokensService.redeemToken(token, user.id);
  }

  @Patch(':token/toggle')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Activate or deactivate an open invitation link',
    description:
      'Toggles the isActive state of an open invitation link. ' +
      'Targeted links (with recipientEmail) cannot be toggled. ' +
      'Caller must be the token creator or a current organizer/admin of the context.',
  })
  @ApiParam({ name: 'token', type: String, description: 'Invitation token string' })
  @ApiResponse({ status: 204, description: 'Toggle applied.' })
  @ApiUnauthorizedResponse({ description: 'Unauthenticated.' })
  @ApiForbiddenResponse({ description: 'Caller is not authorized to toggle this token.' })
  @ApiNotFoundResponse({ description: 'Token not found.' })
  async toggleToken(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ): Promise<void> {
    return this.invitationTokensService.toggleToken(token, user.id);
  }
}
