import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AuthService } from '@/modules/auth/auth.service';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import type { RegisterResponseDto } from './dto/register-response.dto';

const mockCreatedUser: RegisterResponseDto = {
  id: 'user-uuid',
  email: 'test@example.com',
  username: 'john_doe',
  displayName: 'John Doe',
  avatarUrl: 'https://example.com/avatar.jpg',
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid-123',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  agencyId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastActiveAt: new Date(),
};

const mockDecodedToken = {
  uid: 'firebase-uid-123',
  email: 'test@example.com',
  name: 'John Doe',
  picture: 'https://example.com/avatar.jpg',
  firebase: { sign_in_provider: 'google.com' },
};

describe('AuthService', () => {
  let service: AuthService;
  let mockVerifyIdToken: jest.Mock;
  let mockFindFirst: jest.Mock;
  let mockTrxInsert: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    mockFindFirst = jest.fn();

    const mockReturning = jest.fn().mockResolvedValue([mockCreatedUser]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    mockTrxInsert = jest.fn().mockReturnValue({ values: mockValues });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (cb: (trx: unknown) => Promise<unknown>) =>
        cb({ insert: mockTrxInsert }),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: FirebaseAdminService,
          useValue: {
            auth: jest.fn().mockReturnValue({ verifyIdToken: mockVerifyIdToken }),
          },
        },
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: { users: { findFirst: mockFindFirst } },
            transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('token extraction', () => {
    it('should throw UnauthorizedException when Authorization header is absent', async () => {
      await expect(service.register(undefined, { username: 'john_doe' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when header does not start with "Bearer "', async () => {
      await expect(service.register('Token some-token', { username: 'john_doe' })).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when verifyIdToken rejects', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

      await expect(
        service.register('Bearer invalid-token', { username: 'john_doe' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('duplicate checks', () => {
    it('should throw ConflictException when firebase_uid already has a user record', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValueOnce(mockCreatedUser);

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(new ConflictException('User already registered'));
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when username is already taken', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce(mockCreatedUser);

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(new ConflictException('Username is already taken'));
      expect(mockTransaction).not.toHaveBeenCalled();
    });
  });

  describe('provider derivation', () => {
    it('should throw BadRequestException for an unsupported sign_in_provider', async () => {
      mockVerifyIdToken.mockResolvedValue({
        ...mockDecodedToken,
        firebase: { sign_in_provider: 'password' },
      });
      mockFindFirst.mockResolvedValue(undefined);

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set authProvider to GOOGLE for google.com sign_in_provider', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.register('Bearer valid-token', { username: 'john_doe' });

      expect(result).toEqual(mockCreatedUser);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should set authProvider to FACEBOOK for facebook.com sign_in_provider', async () => {
      mockVerifyIdToken.mockResolvedValue({
        ...mockDecodedToken,
        firebase: { sign_in_provider: 'facebook.com' },
      });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', { username: 'john_doe' });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ authProvider: AuthProvider.FACEBOOK }),
      );
    });
  });

  describe('successful registration', () => {
    it('should create user and preferences in a transaction and return the user', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.register('Bearer valid-token', { username: 'john_doe' });

      expect(result).toEqual(mockCreatedUser);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      // Two inserts: users + user_preferences
      expect(mockTrxInsert).toHaveBeenCalledTimes(2);
    });

    it('should use email as displayName fallback when name claim is absent', async () => {
      mockVerifyIdToken.mockResolvedValue({
        ...mockDecodedToken,
        name: undefined,
        email: 'fallback@example.com',
      });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', { username: 'john_doe' });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'fallback@example.com' }),
      );
    });

    it('should use username as displayName fallback when both name and email are absent', async () => {
      mockVerifyIdToken.mockResolvedValue({
        ...mockDecodedToken,
        name: undefined,
        email: undefined,
      });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', { username: 'john_doe' });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'john_doe' }),
      );
    });

    it('should set avatarUrl to null when picture claim is absent', async () => {
      mockVerifyIdToken.mockResolvedValue({ ...mockDecodedToken, picture: undefined });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', { username: 'john_doe' });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: null }));
    });
  });
});
