import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { UsersEmergencyContactsController } from './users-emergency-contacts.controller';
import { UsersEmergencyContactsService } from './users-emergency-contacts.service';
import type { AuthenticatedUser } from '@/types/express';
import type { EmergencyContactDto, UpdateEmergencyContactDto } from './dto/emergency-contact.dto';

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

const mockContact: EmergencyContactDto = {
  id: 'contact-uuid',
  fullName: 'María López',
  phoneCountryCode: '+57',
  phoneLocalNumber: '3001234567',
  relationship: 'mother',
  isPrimary: true,
};

describe('UsersEmergencyContactsController', () => {
  let controller: UsersEmergencyContactsController;
  let mockGetEmergencyContacts: jest.Mock;
  let mockAddEmergencyContact: jest.Mock;
  let mockUpdateEmergencyContact: jest.Mock;
  let mockDeleteEmergencyContact: jest.Mock;

  beforeEach(async () => {
    mockGetEmergencyContacts = jest.fn().mockResolvedValue([mockContact]);
    mockAddEmergencyContact = jest.fn().mockResolvedValue(mockContact);
    mockUpdateEmergencyContact = jest.fn().mockResolvedValue(mockContact);
    mockDeleteEmergencyContact = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersEmergencyContactsController],
      providers: [
        {
          provide: UsersEmergencyContactsService,
          useValue: {
            getEmergencyContacts: mockGetEmergencyContacts,
            addEmergencyContact: mockAddEmergencyContact,
            updateEmergencyContact: mockUpdateEmergencyContact,
            deleteEmergencyContact: mockDeleteEmergencyContact,
          },
        },
      ],
    }).compile();

    controller = module.get<UsersEmergencyContactsController>(UsersEmergencyContactsController);
  });

  describe('GET /v1/users/me/emergency-contacts', () => {
    it('delegates to service and returns the contacts array', async () => {
      const result = await controller.getEmergencyContacts(mockAuthUser);

      expect(mockGetEmergencyContacts).toHaveBeenCalledWith(mockAuthUser.id);
      expect(result).toEqual([mockContact]);
    });
  });

  describe('POST /v1/users/me/emergency-contacts', () => {
    it('delegates to service and returns the new contact', async () => {
      const result = await controller.addEmergencyContact(mockAuthUser, mockContact);

      expect(mockAddEmergencyContact).toHaveBeenCalledWith(mockAuthUser.id, mockContact);
      expect(result).toEqual(mockContact);
    });
  });

  describe('PATCH /v1/users/me/emergency-contacts/:contactId', () => {
    it('delegates to service with userId and contactId and returns the updated contact', async () => {
      const dto: UpdateEmergencyContactDto = { fullName: 'New Name' };
      const result = await controller.updateEmergencyContact(mockAuthUser, 'contact-uuid', dto);

      expect(mockUpdateEmergencyContact).toHaveBeenCalledWith(mockAuthUser.id, 'contact-uuid', dto);
      expect(result).toEqual(mockContact);
    });
  });

  describe('DELETE /v1/users/me/emergency-contacts/:contactId', () => {
    it('delegates to service and returns undefined', async () => {
      const result = await controller.deleteEmergencyContact(mockAuthUser, 'contact-uuid');

      expect(mockDeleteEmergencyContact).toHaveBeenCalledWith(mockAuthUser.id, 'contact-uuid');
      expect(result).toBeUndefined();
    });
  });
});
