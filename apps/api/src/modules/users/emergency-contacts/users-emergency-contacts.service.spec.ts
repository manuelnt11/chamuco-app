import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DRIZZLE_CLIENT } from '@/database/drizzle.provider';
import { UsersEmergencyContactsService } from './users-emergency-contacts.service';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';

const mockEmptyProfile = {
  userId: 'user-uuid',
  emergencyContacts: [],
};

describe('UsersEmergencyContactsService', () => {
  let service: UsersEmergencyContactsService;
  let mockProfileFindFirst: jest.Mock;
  let mockReturning: jest.Mock;
  let mockSet: jest.Mock;

  beforeEach(async () => {
    mockProfileFindFirst = jest.fn();
    mockReturning = jest.fn();

    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    const mockUpdate = jest.fn().mockReturnValue({ set: mockSet });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersEmergencyContactsService,
        {
          provide: DRIZZLE_CLIENT,
          useValue: {
            query: {
              userProfiles: { findFirst: mockProfileFindFirst },
            },
            update: mockUpdate,
          },
        },
      ],
    }).compile();

    service = module.get<UsersEmergencyContactsService>(UsersEmergencyContactsService);
  });

  describe('getEmergencyContacts', () => {
    const contact: EmergencyContactDto = {
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: true,
    };

    it('returns the contacts array when found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contact],
      });

      const result = await service.getEmergencyContacts('user-uuid');

      expect(result).toEqual([contact]);
    });

    it('returns an empty array when emergencyContacts is empty', async () => {
      mockProfileFindFirst.mockResolvedValue(mockEmptyProfile);

      const result = await service.getEmergencyContacts('user-uuid');

      expect(result).toEqual([]);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.getEmergencyContacts('unknown-uuid')).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      mockProfileFindFirst.mockRejectedValue(dbError);

      await expect(service.getEmergencyContacts('user-uuid')).rejects.toThrow(dbError);
    });
  });

  describe('addEmergencyContact', () => {
    const existingPrimary: EmergencyContactDto = {
      id: 'existing-id-0001-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const newContact: EmergencyContactDto = {
      id: 'new-uuid-0000-0000-0000-000000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('appends the contact and returns it', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([
        { ...mockEmptyProfile, emergencyContacts: [existingPrimary, newContact] },
      ]);

      const result = await service.addEmergencyContact('user-uuid', newContact);

      expect(result).toEqual(newContact);
    });

    it('unsets the current primary when new contact has isPrimary: true', async () => {
      const primaryContact: EmergencyContactDto = { ...newContact, isPrimary: true };
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [existingPrimary],
      });
      const savedContacts = [{ ...existingPrimary, isPrimary: false }, primaryContact];
      mockReturning.mockResolvedValue([{ ...mockEmptyProfile, emergencyContacts: savedContacts }]);

      await service.addEmergencyContact('user-uuid', primaryContact);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: existingPrimary.id, isPrimary: false }),
          ]),
        }),
      );
    });

    it('does not touch existing primaries when isPrimary is false', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([
        { ...mockEmptyProfile, emergencyContacts: [existingPrimary, newContact] },
      ]);

      await service.addEmergencyContact('user-uuid', newContact);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: existingPrimary.id, isPrimary: true }),
          ]),
        }),
      );
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(service.addEmergencyContact('unknown-uuid', newContact)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the profile is deleted between check and insert', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [existingPrimary],
      });
      mockReturning.mockResolvedValue([]);

      await expect(service.addEmergencyContact('user-uuid', newContact)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [existingPrimary],
      });
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(service.addEmergencyContact('user-uuid', newContact)).rejects.toThrow(dbError);
    });
  });

  describe('updateEmergencyContact', () => {
    const contactA: EmergencyContactDto = {
      id: 'contact-a-0000-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const contactB: EmergencyContactDto = {
      id: 'contact-b-0000-0000-0000-000000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('updates the specified fields and returns the updated contact', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA, contactB],
      });
      const updated = { ...contactB, fullName: 'María González', relationship: 'sister' };
      mockReturning.mockResolvedValue([
        { ...mockEmptyProfile, emergencyContacts: [contactA, updated] },
      ]);

      const result = await service.updateEmergencyContact('user-uuid', contactB.id, {
        fullName: 'María González',
        relationship: 'sister',
      } as UpdateEmergencyContactDto);

      expect(result.fullName).toBe('María González');
      expect(result.relationship).toBe('sister');
    });

    it('unsets other primaries when isPrimary: true', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA, contactB],
      });
      const savedContacts = [
        { ...contactA, isPrimary: false },
        { ...contactB, isPrimary: true },
      ];
      mockReturning.mockResolvedValue([{ ...mockEmptyProfile, emergencyContacts: savedContacts }]);

      await service.updateEmergencyContact('user-uuid', contactB.id, { isPrimary: true });

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: expect.arrayContaining([
            expect.objectContaining({ id: contactA.id, isPrimary: false }),
            expect.objectContaining({ id: contactB.id, isPrimary: true }),
          ]),
        }),
      );
    });

    it('throws BadRequestException when isPrimary is explicitly set to false', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA, contactB],
      });

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { isPrimary: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException when contact id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA],
      });

      await expect(
        service.updateEmergencyContact('user-uuid', 'nonexistent-id', { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      mockProfileFindFirst.mockResolvedValue(undefined);

      await expect(
        service.updateEmergencyContact('unknown-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the profile is deleted between check and update', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA],
      });
      mockReturning.mockResolvedValue([]);

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [contactA],
      });
      const dbError = new Error('update failed');
      mockReturning.mockRejectedValue(dbError);

      await expect(
        service.updateEmergencyContact('user-uuid', contactA.id, { fullName: 'X' }),
      ).rejects.toThrow(dbError);
    });
  });

  describe('deleteEmergencyContact', () => {
    const primaryContact: EmergencyContactDto = {
      id: 'primary-id-0000-0000-0000-000000000001',
      fullName: 'Carlos Ruiz',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3109876543',
      relationship: 'father',
      isPrimary: true,
    };
    const secondaryContact: EmergencyContactDto = {
      id: 'secondary-id-0000-0000-0000-00000000002',
      fullName: 'María López',
      phoneCountryCode: '+57',
      phoneLocalNumber: '3001234567',
      relationship: 'mother',
      isPrimary: false,
    };

    it('deletes the contact and saves the remaining contacts', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });

      await service.deleteEmergencyContact('user-uuid', secondaryContact.id);

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          emergencyContacts: [primaryContact],
        }),
      );
    });

    it('throws ConflictException when deleting the primary with other contacts remaining', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });

      await expect(service.deleteEmergencyContact('user-uuid', primaryContact.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('allows deleting the primary when it is the only contact', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [primaryContact],
      });

      await service.deleteEmergencyContact('user-uuid', primaryContact.id);

      expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({ emergencyContacts: [] }));
    });

    it('throws NotFoundException when the contact id is not found', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [primaryContact],
      });

      await expect(service.deleteEmergencyContact('user-uuid', 'nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('propagates unexpected database errors', async () => {
      mockProfileFindFirst.mockResolvedValue({
        ...mockEmptyProfile,
        emergencyContacts: [primaryContact, secondaryContact],
      });
      const dbError = new Error('update failed');
      mockSet.mockReturnValue({ where: jest.fn().mockRejectedValue(dbError) });

      await expect(
        service.deleteEmergencyContact('user-uuid', secondaryContact.id),
      ).rejects.toThrow(dbError);
    });
  });
});
