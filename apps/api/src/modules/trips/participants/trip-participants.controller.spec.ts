import { StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  ExportField,
  ExportFormat,
  PlatformRole,
  ProfileVisibility,
  TripParticipantStatus,
  TripRole,
} from '@chamuco/shared-types';
import type { Response } from 'express';

import { TripParticipantsController } from './trip-participants.controller';
import { TripParticipantsService } from './trip-participants.service';
import type { UpdateParticipantRoleDto } from './dto/update-participant-role.dto';
import type { ParticipantResponseDto } from './dto/participant-response.dto';
import type { PendingParticipantResponseDto } from './dto/pending-participant-response.dto';
import type { MyTripInvitationResponseDto } from './dto/my-trip-invitation-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'organizer-uuid',
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

const mockParticipant: ParticipantResponseDto = {
  userId: 'user-uuid',
  username: 'user',
  displayName: 'User',
  avatarUrl: null,
  role: TripRole.PARTICIPANT,
  isTraveler: true,
  status: TripParticipantStatus.ACCEPTED,
  confirmedAt: null,
};

const mockPending: PendingParticipantResponseDto = {
  userId: 'user-uuid',
  username: 'user',
  displayName: 'User',
  avatarUrl: null,
  status: TripParticipantStatus.INVITED,
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

const mockInvitation: MyTripInvitationResponseDto = {
  trip: { id: 'trip-uuid', name: 'Alps Adventure', coverUrl: null },
  initiatedAt: '2026-01-01T00:00:00.000Z',
};

describe('TripParticipantsController', () => {
  let controller: TripParticipantsController;
  let mockRemoveParticipant: jest.Mock;
  let mockUpdateParticipantRole: jest.Mock;
  let mockToggleParticipantConfirmation: jest.Mock;
  let mockGetMyParticipation: jest.Mock;
  let mockListActiveParticipants: jest.Mock;
  let mockListPendingParticipants: jest.Mock;
  let mockListMyInvitations: jest.Mock;
  let mockExportParticipants: jest.Mock;

  beforeEach(async () => {
    mockRemoveParticipant = jest.fn().mockResolvedValue(undefined);
    mockUpdateParticipantRole = jest.fn().mockResolvedValue(undefined);
    mockToggleParticipantConfirmation = jest.fn().mockResolvedValue(undefined);
    mockGetMyParticipation = jest.fn().mockResolvedValue({
      status: TripParticipantStatus.CONFIRMED,
      role: TripRole.PARTICIPANT,
      isTraveler: true,
    });
    mockListActiveParticipants = jest.fn().mockResolvedValue([mockParticipant]);
    mockListPendingParticipants = jest.fn().mockResolvedValue([mockPending]);
    mockListMyInvitations = jest.fn().mockResolvedValue([mockInvitation]);
    mockExportParticipants = jest.fn().mockResolvedValue(Buffer.from('test'));

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripParticipantsController],
      providers: [
        {
          provide: TripParticipantsService,
          useValue: {
            removeParticipant: mockRemoveParticipant,
            updateParticipantRole: mockUpdateParticipantRole,
            toggleParticipantConfirmation: mockToggleParticipantConfirmation,
            getMyParticipation: mockGetMyParticipation,
            listActiveParticipants: mockListActiveParticipants,
            listPendingParticipants: mockListPendingParticipants,
            listMyInvitations: mockListMyInvitations,
            exportParticipants: mockExportParticipants,
          },
        },
      ],
    }).compile();

    controller = module.get<TripParticipantsController>(TripParticipantsController);
  });

  describe('GET /v1/trips/invitations', () => {
    it('delegates to service.listMyInvitations', async () => {
      const result = await controller.listMyInvitations(mockAuthUser);

      expect(mockListMyInvitations).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockInvitation]);
    });
  });

  describe('DELETE /v1/trips/:id/participants/:userId', () => {
    it('delegates to service.removeParticipant', async () => {
      await controller.removeParticipant(mockAuthUser, 'trip-uuid', 'user-uuid');

      expect(mockRemoveParticipant).toHaveBeenCalledWith('trip-uuid', 'user-uuid', mockAuthUser.id);
    });
  });

  describe('PATCH /v1/trips/:id/participants/:userId/role', () => {
    it('delegates to service.updateParticipantRole', async () => {
      const dto: UpdateParticipantRoleDto = { role: TripRole.CO_ORGANIZER };

      await controller.updateParticipantRole(mockAuthUser, 'trip-uuid', 'user-uuid', dto);

      expect(mockUpdateParticipantRole).toHaveBeenCalledWith(
        'trip-uuid',
        'user-uuid',
        dto,
        mockAuthUser.id,
      );
    });
  });

  describe('GET /v1/trips/:id/participants/me', () => {
    it('delegates to service.getMyParticipation', async () => {
      const result = await controller.getMyParticipation(mockAuthUser, 'trip-uuid');

      expect(mockGetMyParticipation).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
      expect(result.status).toBe(TripParticipantStatus.CONFIRMED);
    });
  });

  describe('GET /v1/trips/:id/participants', () => {
    it('delegates to service.listActiveParticipants and returns list', async () => {
      const result = await controller.listActiveParticipants(mockAuthUser, 'trip-uuid');

      expect(mockListActiveParticipants).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
      expect(result).toEqual([mockParticipant]);
    });
  });

  describe('GET /v1/trips/:id/participants/pending', () => {
    it('delegates to service.listPendingParticipants and returns list', async () => {
      const result = await controller.listPendingParticipants(mockAuthUser, 'trip-uuid');

      expect(mockListPendingParticipants).toHaveBeenCalledWith('trip-uuid', mockAuthUser.id);
      expect(result).toEqual([mockPending]);
    });
  });

  describe('PATCH /v1/trips/:id/participants/:userId/confirmation', () => {
    it('delegates to service.toggleParticipantConfirmation', async () => {
      await controller.toggleParticipantConfirmation(mockAuthUser, 'trip-uuid', 'user-uuid');

      expect(mockToggleParticipantConfirmation).toHaveBeenCalledWith(
        'trip-uuid',
        'user-uuid',
        mockAuthUser.id,
      );
    });
  });

  describe('GET /v1/trips/:id/participants/export', () => {
    const mockRes = () => ({ set: jest.fn() }) as unknown as Response;

    it('delegates to service.exportParticipants with default CSV format', async () => {
      const res = mockRes();
      const result = await controller.exportParticipants(mockAuthUser, 'trip-uuid', {}, res);

      expect(mockExportParticipants).toHaveBeenCalledWith(
        'trip-uuid',
        mockAuthUser.id,
        ExportFormat.CSV,
        expect.any(Array),
      );
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ 'Content-Type': expect.stringContaining('csv') }),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('uses XLSX content-type and extension when format is xlsx', async () => {
      const res = mockRes();
      await controller.exportParticipants(
        mockAuthUser,
        'trip-uuid',
        { format: ExportFormat.XLSX },
        res,
      );

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': expect.stringContaining('.xlsx'),
        }),
      );
    });

    it('uses ODS content-type and extension when format is ods', async () => {
      const res = mockRes();
      await controller.exportParticipants(
        mockAuthUser,
        'trip-uuid',
        { format: ExportFormat.ODS },
        res,
      );

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Type': 'application/vnd.oasis.opendocument.spreadsheet',
          'Content-Disposition': expect.stringContaining('.ods'),
        }),
      );
    });

    it('passes selected fields to service', async () => {
      const res = mockRes();
      const fields = [ExportField.FIRST_NAME, ExportField.LAST_NAME, ExportField.EMAIL];
      await controller.exportParticipants(
        mockAuthUser,
        'trip-uuid',
        { format: ExportFormat.CSV, fields },
        res,
      );

      expect(mockExportParticipants).toHaveBeenCalledWith(
        'trip-uuid',
        mockAuthUser.id,
        ExportFormat.CSV,
        fields,
      );
    });
  });
});
