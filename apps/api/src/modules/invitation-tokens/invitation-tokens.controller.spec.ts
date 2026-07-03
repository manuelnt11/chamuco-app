import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  InvitationTokenContext,
  PlatformRole,
  ProfileVisibility,
} from '@chamuco/shared-types';
import { InvitationTokensController } from './invitation-tokens.controller';
import { InvitationTokensService } from './invitation-tokens.service';
import type { CreateInvitationTokenDto } from './dto/create-invitation-token.dto';
import type { InvitationTokenCreateResponseDto } from './dto/invitation-token-create-response.dto';
import type { InvitationTokenResolveResponseDto } from './dto/invitation-token-resolve-response.dto';
import type { InvitationTokenRedeemResponseDto } from './dto/invitation-token-redeem-response.dto';
import type { AuthenticatedUser } from '@/types/express';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');
const TOKEN = 'abc123token';
const TRIP_ID = 'trip-uuid';

const mockUser: AuthenticatedUser = {
  id: 'user-uuid',
  username: 'organizer',
  displayName: 'Organizer',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockCreateResponse: InvitationTokenCreateResponseDto = {
  token: TOKEN,
  url: `http://localhost:3000/join?token=${TOKEN}`,
  isActive: true,
};

const mockResolveResponse: InvitationTokenResolveResponseDto = {
  token: TOKEN,
  contextType: InvitationTokenContext.TRIP,
  contextId: TRIP_ID,
  contextName: 'Cancún Verano 2026',
  createdByDisplayName: 'Organizer',
  createdByUsername: 'organizer',
  note: null,
  isActive: true,
  createdAt: NOW.toISOString(),
};

const mockRedeemResponse: InvitationTokenRedeemResponseDto = {
  outcome: 'INVITED',
  contextType: InvitationTokenContext.TRIP,
  contextId: TRIP_ID,
};

describe('InvitationTokensController', () => {
  let controller: InvitationTokensController;
  let mockCreateToken: jest.Mock;
  let mockResolveToken: jest.Mock;
  let mockRedeemToken: jest.Mock;
  let mockToggleToken: jest.Mock;

  beforeEach(async () => {
    mockCreateToken = jest.fn().mockResolvedValue(mockCreateResponse);
    mockResolveToken = jest.fn().mockResolvedValue(mockResolveResponse);
    mockRedeemToken = jest.fn().mockResolvedValue(mockRedeemResponse);
    mockToggleToken = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvitationTokensController],
      providers: [
        {
          provide: InvitationTokensService,
          useValue: {
            createToken: mockCreateToken,
            resolveToken: mockResolveToken,
            redeemToken: mockRedeemToken,
            toggleToken: mockToggleToken,
          },
        },
      ],
    }).compile();

    controller = module.get(InvitationTokensController);
  });

  describe('createToken', () => {
    it('delegates to service and returns create response', async () => {
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
      };
      const result = await controller.createToken(mockUser, dto);
      expect(mockCreateToken).toHaveBeenCalledWith(dto, mockUser.id);
      expect(result).toEqual(mockCreateResponse);
    });
  });

  describe('resolveToken', () => {
    it('delegates to service and returns resolve response', async () => {
      const result = await controller.resolveToken(TOKEN);
      expect(mockResolveToken).toHaveBeenCalledWith(TOKEN);
      expect(result).toEqual(mockResolveResponse);
    });
  });

  describe('redeemToken', () => {
    it('delegates to service and returns redeem response', async () => {
      const result = await controller.redeemToken(mockUser, TOKEN);
      expect(mockRedeemToken).toHaveBeenCalledWith(TOKEN, mockUser.id);
      expect(result).toEqual(mockRedeemResponse);
    });
  });

  describe('toggleToken', () => {
    it('delegates to service and returns void', async () => {
      await controller.toggleToken(mockUser, TOKEN);
      expect(mockToggleToken).toHaveBeenCalledWith(TOKEN, mockUser.id);
    });
  });

  describe('getOpenToken', () => {
    let mockFindOpenToken: jest.Mock;

    beforeEach(async () => {
      mockFindOpenToken = jest.fn().mockResolvedValue(mockCreateResponse);
      const module: TestingModule = await Test.createTestingModule({
        controllers: [InvitationTokensController],
        providers: [
          {
            provide: InvitationTokensService,
            useValue: {
              createToken: mockCreateToken,
              resolveToken: mockResolveToken,
              redeemToken: mockRedeemToken,
              toggleToken: mockToggleToken,
              findOpenToken: mockFindOpenToken,
            },
          },
        ],
      }).compile();
      controller = module.get(InvitationTokensController);
    });

    it('returns existing open token when found', async () => {
      const result = await controller.getOpenToken(mockUser, InvitationTokenContext.TRIP, TRIP_ID);
      expect(mockFindOpenToken).toHaveBeenCalledWith(
        InvitationTokenContext.TRIP,
        TRIP_ID,
        mockUser.id,
      );
      expect(result).toEqual(mockCreateResponse);
    });

    it('throws NotFoundException when no open token exists', async () => {
      mockFindOpenToken.mockResolvedValueOnce(null);
      await expect(
        controller.getOpenToken(mockUser, InvitationTokenContext.TRIP, TRIP_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('calls findOpenToken with null contextId when contextId is undefined', async () => {
      await controller.getOpenToken(mockUser, InvitationTokenContext.REFERRAL, undefined);
      expect(mockFindOpenToken).toHaveBeenCalledWith(
        InvitationTokenContext.REFERRAL,
        null,
        mockUser.id,
      );
    });
  });
});
