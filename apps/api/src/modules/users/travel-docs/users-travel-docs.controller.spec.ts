import { Test, TestingModule } from '@nestjs/testing';
import {
  AuthProvider,
  DocumentStatus,
  EtaType,
  PassportStatus,
  PlatformRole,
  ProfileVisibility,
  VisaCoverageType,
  VisaEntries,
  VisaType,
} from '@chamuco/shared-types';
import { UsersTravelDocsController } from './users-travel-docs.controller';
import { UsersTravelDocsService } from './users-travel-docs.service';
import type { AuthenticatedUser } from '@/types/express';
import type {
  CreateNationalityDto,
  NationalityResponseDto,
  UpdateNationalityDto,
} from './dto/nationality.dto';
import type { CreateVisaDto, UpdateVisaDto, VisaResponseDto } from './dto/visa.dto';
import type { CreateEtaDto, EtaResponseDto, UpdateEtaDto } from './dto/eta.dto';

const NOW = new Date('2026-01-01T00:00:00.000Z');

const mockAuthUser: AuthenticatedUser = {
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
};

const mockNationality: NationalityResponseDto = {
  id: 'nat-uuid',
  countryCode: 'CO',
  isPrimary: true,
  nationalIdNumber: null,
  passportNumber: null,
  passportIssueDate: null,
  passportExpiryDate: null,
  passportStatus: PassportStatus.OMITTED,
};

const mockVisa: VisaResponseDto = {
  id: 'visa-uuid',
  nationalityId: 'nat-uuid',
  coverageType: VisaCoverageType.COUNTRY,
  countryCode: 'US',
  visaZone: null,
  visaType: VisaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
  visaStatus: DocumentStatus.ACTIVE,
  notes: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

const mockEta: EtaResponseDto = {
  id: 'eta-uuid',
  userNationalityId: 'nat-uuid',
  passportNumber: 'AB123456',
  destinationCountry: 'CA',
  authorizationNumber: 'A1B2C3D4E5',
  etaType: EtaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
  etaStatus: DocumentStatus.ACTIVE,
  notes: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

describe('UsersTravelDocsController', () => {
  let controller: UsersTravelDocsController;
  let mockGetNationalities: jest.Mock;
  let mockAddNationality: jest.Mock;
  let mockUpdateNationality: jest.Mock;
  let mockDeleteNationality: jest.Mock;
  let mockGetVisas: jest.Mock;
  let mockAddVisa: jest.Mock;
  let mockUpdateVisa: jest.Mock;
  let mockDeleteVisa: jest.Mock;
  let mockGetEtas: jest.Mock;
  let mockAddEta: jest.Mock;
  let mockUpdateEta: jest.Mock;
  let mockDeleteEta: jest.Mock;

  beforeEach(async () => {
    mockGetNationalities = jest.fn().mockResolvedValue([mockNationality]);
    mockAddNationality = jest.fn().mockResolvedValue(mockNationality);
    mockUpdateNationality = jest.fn().mockResolvedValue(mockNationality);
    mockDeleteNationality = jest.fn().mockResolvedValue(undefined);
    mockGetVisas = jest.fn().mockResolvedValue([mockVisa]);
    mockAddVisa = jest.fn().mockResolvedValue(mockVisa);
    mockUpdateVisa = jest.fn().mockResolvedValue(mockVisa);
    mockDeleteVisa = jest.fn().mockResolvedValue(undefined);
    mockGetEtas = jest.fn().mockResolvedValue([mockEta]);
    mockAddEta = jest.fn().mockResolvedValue(mockEta);
    mockUpdateEta = jest.fn().mockResolvedValue(mockEta);
    mockDeleteEta = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersTravelDocsController],
      providers: [
        {
          provide: UsersTravelDocsService,
          useValue: {
            getNationalities: mockGetNationalities,
            addNationality: mockAddNationality,
            updateNationality: mockUpdateNationality,
            deleteNationality: mockDeleteNationality,
            getVisas: mockGetVisas,
            addVisa: mockAddVisa,
            updateVisa: mockUpdateVisa,
            deleteVisa: mockDeleteVisa,
            getEtas: mockGetEtas,
            addEta: mockAddEta,
            updateEta: mockUpdateEta,
            deleteEta: mockDeleteEta,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersTravelDocsController>(UsersTravelDocsController);
  });

  // ---------------------------------------------------------------------------
  // Nationalities
  // ---------------------------------------------------------------------------

  describe('GET /v1/users/me/nationalities', () => {
    it('delegates to service and returns the nationalities array', async () => {
      const result = await controller.getNationalities(mockAuthUser);

      expect(mockGetNationalities).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockNationality]);
    });
  });

  describe('POST /v1/users/me/nationalities', () => {
    it('delegates to service and returns the new nationality', async () => {
      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: true };
      const result = await controller.addNationality(mockAuthUser, dto);

      expect(mockAddNationality).toHaveBeenCalledWith(mockAuthUser.id, dto);
      expect(result).toEqual(mockNationality);
    });
  });

  describe('PATCH /v1/users/me/nationalities/:nationalityId', () => {
    it('delegates to service and returns the updated nationality', async () => {
      const dto: UpdateNationalityDto = { nationalIdNumber: '12345678' };
      const result = await controller.updateNationality(mockAuthUser, 'nat-uuid', dto);

      expect(mockUpdateNationality).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(mockNationality);
    });
  });

  describe('DELETE /v1/users/me/nationalities/:nationalityId', () => {
    it('delegates to service and returns undefined', async () => {
      const result = await controller.deleteNationality(mockAuthUser, 'nat-uuid');

      expect(mockDeleteNationality).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Visas
  // ---------------------------------------------------------------------------

  describe('GET /v1/users/me/nationalities/:nationalityId/visas', () => {
    it('delegates to service and returns the visas array', async () => {
      const result = await controller.getVisas(mockAuthUser, 'nat-uuid');

      expect(mockGetVisas).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
      expect(result).toEqual([mockVisa]);
    });
  });

  describe('POST /v1/users/me/nationalities/:nationalityId/visas', () => {
    it('delegates to service and returns the new visa', async () => {
      const dto: CreateVisaDto = {
        coverageType: VisaCoverageType.COUNTRY,
        countryCode: 'US',
        visaType: VisaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };
      const result = await controller.addVisa(mockAuthUser, 'nat-uuid', dto);

      expect(mockAddVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(mockVisa);
    });
  });

  describe('PATCH /v1/users/me/nationalities/:nationalityId/visas/:visaId', () => {
    it('delegates to service and returns the updated visa', async () => {
      const dto: UpdateVisaDto = { visaType: VisaType.BUSINESS };
      const result = await controller.updateVisa(mockAuthUser, 'nat-uuid', 'visa-uuid', dto);

      expect(mockUpdateVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'visa-uuid', dto);
      expect(result).toEqual(mockVisa);
    });
  });

  describe('DELETE /v1/users/me/nationalities/:nationalityId/visas/:visaId', () => {
    it('delegates to service and returns undefined', async () => {
      const result = await controller.deleteVisa(mockAuthUser, 'nat-uuid', 'visa-uuid');

      expect(mockDeleteVisa).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'visa-uuid');
      expect(result).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // ETAs
  // ---------------------------------------------------------------------------

  describe('GET /v1/users/me/nationalities/:nationalityId/etas', () => {
    it('delegates to service and returns the ETAs array', async () => {
      const result = await controller.getEtas(mockAuthUser, 'nat-uuid');

      expect(mockGetEtas).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid');
      expect(result).toEqual([mockEta]);
    });
  });

  describe('POST /v1/users/me/nationalities/:nationalityId/etas', () => {
    it('delegates to service and returns the new ETA', async () => {
      const dto: CreateEtaDto = {
        destinationCountry: 'CA',
        authorizationNumber: 'A1B2C3D4E5',
        etaType: EtaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };
      const result = await controller.addEta(mockAuthUser, 'nat-uuid', dto);

      expect(mockAddEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', dto);
      expect(result).toEqual(mockEta);
    });
  });

  describe('PATCH /v1/users/me/nationalities/:nationalityId/etas/:etaId', () => {
    it('delegates to service and returns the updated ETA', async () => {
      const dto: UpdateEtaDto = { etaType: EtaType.TRANSIT };
      const result = await controller.updateEta(mockAuthUser, 'nat-uuid', 'eta-uuid', dto);

      expect(mockUpdateEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'eta-uuid', dto);
      expect(result).toEqual(mockEta);
    });
  });

  describe('DELETE /v1/users/me/nationalities/:nationalityId/etas/:etaId', () => {
    it('delegates to service and returns undefined', async () => {
      const result = await controller.deleteEta(mockAuthUser, 'nat-uuid', 'eta-uuid');

      expect(mockDeleteEta).toHaveBeenCalledWith(mockAuthUser.id, 'nat-uuid', 'eta-uuid');
      expect(result).toBeUndefined();
    });
  });
});
