import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import {
  GroupMemberStatus,
  GroupRole,
  InvitationTokenContext,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { InvitationTokensService } from './invitation-tokens.service';
import { EmailService } from '@/modules/email/email.service';
import type { CreateInvitationTokenDto } from './dto/create-invitation-token.dto';

const TRIP_ID = 'trip-uuid';
const GROUP_ID = 'group-uuid';
const CALLER_ID = 'caller-uuid';
const USER_ID = 'user-uuid';
const TOKEN = 'mock-token';
const NOW = new Date('2026-01-01T00:00:00.000Z');
const FRONTEND_URL = 'http://localhost:3000';

const makeOpenTripToken = (overrides = {}) => ({
  token: TOKEN,
  createdBy: CALLER_ID,
  contextType: InvitationTokenContext.TRIP,
  contextId: TRIP_ID,
  recipientEmail: null,
  isActive: true,
  redeemers: [],
  note: null,
  createdAt: NOW,
  ...overrides,
});

describe('InvitationTokensService', () => {
  let service: InvitationTokensService;

  let mockTripParticipantsFindFirst: jest.Mock;
  let mockGroupMembersFindFirst: jest.Mock;
  let mockUsersFindFirst: jest.Mock;
  let mockUserProfilesFindFirst: jest.Mock;
  let mockTripsFindFirst: jest.Mock;
  let mockGroupsFindFirst: jest.Mock;
  let mockInvitationTokensFindFirst: jest.Mock;

  let mockInsertValues: jest.Mock;
  let mockInsertOnConflict: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsert: jest.Mock;
  let mockUpdateWhere: jest.Mock;
  let mockUpdateSet: jest.Mock;
  let mockUpdate: jest.Mock;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockTripParticipantsFindFirst = jest.fn().mockResolvedValue(null);
    mockGroupMembersFindFirst = jest.fn().mockResolvedValue(null);
    mockUsersFindFirst = jest
      .fn()
      .mockResolvedValue({ id: CALLER_ID, displayName: 'Organizer', username: 'organizer' });
    mockUserProfilesFindFirst = jest.fn().mockResolvedValue(null);
    mockTripsFindFirst = jest.fn().mockResolvedValue({ name: 'Cancún 2026' });
    mockGroupsFindFirst = jest.fn().mockResolvedValue({ name: 'Mountain Crew' });
    mockInvitationTokensFindFirst = jest.fn().mockResolvedValue(null);

    mockInsertReturning = jest.fn().mockResolvedValue([makeOpenTripToken()]);
    mockInsertOnConflict = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    mockInsertValues = jest.fn().mockReturnValue({ onConflictDoUpdate: mockInsertOnConflict });
    mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
    mockUpdateWhere = jest.fn().mockResolvedValue(undefined);
    mockUpdateSet = jest.fn().mockReturnValue({ where: mockUpdateWhere });
    mockUpdate = jest.fn().mockReturnValue({ set: mockUpdateSet });
    mockSendMail = jest.fn().mockResolvedValue(undefined);

    const mockDb = {
      query: {
        tripParticipants: { findFirst: mockTripParticipantsFindFirst },
        groupMembers: { findFirst: mockGroupMembersFindFirst },
        users: { findFirst: mockUsersFindFirst },
        userProfiles: { findFirst: mockUserProfilesFindFirst },
        trips: { findFirst: mockTripsFindFirst },
        groups: { findFirst: mockGroupsFindFirst },
        invitationTokens: { findFirst: mockInvitationTokensFindFirst },
      },
      insert: mockInsert,
      update: mockUpdate,
      transaction: jest
        .fn()
        .mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(mockDb)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationTokensService,
        { provide: DRIZZLE_CLIENT, useValue: mockDb },
        {
          provide: EmailService,
          useValue: { sendMail: mockSendMail },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(FRONTEND_URL) },
        },
      ],
    }).compile();

    service = module.get(InvitationTokensService);
  });

  // ── createToken ──────────────────────────────────────────────────────────────

  describe('createToken', () => {
    it('throws BadRequestException when trip context has no contextId', async () => {
      const dto: CreateInvitationTokenDto = { contextType: InvitationTokenContext.TRIP };
      await expect(service.createToken(dto, CALLER_ID)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when caller is not an organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.PARTICIPANT,
        status: TripParticipantStatus.CONFIRMED,
      });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
      };
      await expect(service.createToken(dto, CALLER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('throws ConflictException when recipientEmail is already registered', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      mockUserProfilesFindFirst.mockResolvedValue({ userId: USER_ID });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
        recipientEmail: 'existing@example.com',
      };
      await expect(service.createToken(dto, CALLER_ID)).rejects.toThrow(ConflictException);
    });

    it('creates open trip token and returns token + url from db row', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
      };
      const result = await service.createToken(dto, CALLER_ID);
      expect(result.token).toBe(TOKEN); // token comes from the returned DB row
      expect(result.url).toContain(`/join?token=${TOKEN}`);
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ contextType: InvitationTokenContext.TRIP, contextId: TRIP_ID }),
      );
    });

    it('creates referral token without permission check', async () => {
      const dto: CreateInvitationTokenDto = { contextType: InvitationTokenContext.REFERRAL };
      const result = await service.createToken(dto, CALLER_ID);
      expect(result.token).toBeTruthy();
      expect(mockTripParticipantsFindFirst).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when group caller is not admin', async () => {
      mockGroupMembersFindFirst.mockResolvedValue({
        role: GroupRole.MEMBER,
        status: GroupMemberStatus.ACTIVE,
      });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      };
      await expect(service.createToken(dto, CALLER_ID)).rejects.toThrow(ForbiddenException);
    });

    it('returns existing token when open link already exists (upsert)', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      const existingToken = 'existing-token-abc';
      mockInsertReturning.mockResolvedValueOnce([makeOpenTripToken({ token: existingToken })]);
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
      };
      const result = await service.createToken(dto, CALLER_ID);
      expect(result.token).toBe(existingToken);
    });

    it('rethrows db errors', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      mockInsertReturning.mockRejectedValueOnce(new Error('DB down'));
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
      };
      await expect(service.createToken(dto, CALLER_ID)).rejects.toThrow('DB down');
    });

    it('creates targeted token with recipientEmail and sends email', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
        recipientEmail: 'friend@example.com',
      };
      await service.createToken(dto, CALLER_ID);
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'friend@example.com' }),
      );
    });

    it('resolves group context name for group invitation', async () => {
      mockGroupMembersFindFirst.mockResolvedValue({
        role: GroupRole.OWNER,
        status: GroupMemberStatus.ACTIVE,
      });
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
        recipientEmail: 'friend@example.com',
      };
      await service.createToken(dto, CALLER_ID);
      expect(mockGroupsFindFirst).toHaveBeenCalled();
    });
  });

  // ── findOpenToken ─────────────────────────────────────────────────────────────

  describe('findOpenToken', () => {
    it('returns null when no open token exists', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      const result = await service.findOpenToken(InvitationTokenContext.TRIP, TRIP_ID, CALLER_ID);
      expect(result).toBeNull();
    });

    it('returns token and url when open token exists', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      const result = await service.findOpenToken(InvitationTokenContext.TRIP, TRIP_ID, CALLER_ID);
      expect(result?.token).toBe(TOKEN);
      expect(result?.url).toContain(TOKEN);
    });

    it('throws ForbiddenException when caller is not organizer', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.PARTICIPANT,
        status: TripParticipantStatus.CONFIRMED,
      });
      await expect(
        service.findOpenToken(InvitationTokenContext.TRIP, TRIP_ID, CALLER_ID),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  // ── resolveToken ─────────────────────────────────────────────────────────────

  describe('resolveToken', () => {
    it('throws NotFoundException when token does not exist', async () => {
      await expect(service.resolveToken('bad-token')).rejects.toThrow(NotFoundException);
    });

    it('returns resolve response with context name', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      const result = await service.resolveToken(TOKEN);
      expect(result.token).toBe(TOKEN);
      expect(result.contextName).toBe('Cancún 2026');
      expect(result.createdByUsername).toBe('organizer');
    });
  });

  // ── redeemToken ──────────────────────────────────────────────────────────────

  describe('redeemToken', () => {
    it('throws NotFoundException when token does not exist', async () => {
      await expect(service.redeemToken('bad-token', USER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when open link is inactive', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken({ isActive: false }));
      await expect(service.redeemToken(TOKEN, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when targeted link is inactive', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(
        makeOpenTripToken({ recipientEmail: 'a@b.com', isActive: false }),
      );
      await expect(service.redeemToken(TOKEN, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when targeted link already redeemed', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(
        makeOpenTripToken({
          recipientEmail: 'a@b.com',
          redeemers: [{ who: 'someone', at: NOW.toISOString() }],
        }),
      );
      await expect(service.redeemToken(TOKEN, USER_ID)).rejects.toThrow(ConflictException);
    });

    it('returns ALREADY_MEMBER when user is confirmed', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({ status: TripParticipantStatus.CONFIRMED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('ALREADY_MEMBER');
    });

    it('returns ALREADY_INVITED when user already invited', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({ status: TripParticipantStatus.INVITED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('ALREADY_INVITED');
    });

    it('accepts pending request and returns REQUEST_ACCEPTED', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({
        status: TripParticipantStatus.PENDING_REQUEST,
      });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('REQUEST_ACCEPTED');
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.INVITED }),
      );
    });

    it('creates INVITED record and returns INVITED for new user', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('INVITED');
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TripParticipantStatus.INVITED,
          role: TripRole.PARTICIPANT,
        }),
      );
    });

    it('returns ALREADY_INVITED when user is in ACCEPTED status', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({ status: TripParticipantStatus.ACCEPTED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('ALREADY_INVITED');
    });

    it('re-invites trip participant with DECLINED status', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({ status: TripParticipantStatus.DECLINED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('INVITED');
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: TripParticipantStatus.INVITED }),
      );
    });

    it('returns REFERRAL_RECORDED for referral context', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.REFERRAL,
        contextId: null,
      });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('REFERRAL_RECORDED');
    });

    it('returns ALREADY_MEMBER for group context when user is active', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      });
      mockGroupMembersFindFirst.mockResolvedValue({ status: GroupMemberStatus.ACTIVE });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('ALREADY_MEMBER');
    });

    it('returns ALREADY_INVITED for group context when user already invited', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      });
      mockGroupMembersFindFirst.mockResolvedValue({ status: GroupMemberStatus.INVITED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('ALREADY_INVITED');
    });

    it('accepts group REQUEST and returns REQUEST_ACCEPTED', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      });
      mockGroupMembersFindFirst.mockResolvedValue({ status: GroupMemberStatus.REQUEST });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('REQUEST_ACCEPTED');
    });

    it('creates group INVITED record for new user', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('INVITED');
      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ groupId: GROUP_ID, status: GroupMemberStatus.INVITED }),
      );
    });

    it('re-invites group member with REJECTED/REMOVED status', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.GROUP,
        contextId: GROUP_ID,
      });
      mockGroupMembersFindFirst.mockResolvedValue({ status: GroupMemberStatus.REMOVED });
      const result = await service.redeemToken(TOKEN, USER_ID);
      expect(result.outcome).toBe('INVITED');
      expect(mockUpdateSet).toHaveBeenCalledWith(
        expect.objectContaining({ status: GroupMemberStatus.INVITED }),
      );
    });
  });

  // ── toggleToken ───────────────────────────────────────────────────────────────

  describe('toggleToken', () => {
    it('throws NotFoundException when token does not exist', async () => {
      await expect(service.toggleToken('bad-token', CALLER_ID)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for targeted links', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(
        makeOpenTripToken({ recipientEmail: 'a@b.com' }),
      );
      await expect(service.toggleToken(TOKEN, CALLER_ID)).rejects.toThrow(BadRequestException);
    });

    it('toggles isActive from true to false', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      await service.toggleToken(TOKEN, CALLER_ID);
      expect(mockUpdateSet).toHaveBeenCalledWith({ isActive: false });
    });

    it('toggles isActive from false to true', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken({ isActive: false }));
      await service.toggleToken(TOKEN, CALLER_ID);
      expect(mockUpdateSet).toHaveBeenCalledWith({ isActive: true });
    });

    it('checks permission when caller is not the creator', async () => {
      const otherCaller = 'other-user-uuid';
      mockInvitationTokensFindFirst.mockResolvedValue(makeOpenTripToken());
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      await service.toggleToken(TOKEN, otherCaller);
      expect(mockTripParticipantsFindFirst).toHaveBeenCalled();
    });
  });

  // ── email error path ──────────────────────────────────────────────────────────

  describe('email error handling', () => {
    it('logs error but does not throw when email fails', async () => {
      mockTripParticipantsFindFirst.mockResolvedValue({
        role: TripRole.ORGANIZER,
        status: TripParticipantStatus.CONFIRMED,
      });
      mockSendMail.mockRejectedValueOnce(new Error('SMTP down'));
      const dto: CreateInvitationTokenDto = {
        contextType: InvitationTokenContext.TRIP,
        contextId: TRIP_ID,
        recipientEmail: 'friend@example.com',
      };
      // Should not throw even if email fails
      await expect(service.createToken(dto, CALLER_ID)).resolves.toBeTruthy();
    });
  });

  // ── resolveContextName paths ──────────────────────────────────────────────────

  describe('resolveToken context name resolution', () => {
    it('returns null contextName for referral context (null contextId)', async () => {
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.REFERRAL,
        contextId: null,
      });
      const result = await service.resolveToken(TOKEN);
      expect(result.contextName).toBeNull();
    });

    it('returns null contextName for referral context with non-null contextId', async () => {
      // Covers the final `return null` in resolveContextName when contextType is REFERRAL
      // but contextId is not null (defensive branch)
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: InvitationTokenContext.REFERRAL,
        contextId: TRIP_ID,
      });
      const result = await service.resolveToken(TOKEN);
      expect(result.contextName).toBeNull();
    });

    it('throws BadRequestException for unknown contextType in processRedemption', async () => {
      // Covers the defensive throw in processRedemption
      mockInvitationTokensFindFirst.mockResolvedValue({
        ...makeOpenTripToken(),
        contextType: 'unknown' as unknown as InvitationTokenContext,
        contextId: null,
      });
      await expect(service.redeemToken(TOKEN, USER_ID)).rejects.toThrow(BadRequestException);
    });
  });
});
