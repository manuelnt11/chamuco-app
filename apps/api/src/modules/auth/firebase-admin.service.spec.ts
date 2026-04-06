import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

jest.mock('firebase-admin', () => {
  const mockAuth = { verifyIdToken: jest.fn() };
  return {
    apps: [] as admin.app.App[],
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn().mockReturnValue('mock-credential'),
    },
    auth: jest.fn().mockReturnValue(mockAuth),
  };
});

const mockServiceAccountJson = JSON.stringify({
  type: 'service_account',
  project_id: 'chamuco-test',
  private_key_id: 'key-id',
  private_key: '-----BEGIN RSA PRIVATE KEY-----\nmock\n-----END RSA PRIVATE KEY-----\n',
  client_email: 'test@chamuco-test.iam.gserviceaccount.com',
  client_id: '123456',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
});

describe('FirebaseAdminService', () => {
  let service: FirebaseAdminService;
  let configService: ConfigService;

  const buildModule = async (): Promise<TestingModule> => {
    return Test.createTestingModule({
      providers: [
        FirebaseAdminService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockServiceAccountJson),
          },
        },
      ],
    }).compile();
  };

  beforeEach(async () => {
    // Reset apps array between tests
    (admin.apps as admin.app.App[]).length = 0;
    jest.clearAllMocks();

    const module = await buildModule();
    service = module.get<FirebaseAdminService>(FirebaseAdminService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should initialize Firebase Admin app on first call', () => {
      service.onModuleInit();

      expect(configService.get).toHaveBeenCalledWith('FIREBASE_SERVICE_ACCOUNT_JSON');
      expect(admin.credential.cert).toHaveBeenCalledWith(JSON.parse(mockServiceAccountJson));
      expect(admin.initializeApp).toHaveBeenCalledWith({
        credential: 'mock-credential',
      });
    });

    it('should skip initialization when an app is already registered', () => {
      // Simulate an already-initialized app
      (admin.apps as unknown[]).push({ name: '[DEFAULT]' });

      service.onModuleInit();

      expect(admin.initializeApp).not.toHaveBeenCalled();
    });

    it('should initialize exactly once even if onModuleInit is called multiple times', () => {
      service.onModuleInit();
      // Simulate app being registered after first init
      (admin.apps as unknown[]).push({ name: '[DEFAULT]' });

      service.onModuleInit();

      expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth', () => {
    it('should return the firebase auth instance', () => {
      const authInstance = service.auth();

      expect(admin.auth).toHaveBeenCalled();
      expect(authInstance).toBeDefined();
    });
  });
});
