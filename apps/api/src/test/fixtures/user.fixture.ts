import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import type { AuthenticatedUser } from '@/types/express';

export const NOW = new Date('2026-01-01T00:00:00.000Z');

export function makeAuthenticatedUser(
  overrides: Partial<AuthenticatedUser> = {},
): AuthenticatedUser {
  return {
    id: 'user-uuid',
    username: 'john_doe',
    displayName: 'John Doe',
    avatar: null,
    authProvider: AuthProvider.GOOGLE,
    firebaseUid: 'firebase-uid-123',
    timezone: 'UTC',
    platformRole: PlatformRole.USER,
    profileVisibility: ProfileVisibility.PRIVATE,
    agencyId: null,
    createdAt: NOW,
    updatedAt: NOW,
    lastActiveAt: NOW,
    ...overrides,
  };
}
