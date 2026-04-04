import { getTableConfig } from 'drizzle-orm/pg-core';

import { AuthProvider, PlatformRole } from '@chamuco/shared-types';

import { authProviderEnum, platformRoleEnum, users } from './users.schema';

describe('users schema', () => {
  it('exports the users table', () => {
    expect(users).toBeDefined();
  });

  it('has correct table name', () => {
    const config = getTableConfig(users);
    expect(config.name).toBe('users');
  });

  it('has all expected columns', () => {
    const config = getTableConfig(users);
    const columnNames = config.columns.map((c) => c.name);
    expect(columnNames).toEqual(
      expect.arrayContaining([
        'id',
        'email',
        'username',
        'display_name',
        'avatar_url',
        'auth_provider',
        'firebase_uid',
        'timezone',
        'platform_role',
        'agency_id',
        'created_at',
        'updated_at',
        'last_active_at',
      ]),
    );
  });

  it('has unique columns: email, username, firebase_uid', () => {
    const config = getTableConfig(users);
    const uniqueColumns = config.columns.filter((c) => c.isUnique).map((c) => c.name);
    expect(uniqueColumns).toContain('email');
    expect(uniqueColumns).toContain('username');
    expect(uniqueColumns).toContain('firebase_uid');
  });

  it('authProviderEnum contains all AuthProvider values', () => {
    expect(authProviderEnum.enumValues).toContain(AuthProvider.GOOGLE);
    expect(authProviderEnum.enumValues).toContain(AuthProvider.FACEBOOK);
  });

  it('platformRoleEnum contains all PlatformRole values', () => {
    expect(platformRoleEnum.enumValues).toContain(PlatformRole.USER);
    expect(platformRoleEnum.enumValues).toContain(PlatformRole.SUPPORT_ADMIN);
  });
});
