/**
 * Auth integration tests
 *
 * Boots the full NestJS application (real Drizzle + real Postgres) but replaces
 * FirebaseAdminService with a configurable mock so tests can control token
 * verification results without real Firebase credentials.
 *
 * Requires:
 *   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/chamuco_test
 *   (set automatically in CI; see .github/workflows/api.yml)
 *
 * Migrations are applied via `db:migrate` in CI before this suite runs.
 * Locally: ensure Docker Postgres is running and migrations are up to date.
 */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { DRIZZLE_CLIENT, DrizzleClient } from '@/database/drizzle.provider';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

// ---------------------------------------------------------------------------
// Shared mock FirebaseAdminService
// ---------------------------------------------------------------------------

const mockVerifyIdToken = jest.fn();
const mockRevokeRefreshTokens = jest.fn().mockResolvedValue(undefined);

const mockFirebaseAdminService = {
  auth: jest.fn().mockReturnValue({
    verifyIdToken: mockVerifyIdToken,
    revokeRefreshTokens: mockRevokeRefreshTokens,
  }),
};

// ---------------------------------------------------------------------------
// Test tokens — these never reach Firebase; they are intercepted by the mock
// ---------------------------------------------------------------------------
const VALID_GOOGLE_TOKEN = 'Bearer test-google-token';
const VALID_DECODED_TOKEN = {
  uid: 'firebase-uid-e2e-test',
  email: 'e2e-test@chamuco.dev',
  name: 'E2E Test User',
  picture: 'https://example.com/avatar.jpg',
  firebase: { sign_in_provider: 'google.com' },
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

describe('Auth endpoints (integration)', () => {
  let app: INestApplication;
  let db: DrizzleClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseAdminService)
      .useValue(mockFirebaseAdminService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    db = moduleFixture.get<DrizzleClient>(DRIZZLE_CLIENT);
  });

  afterAll(async () => {
    // Clean up any test users created during this suite.
    await db.execute(sql`DELETE FROM users WHERE email = ${'e2e-test@chamuco.dev'}`);
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockRevokeRefreshTokens.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // GET /api/v1/auth/username/:username/available
  // -------------------------------------------------------------------------

  describe('GET /api/v1/auth/username/:username/available', () => {
    it('returns available:true for a username that does not exist', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/username/nonexistent_user_e2e/available')
        .expect(200);

      expect(res.body).toMatchObject({ available: true });
    });

    it('returns 400 for an invalid username format', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/username/INVALID USER!/available')
        .expect(400);
    });

    it('returns 400 for a username that is too short', async () => {
      await request(app.getHttpServer()).get('/api/v1/auth/username/ab/available').expect(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/register
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/register', () => {
    it('creates a new user, normalises username to lowercase, and returns 201', async () => {
      mockVerifyIdToken.mockResolvedValue(VALID_DECODED_TOKEN);

      // Send an uppercase username — the @Transform on RegisterDto lowercases it before
      // validation and persistence, so the stored username must be lowercase.
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Authorization', VALID_GOOGLE_TOKEN)
        .send({ username: 'E2E_Test_User' })
        .expect(201);

      expect(res.body).toMatchObject({
        email: 'e2e-test@chamuco.dev',
        username: 'e2e_test_user',
        displayName: 'E2E Test User',
        authProvider: 'GOOGLE',
      });
      expect(res.body).toHaveProperty('id');
    });

    it('returns 409 when registering the same Firebase UID twice', async () => {
      mockVerifyIdToken.mockResolvedValue(VALID_DECODED_TOKEN);

      // Second attempt with same Firebase UID — user already exists.
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Authorization', VALID_GOOGLE_TOKEN)
        .send({ username: 'different_username' })
        .expect(409);
    });

    it('returns 409 when username is already taken', async () => {
      // A different Firebase UID but same username.
      // The token string itself is irrelevant — Firebase verification is mocked per test.
      mockVerifyIdToken.mockResolvedValue({
        ...VALID_DECODED_TOKEN,
        uid: 'firebase-uid-e2e-test-2',
        email: 'other@chamuco.dev',
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Authorization', VALID_GOOGLE_TOKEN)
        .send({ username: 'e2e_test_user' }) // same username as registered above
        .expect(409);
    });

    it('returns 400 when the username format is invalid', async () => {
      mockVerifyIdToken.mockResolvedValue(VALID_DECODED_TOKEN);

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Authorization', VALID_GOOGLE_TOKEN)
        .send({ username: 'INVALID USERNAME!' })
        .expect(400);
    });

    it('returns 401 when the Authorization token is invalid', async () => {
      mockVerifyIdToken.mockRejectedValue(new Error('Firebase: invalid token'));

      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .set('Authorization', 'Bearer bad-token')
        .send({ username: 'some_user' })
        .expect(401);
    });

    it('returns 401 when no Authorization header is provided', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ username: 'some_user' })
        .expect(401);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/logout
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/logout', () => {
    it('returns 204 and revokes refresh tokens for an authenticated user', async () => {
      // The guard verifies the token and attaches the user; we need a real user in the DB.
      mockVerifyIdToken.mockResolvedValue(VALID_DECODED_TOKEN);

      // Set up: the guard queries the DB for the user by UID.
      // Our test user was registered in the register suite above.
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', VALID_GOOGLE_TOKEN)
        .expect(204);

      expect(mockRevokeRefreshTokens).toHaveBeenCalledWith('firebase-uid-e2e-test');
    });

    it('returns 401 when no Authorization header is provided', async () => {
      await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
    });
  });
});
