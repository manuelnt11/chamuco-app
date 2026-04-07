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
  let mockRevokeRefreshTokens: jest.Mock;
  let mockFindFirst: jest.Mock;
  let mockTrxInsert: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockVerifyIdToken = jest.fn();
    mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined);
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
            auth: jest.fn().mockReturnValue({
              verifyIdToken: mockVerifyIdToken,
              revokeRefreshTokens: mockRevokeRefreshTokens,
            }),
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

    it('should throw BadRequestException when email claim is missing from the token', async () => {
      mockVerifyIdToken.mockResolvedValue({ ...mockDecodedToken, email: undefined });

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(BadRequestException);
      expect(mockFindFirst).not.toHaveBeenCalled();
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

    it('should throw ConflictException when DB raises a unique violation (username race condition)', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      mockTransaction.mockRejectedValue({ code: '23505' });

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(new ConflictException('Username is already taken'));
    });

    it('should throw ConflictException when DrizzleQueryError wraps a unique violation in cause', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      // Drizzle wraps the underlying PostgresError in `cause`; the top-level error
      // has no `code` property — only `cause.code` carries the PG error code.
      mockTransaction.mockRejectedValue({ cause: { code: '23505' } });

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(new ConflictException('Username is already taken'));
    });

    it('should rethrow non-unique-violation DB errors', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      const dbError = new Error('connection lost');
      mockTransaction.mockRejectedValue(dbError);

      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow(dbError);
    });

    it('should rethrow when the DB rejects with a non-object value', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      // Covers the isUniqueViolation(err) guard: typeof err !== 'object'
      mockTransaction.mockRejectedValue('unexpected string rejection');

      await expect(service.register('Bearer valid-token', { username: 'john_doe' })).rejects.toBe(
        'unexpected string rejection',
      );
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

  describe('logout', () => {
    it('should call revokeRefreshTokens with the provided firebaseUid', async () => {
      await service.logout('firebase-uid-123');

      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('firebase-uid-123');
    });

    it('should propagate errors thrown by revokeRefreshTokens', async () => {
      const error = new Error('Firebase unavailable');
      mockRevokeRefreshTokens.mockRejectedValue(error);

      await expect(service.logout('firebase-uid-123')).rejects.toThrow(error);
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return available: true when no user has that username', async () => {
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.checkUsernameAvailability('free_name');

      expect(result).toEqual({ available: true, username: 'free_name' });
    });

    it('should return available: false when the username is already taken', async () => {
      mockFindFirst.mockResolvedValue(mockCreatedUser);

      const result = await service.checkUsernameAvailability('john_doe');

      expect(result).toEqual({ available: false, username: 'john_doe' });
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

    it('should set avatarUrl to null when picture claim is absent', async () => {
      mockVerifyIdToken.mockResolvedValue({ ...mockDecodedToken, picture: undefined });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', { username: 'john_doe' });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: null }));
    });

    it('should throw when the DB insert returns no rows (defensive guard)', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      // Simulate a DB anomaly where INSERT ... RETURNING returns an empty result set.
      const mockReturningEmpty = jest.fn().mockResolvedValue([]);
      const mockValuesEmpty = jest.fn().mockReturnValue({ returning: mockReturningEmpty });
      mockTrxInsert.mockReturnValueOnce({ values: mockValuesEmpty });

      // The transaction callback throws; the .catch in AuthService re-throws
      // because an empty returning is not a unique violation.
      await expect(
        service.register('Bearer valid-token', { username: 'john_doe' }),
      ).rejects.toThrow('Failed to create user record');
    });
  });
});
