import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { FeedbackController } from '@/modules/feedback/feedback.controller';
import { FeedbackService } from '@/modules/feedback/feedback.service';
import type { CreateFeedbackDto } from '@/modules/feedback/dto/create-feedback.dto';
import type { FeedbackResponseDto } from '@/modules/feedback/dto/feedback-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockResponse: FeedbackResponseDto = {
  issueUrl: 'https://github.com/manuelnt11/Chamuco-App/issues/42',
};

describe('FeedbackController', () => {
  let controller: FeedbackController;
  let mockCreateFeedback: jest.Mock;

  beforeEach(async () => {
    mockCreateFeedback = jest.fn().mockResolvedValue(mockResponse);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [
        {
          provide: FeedbackService,
          useValue: { createFeedback: mockCreateFeedback },
        },
      ],
    }).compile();

    controller = module.get<FeedbackController>(FeedbackController);
  });

  describe('POST /', () => {
    it('calls service with userId, comment, and context and returns issue URL', async () => {
      const dto: CreateFeedbackDto = {
        comment: 'This is a helpful feedback comment.',
        currentPage: '/trips/123',
        userAgent: 'Mozilla/5.0',
        viewportSize: '1920x1080',
        language: 'es-CO',
      };

      const result = await controller.create(mockAuthUser, dto);

      expect(mockCreateFeedback).toHaveBeenCalledWith(mockAuthUser.id, dto.comment, {
        currentPage: dto.currentPage,
        userAgent: dto.userAgent,
        viewportSize: dto.viewportSize,
        language: dto.language,
      });
      expect(result).toEqual(mockResponse);
    });

    it('passes undefined context fields when not provided in dto', async () => {
      const dto: CreateFeedbackDto = { comment: 'This is a helpful feedback comment.' };

      await controller.create(mockAuthUser, dto);

      expect(mockCreateFeedback).toHaveBeenCalledWith(mockAuthUser.id, dto.comment, {
        currentPage: undefined,
        userAgent: undefined,
        viewportSize: undefined,
        language: undefined,
      });
    });

    it('propagates ServiceUnavailableException from service', async () => {
      mockCreateFeedback.mockRejectedValue(
        new ServiceUnavailableException('Failed to submit feedback. Please try again.'),
      );
      const dto: CreateFeedbackDto = { comment: 'This is a helpful feedback comment.' };

      await expect(controller.create(mockAuthUser, dto)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});
