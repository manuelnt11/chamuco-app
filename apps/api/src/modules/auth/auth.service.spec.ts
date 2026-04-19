import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole } from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { AuthService } from '@/modules/auth/auth.service';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import type { RegisterResponseDto } from './dto/register-response.dto';
import type { RegisterDto } from './dto/register.dto';

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

const validRegisterDto: RegisterDto = {
  username: 'john_doe',
  displayName: 'John Doe',
  firstName: 'JOHN',
  lastName: 'DOE',
  dateOfBirth: { day: 15, month: 6, year: 2000, yearVisible: false },
  homeCountry: 'CO',
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  nationalities: [{ countryCode: 'CO', isPrimary: true }],
  emergencyContacts: [
    {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: true,
    },
  ],
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
      await expect(service.register(undefined, validRegisterDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when header does not start with "Bearer "', async () => {
      await expect(service.register('Token some-token', validRegisterDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockVerifyIdToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when verifyIdToken rejects', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Token expired'));

      await expect(service.register('Bearer invalid-token', validRegisterDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw BadRequestException when email claim is missing from the token', async () => {
      mockVerifyIdToken.mockResolvedValue({ ...mockDecodedToken, email: undefined });

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockFindFirst).not.toHaveBeenCalled();
    });
  });

  describe('duplicate checks', () => {
    it('should throw ConflictException when firebase_uid already has a user record', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValueOnce(mockCreatedUser);

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        new ConflictException('User already registered'),
      );
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when DB raises a unique violation (username race condition)', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      mockTransaction.mockRejectedValue({ code: '23505' });

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        new ConflictException('Username is already taken'),
      );
    });

    it('should throw ConflictException when DrizzleQueryError wraps a unique violation in cause', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      // Drizzle wraps the underlying PostgresError in `cause`; the top-level error
      // has no `code` property — only `cause.code` carries the PG error code.
      mockTransaction.mockRejectedValue({ cause: { code: '23505' } });

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        new ConflictException('Username is already taken'),
      );
    });

    it('should rethrow non-unique-violation DB errors', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      const dbError = new Error('connection lost');
      mockTransaction.mockRejectedValue(dbError);

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        dbError,
      );
    });

    it('should rethrow when the DB rejects with a non-object value', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);
      // Covers the isUniqueViolation(err) guard: typeof err !== 'object'
      mockTransaction.mockRejectedValue('unexpected string rejection');

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toBe(
        'unexpected string rejection',
      );
    });
  });

  describe('primary validation', () => {
    it('should throw BadRequestException when no nationality has isPrimary: true', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const dto: RegisterDto = {
        ...validRegisterDto,
        nationalities: [{ countryCode: 'CO', isPrimary: false }],
      };

      await expect(service.register('Bearer valid-token', dto)).rejects.toThrow(
        new BadRequestException('Exactly one nationality must have isPrimary: true'),
      );
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when multiple nationalities have isPrimary: true', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const dto: RegisterDto = {
        ...validRegisterDto,
        nationalities: [
          { countryCode: 'CO', isPrimary: true },
          { countryCode: 'US', isPrimary: true },
        ],
      };

      await expect(service.register('Bearer valid-token', dto)).rejects.toThrow(
        new BadRequestException('Exactly one nationality must have isPrimary: true'),
      );
      expect(mockTransaction).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when no emergency contact has isPrimary: true', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const dto: RegisterDto = {
        ...validRegisterDto,
        emergencyContacts: [{ ...validRegisterDto.emergencyContacts![0]!, isPrimary: false }],
      };

      await expect(service.register('Bearer valid-token', dto)).rejects.toThrow(
        new BadRequestException('Exactly one emergency contact must have isPrimary: true'),
      );
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

      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should set authProvider to GOOGLE for google.com sign_in_provider', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.register('Bearer valid-token', validRegisterDto);

      expect(result).toEqual(mockCreatedUser);
      expect(mockTransaction).toHaveBeenCalled();
    });

    it('should set authProvider to FACEBOOK for facebook.com sign_in_provider', async () => {
      mockVerifyIdToken.mockResolvedValue({
        ...mockDecodedToken,
        firebase: { sign_in_provider: 'facebook.com' },
      });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', validRegisterDto);

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

  describe('successful registration', () => {
    it('should create user, preferences, profile and nationalities atomically and return the user', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      const result = await service.register('Bearer valid-token', validRegisterDto);

      expect(result).toEqual(mockCreatedUser);
      expect(mockTransaction).toHaveBeenCalledTimes(1);
      // Four inserts: users + user_preferences + user_profiles + user_nationalities
      expect(mockTrxInsert).toHaveBeenCalledTimes(4);
    });

    it('should use dto.displayName in the insert', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', {
        ...validRegisterDto,
        displayName: 'Custom Name',
      });

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(
        expect.objectContaining({ displayName: 'Custom Name' }),
      );
    });

    it('should set avatarUrl to null when picture claim is absent', async () => {
      mockVerifyIdToken.mockResolvedValue({ ...mockDecodedToken, picture: undefined });
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', validRegisterDto);

      const insertValues = mockTrxInsert.mock.results[0]?.value?.values;
      expect(insertValues).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: null }));
    });

    it('should insert profile with firstName, lastName, homeCountry and emergency contacts', async () => {
      mockVerifyIdToken.mockResolvedValue(mockDecodedToken);
      mockFindFirst.mockResolvedValue(undefined);

      await service.register('Bearer valid-token', validRegisterDto);

      // Third insert call is userProfiles (index 2)
      const profileInsertValues = mockTrxInsert.mock.results[2]?.value?.values;
      expect(profileInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'JOHN',
          lastName: 'DOE',
          homeCountry: 'CO',
          phoneCountryCode: '+57',
        }),
      );
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
      await expect(service.register('Bearer valid-token', validRegisterDto)).rejects.toThrow(
        'Failed to create user record',
      );
    });
  });
});
