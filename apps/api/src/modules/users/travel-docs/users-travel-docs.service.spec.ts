import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  DocumentStatus,
  EtaType,
  PassportStatus,
  VisaCoverageType,
  VisaEntries,
  VisaType,
} from '@chamuco/shared-types';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersTravelDocsService } from './users-travel-docs.service';
import type { CreateNationalityDto, UpdateNationalityDto } from './dto/nationality.dto';

const mockNationalityRow = {
  id: 'nat-uuid',
  userId: 'user-uuid',
  countryCode: 'CO',
  isPrimary: false,
  nationalIdNumber: null,
  passportNumber: null,
  passportIssueDate: null,
  passportExpiryDate: null,
  passportStatus: PassportStatus.OMITTED,
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockNationalityWithPassport = {
  ...mockNationalityRow,
  isPrimary: true,
  passportNumber: 'AB123456',
  passportIssueDate: '2020-01-01',
  passportExpiryDate: '2030-01-01',
  passportStatus: PassportStatus.ACTIVE,
};

const mockVisa = {
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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockEta = {
  id: 'eta-uuid',
  userNationalityId: 'nat-uuid',
  passportNumber: 'AB123456',
  destinationCountry: 'US',
  authorizationNumber: 'A1B2C3D4E5',
  etaType: EtaType.TOURIST,
  entries: VisaEntries.MULTIPLE,
  expiryDate: '2027-12-31',
  etaStatus: DocumentStatus.ACTIVE,
  notes: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('UsersTravelDocsService', () => {
  let service: UsersTravelDocsService;
  let mockNationalitiesFindFirst: jest.Mock;
  let mockNationalitiesFindMany: jest.Mock;
  let mockVisasFindFirst: jest.Mock;
  let mockVisasFindMany: jest.Mock;
  let mockEtasFindFirst: jest.Mock;
  let mockEtasFindMany: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;
  let mockInsertReturning: jest.Mock;
  let mockInsertValues: jest.Mock;
  let mockDeleteWhere: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(async () => {
    mockNationalitiesFindFirst = jest.fn();
    mockNationalitiesFindMany = jest.fn();
    mockVisasFindFirst = jest.fn();
    mockVisasFindMany = jest.fn();
    mockEtasFindFirst = jest.fn();
    mockEtasFindMany = jest.fn();
    mockReturning = jest.fn();
    mockInsertReturning = jest.fn();
    mockDeleteWhere = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });
    mockInsertValues = jest.fn().mockReturnValue({ returning: mockInsertReturning });
    const mockInsert = jest.fn().mockReturnValue({ values: mockInsertValues });
    const mockDelete = jest.fn().mockReturnValue({ where: mockDeleteWhere });

    mockTransaction = jest
      .fn()
      .mockImplementation(async (callback: (trx: unknown) => Promise<unknown>) =>
        callback({ update: mockUpdate, insert: mockInsert, delete: mockDelete }),
      );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersTravelDocsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              userNationalities: {
                findFirst: mockNationalitiesFindFirst,
                findMany: mockNationalitiesFindMany,
              },
              userVisas: {
                findFirst: mockVisasFindFirst,
                findMany: mockVisasFindMany,
              },
              userEtas: {
                findFirst: mockEtasFindFirst,
                findMany: mockEtasFindMany,
              },
            },
            update: mockUpdate,
            insert: mockInsert,
            delete: mockDelete,
            transaction: mockTransaction,
          },
        },
      ],
    }).compile();

    service = module.get<UsersTravelDocsService>(UsersTravelDocsService);
  });

  // ---------------------------------------------------------------------------
  // Nationalities
  // ---------------------------------------------------------------------------

  describe('getNationalities', () => {
    it('returns mapped nationalities array', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationalityRow]);

      const result = await service.getNationalities('user-uuid');

      expect(result).toEqual([
        {
          id: mockNationalityRow.id,
          countryCode: mockNationalityRow.countryCode,
          isPrimary: mockNationalityRow.isPrimary,
          nationalIdNumber: null,
          passportNumber: null,
          passportIssueDate: null,
          passportExpiryDate: null,
          passportStatus: PassportStatus.OMITTED,
        },
      ]);
    });

    it('returns empty array when user has no nationalities', async () => {
      mockNationalitiesFindMany.mockResolvedValue([]);

      const result = await service.getNationalities('user-uuid');

      expect(result).toEqual([]);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockNationalitiesFindMany.mockRejectedValue(dbError);

      await expect(service.getNationalities('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('addNationality', () => {
    it('inserts and returns the new nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([mockNationalityRow]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      const result = await service.addNationality('user-uuid', dto);

      expect(result).toEqual(expect.objectContaining({ countryCode: 'CO', isPrimary: false }));
      expect(mockInsertReturning).toHaveBeenCalledTimes(1);
    });

    it('demotes current primary when isPrimary is true', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([{ ...mockNationalityRow, isPrimary: true }]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: true };
      await service.addNationality('user-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith({ isPrimary: false });
    });

    it('does not call demote update when isPrimary is false', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([mockNationalityRow]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await service.addNationality('user-uuid', dto);

      expect(mockSet).not.toHaveBeenCalled();
    });

    it('throws ConflictException on duplicate countryCode', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(ConflictException);
    });

    it('computes passportStatus ACTIVE for a far-future expiry date', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationalityRow,
          passportExpiryDate: '2035-01-15',
          passportStatus: PassportStatus.ACTIVE,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: '2035-01-15',
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.ACTIVE);
    });

    it('computes passportStatus EXPIRED for a past expiry date', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationalityRow,
          passportExpiryDate: '2000-01-01',
          passportStatus: PassportStatus.EXPIRED,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '1995-01-01',
        passportExpiryDate: '2000-01-01',
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.EXPIRED);
    });

    it('computes passportStatus EXPIRING_SOON for an expiry within 6 months', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      const soonExpiry = new Date();
      soonExpiry.setUTCMonth(soonExpiry.getUTCMonth() + 2);
      const expiryStr = soonExpiry.toISOString().slice(0, 10);
      mockInsertReturning.mockResolvedValue([
        {
          ...mockNationalityRow,
          passportExpiryDate: expiryStr,
          passportStatus: PassportStatus.EXPIRING_SOON,
        },
      ]);

      const dto: CreateNationalityDto = {
        countryCode: 'CO',
        isPrimary: false,
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: expiryStr,
      };
      const result = await service.addNationality('user-uuid', dto);

      expect(result.passportStatus).toBe(PassportStatus.EXPIRING_SOON);
    });

    it('throws NotFoundException when the insert returns an empty array', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      mockInsertReturning.mockResolvedValue([]);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);
      const dbError = new Error('insert failed');
      mockInsertReturning.mockRejectedValue(dbError);

      const dto: CreateNationalityDto = { countryCode: 'CO', isPrimary: false };
      await expect(service.addNationality('user-uuid', dto)).rejects.toThrow(dbError);
    });
  });

  describe('updateNationality', () => {
    it('updates fields and returns updated nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      const updated = { ...mockNationalityRow, nationalIdNumber: '12345678' };
      mockReturning.mockResolvedValue([updated]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345678' };
      const result = await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(result.nationalIdNumber).toBe('12345678');
    });

    it('returns existing record without a DB write when dto is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);

      const result = await service.updateNationality('user-uuid', 'nat-uuid', {});

      expect(mockSet).not.toHaveBeenCalled();
      expect(result.countryCode).toBe(mockNationalityRow.countryCode);
    });

    it('demotes other nationalities when isPrimary is true', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      mockReturning.mockResolvedValue([{ ...mockNationalityRow, isPrimary: true }]);

      const dto: UpdateNationalityDto = { isPrimary: true };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenNthCalledWith(1, { isPrimary: false });
    });

    it('runs isPrimary demotion and target update inside a transaction', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      mockReturning.mockResolvedValue([{ ...mockNationalityRow, isPrimary: true }]);

      const dto: UpdateNationalityDto = { isPrimary: true };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });

    it('does not demote when isPrimary is not in dto', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      mockReturning.mockResolvedValue([mockNationalityRow]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledTimes(1);
      expect(mockSet).not.toHaveBeenCalledWith({ isPrimary: false });
    });

    it('throws BadRequestException when isPrimary is false', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);

      const dto: UpdateNationalityDto = { isPrimary: false };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws NotFoundException when nationality does not exist', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('recomputes passportStatus when passport fields are in the dto', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      mockReturning.mockResolvedValue([
        { ...mockNationalityRow, passportStatus: PassportStatus.ACTIVE },
      ]);

      const dto: UpdateNationalityDto = {
        passportNumber: 'AB123456',
        passportIssueDate: '2020-01-15',
        passportExpiryDate: '2035-01-15',
      };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ passportStatus: PassportStatus.ACTIVE }),
      );
    });

    it('preserves existing passportStatus when no passport fields are in the dto', async () => {
      const withActiveStatus = { ...mockNationalityRow, passportStatus: PassportStatus.ACTIVE };
      mockNationalitiesFindFirst.mockResolvedValue(withActiveStatus);
      mockReturning.mockResolvedValue([withActiveStatus]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await service.updateNationality('user-uuid', 'nat-uuid', dto);

      expect(mockSet).toHaveBeenCalledWith(
        expect.not.objectContaining({ passportStatus: expect.anything() }),
      );
    });

    it('throws NotFoundException when the update returns an empty array', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      mockReturning.mockResolvedValue([]);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityRow);
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      const dto: UpdateNationalityDto = { nationalIdNumber: '12345' };
      await expect(service.updateNationality('user-uuid', 'nat-uuid', dto)).rejects.toThrow(
        dbError,
      );
    });
  });

  describe('deleteNationality', () => {
    const primaryNationality = { ...mockNationalityRow, id: 'nat-primary-uuid', isPrimary: true };

    it('deletes the nationality successfully', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationalityRow]);

      await service.deleteNationality('user-uuid', 'nat-uuid');

      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when deleting the primary with other nationalities remaining', async () => {
      mockNationalitiesFindMany.mockResolvedValue([primaryNationality, mockNationalityRow]);

      await expect(service.deleteNationality('user-uuid', 'nat-primary-uuid')).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows deleting the primary when it is the only nationality', async () => {
      mockNationalitiesFindMany.mockResolvedValue([primaryNationality]);

      await service.deleteNationality('user-uuid', 'nat-primary-uuid');

      expect(mockDeleteWhere).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when nationality does not exist', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationalityRow]);

      await expect(service.deleteNationality('user-uuid', 'nonexistent-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockNationalitiesFindMany.mockResolvedValue([mockNationalityRow]);
      const dbError = new Error('delete failed');
      mockDeleteWhere.mockRejectedValue(dbError);

      await expect(service.deleteNationality('user-uuid', 'nat-uuid')).rejects.toThrow(dbError);
    });
  });

  // ---------------------------------------------------------------------------
  // updateNationality — ETA invalidation on passport change
  // ---------------------------------------------------------------------------

  describe('updateNationality — ETA invalidation on passport change', () => {
    it('expires ETAs synchronously when passportNumber changes', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockReturning.mockResolvedValue([mockNationalityWithPassport]);

      await service.updateNationality('user-uuid', 'nat-uuid', {
        passportNumber: 'ZZ999999',
        passportIssueDate: '2024-01-01',
        passportExpiryDate: '2034-01-01',
      });

      // mockSet called twice: once for ETA expiry, once for the nationality update
      expect(mockSet).toHaveBeenCalledTimes(2);
      const [firstCall] = mockSet.mock.calls;
      expect(firstCall![0]).toMatchObject({ etaStatus: DocumentStatus.EXPIRED });
    });

    it('does not expire ETAs when passportNumber is unchanged', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockReturning.mockResolvedValue([mockNationalityWithPassport]);

      await service.updateNationality('user-uuid', 'nat-uuid', {
        passportNumber: 'AB123456', // same as existing
        passportIssueDate: '2020-01-01',
        passportExpiryDate: '2030-06-01',
      });

      // only one update call: the nationality update itself
      expect(mockSet).toHaveBeenCalledTimes(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Visas
  // ---------------------------------------------------------------------------

  describe('getVisas', () => {
    it('returns mapped visas for a valid nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindMany.mockResolvedValue([mockVisa]);

      const result = await service.getVisas('user-uuid', 'nat-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('visa-uuid');
      expect(result[0]!.visaStatus).toBe(DocumentStatus.ACTIVE);
    });

    it('throws NotFoundException when nationality not found or not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(service.getVisas('user-uuid', 'other-nat')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addVisa', () => {
    it('inserts a visa and returns the mapped response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockInsertReturning.mockResolvedValue([mockVisa]);

      const dto = {
        coverageType: VisaCoverageType.COUNTRY,
        countryCode: 'US',
        visaType: VisaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await service.addVisa('user-uuid', 'nat-uuid', dto);

      expect(result.id).toBe('visa-uuid');
      expect(result.nationalityId).toBe('nat-uuid');
    });

    it('throws NotFoundException when nationality not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(
        service.addVisa('user-uuid', 'other-nat', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when passport status is OMITTED', async () => {
      mockNationalitiesFindFirst.mockResolvedValue({
        ...mockNationalityWithPassport,
        passportStatus: PassportStatus.OMITTED,
        passportNumber: null,
        passportIssueDate: null,
        passportExpiryDate: null,
      });

      await expect(
        service.addVisa('user-uuid', 'nat-uuid', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when both countryCode and visaZone are provided', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);

      await expect(
        service.addVisa('user-uuid', 'nat-uuid', {
          coverageType: VisaCoverageType.COUNTRY,
          countryCode: 'US',
          visaZone: 'SCHENGEN' as import('@chamuco/shared-types').VisaZone,
          visaType: VisaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateVisa', () => {
    it('updates visa fields and returns the response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindFirst.mockResolvedValue(mockVisa);
      const updated = { ...mockVisa, visaType: VisaType.BUSINESS };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateVisa('user-uuid', 'nat-uuid', 'visa-uuid', {
        visaType: VisaType.BUSINESS,
      });

      expect(result.visaType).toBe(VisaType.BUSINESS);
    });

    it('returns unchanged visa when patch is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindFirst.mockResolvedValue(mockVisa);

      const result = await service.updateVisa('user-uuid', 'nat-uuid', 'visa-uuid', {});

      expect(result.id).toBe('visa-uuid');
    });

    it('throws NotFoundException when visa not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateVisa('user-uuid', 'nat-uuid', 'bad-id', { visaType: VisaType.BUSINESS }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteVisa', () => {
    it('deletes the visa when found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindFirst.mockResolvedValue(mockVisa);
      mockDeleteWhere.mockResolvedValue(undefined);

      await expect(
        service.deleteVisa('user-uuid', 'nat-uuid', 'visa-uuid'),
      ).resolves.toBeUndefined();
    });

    it('throws NotFoundException when visa not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockVisasFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteVisa('user-uuid', 'nat-uuid', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // ETAs
  // ---------------------------------------------------------------------------

  describe('getEtas', () => {
    it('returns mapped ETAs for a valid nationality', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindMany.mockResolvedValue([mockEta]);

      const result = await service.getEtas('user-uuid', 'nat-uuid');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('eta-uuid');
      expect(result[0]!.etaStatus).toBe(DocumentStatus.ACTIVE);
    });

    it('throws NotFoundException when nationality not found or not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(service.getEtas('user-uuid', 'other-nat')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addEta', () => {
    it('inserts an ETA and returns the mapped response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockInsertReturning.mockResolvedValue([mockEta]);

      const dto = {
        destinationCountry: 'US',
        authorizationNumber: 'A1B2C3D4E5',
        etaType: EtaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      };

      const result = await service.addEta('user-uuid', 'nat-uuid', dto);

      expect(result.id).toBe('eta-uuid');
      expect(result.userNationalityId).toBe('nat-uuid');
    });

    it('snapshots passport number from the nationality record, not from the dto', async () => {
      mockNationalitiesFindFirst.mockResolvedValue({
        ...mockNationalityWithPassport,
        passportNumber: 'ZZ999999',
      });
      mockInsertReturning.mockResolvedValue([mockEta]);

      await service.addEta('user-uuid', 'nat-uuid', {
        destinationCountry: 'US',
        authorizationNumber: 'A1B2C3D4E5',
        etaType: EtaType.TOURIST,
        entries: VisaEntries.MULTIPLE,
        expiryDate: '2027-12-31',
      });

      expect(mockInsertValues).toHaveBeenCalledWith(
        expect.objectContaining({ passportNumber: 'ZZ999999' }),
      );
    });

    it('throws NotFoundException when nationality not owned', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(undefined);

      await expect(
        service.addEta('user-uuid', 'other-nat', {
          destinationCountry: 'US',
          authorizationNumber: 'A1B2C3D4E5',
          etaType: EtaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when passport status is OMITTED', async () => {
      mockNationalitiesFindFirst.mockResolvedValue({
        ...mockNationalityWithPassport,
        passportStatus: PassportStatus.OMITTED,
        passportNumber: null,
        passportIssueDate: null,
        passportExpiryDate: null,
      });

      await expect(
        service.addEta('user-uuid', 'nat-uuid', {
          destinationCountry: 'US',
          authorizationNumber: 'A1B2C3D4E5',
          etaType: EtaType.TOURIST,
          entries: VisaEntries.MULTIPLE,
          expiryDate: '2027-12-31',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateEta', () => {
    it('updates ETA fields and returns the response', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindFirst.mockResolvedValue(mockEta);
      const updated = { ...mockEta, etaType: EtaType.TRANSIT };
      mockReturning.mockResolvedValue([updated]);

      const result = await service.updateEta('user-uuid', 'nat-uuid', 'eta-uuid', {
        etaType: EtaType.TRANSIT,
      });

      expect(result.etaType).toBe(EtaType.TRANSIT);
    });

    it('returns unchanged ETA when patch is empty', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindFirst.mockResolvedValue(mockEta);

      const result = await service.updateEta('user-uuid', 'nat-uuid', 'eta-uuid', {});

      expect(result.id).toBe('eta-uuid');
    });

    it('throws NotFoundException when ETA not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateEta('user-uuid', 'nat-uuid', 'bad-id', { etaType: EtaType.TRANSIT }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteEta', () => {
    it('deletes the ETA when found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindFirst.mockResolvedValue(mockEta);
      mockDeleteWhere.mockResolvedValue(undefined);

      await expect(service.deleteEta('user-uuid', 'nat-uuid', 'eta-uuid')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when ETA not found', async () => {
      mockNationalitiesFindFirst.mockResolvedValue(mockNationalityWithPassport);
      mockEtasFindFirst.mockResolvedValue(undefined);

      await expect(service.deleteEta('user-uuid', 'nat-uuid', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
