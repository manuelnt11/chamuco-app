import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

jest.mock('firebase-admin/app', () => ({
  getApps: jest.fn().mockReturnValue([]),
  initializeApp: jest.fn(),
  cert: jest.fn().mockReturnValue('mock-credential'),
}));

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn().mockReturnValue({ verifyIdToken: jest.fn() }),
}));

jest.mock('firebase-admin/messaging', () => ({
  getMessaging: jest.fn(),
}));

const mockGetApps = jest.mocked(getApps);
const mockInitializeApp = jest.mocked(initializeApp);
const mockCert = jest.mocked(cert);
const mockGetAuth = jest.mocked(getAuth);

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
    jest.clearAllMocks();
    mockGetApps.mockReturnValue([]);

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
      expect(mockCert).toHaveBeenCalledWith(JSON.parse(mockServiceAccountJson));
      expect(mockInitializeApp).toHaveBeenCalledWith({
        credential: 'mock-credential',
      });
    });

    it('should skip initialization when an app is already registered', () => {
      mockGetApps.mockReturnValue([{ name: '[DEFAULT]' } as ReturnType<typeof getApps>[number]]);

      service.onModuleInit();

      expect(mockInitializeApp).not.toHaveBeenCalled();
    });

    it('should initialize exactly once even if onModuleInit is called multiple times', () => {
      service.onModuleInit();
      mockGetApps.mockReturnValue([{ name: '[DEFAULT]' } as ReturnType<typeof getApps>[number]]);

      service.onModuleInit();

      expect(mockInitializeApp).toHaveBeenCalledTimes(1);
    });
  });

  describe('auth', () => {
    it('should return the firebase auth instance', () => {
      const authInstance = service.auth();

      expect(mockGetAuth).toHaveBeenCalled();
      expect(authInstance).toBe(mockGetAuth());
    });
  });
});
