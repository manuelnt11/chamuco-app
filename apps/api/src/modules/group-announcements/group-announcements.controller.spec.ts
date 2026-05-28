import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import type { AuthenticatedUser } from '@/types/express';
import { GroupAnnouncementsController } from './group-announcements.controller';
import { GroupAnnouncementsService } from './group-announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import type { AnnouncementResponseDto } from './dto/announcement-response.dto';
import { ListAnnouncementsQueryDto } from './dto/list-announcements-query.dto';

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({ bucket: jest.fn() })),
}));

const NOW = new Date('2026-01-01T00:00:00.000Z');
const GROUP_ID = 'group-uuid';
const ADMIN_ID = 'admin-uuid';
const ADMIN_USERNAME = 'admin-user';
const ANNOUNCEMENT_ID = 'announcement-uuid';

const mockAuthUser: AuthenticatedUser = {
  id: ADMIN_ID,
  username: ADMIN_USERNAME,
  displayName: 'Admin',
  avatar: null,
  authProvider: AuthProvider.GOOGLE,
  firebaseUid: 'firebase-uid',
  timezone: 'UTC',
  platformRole: PlatformRole.USER,
  profileVisibility: ProfileVisibility.PRIVATE,
  agencyId: null,
  createdAt: NOW,
  updatedAt: NOW,
  lastActiveAt: NOW,
};

const mockAnnouncementDto: AnnouncementResponseDto = {
  id: ANNOUNCEMENT_ID,
  groupId: GROUP_ID,
  createdByUsername: ADMIN_USERNAME,
  content: 'Trip departs Sunday at 6am.',
  createdAt: NOW,
};

let mockCreate: jest.Mock;
let mockFindAll: jest.Mock;

describe('GroupAnnouncementsController', () => {
  let controller: GroupAnnouncementsController;

  beforeEach(async () => {
    mockCreate = jest.fn().mockResolvedValue(mockAnnouncementDto);
    mockFindAll = jest.fn().mockResolvedValue({ items: [mockAnnouncementDto], total: 1 });

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupAnnouncementsController],
      providers: [
        {
          provide: GroupAnnouncementsService,
          useValue: { create: mockCreate, findAll: mockFindAll },
        },
      ],
    }).compile();

    controller = module.get<GroupAnnouncementsController>(GroupAnnouncementsController);
  });

  describe('create', () => {
    it('delegates to service and returns result', async () => {
      const dto: CreateAnnouncementDto = { content: 'Trip departs Sunday at 6am.' };

      const result = await controller.create(mockAuthUser, GROUP_ID, dto);

      expect(mockCreate).toHaveBeenCalledWith(GROUP_ID, ADMIN_ID, ADMIN_USERNAME, dto);
      expect(result).toEqual(mockAnnouncementDto);
    });
  });

  describe('findAll', () => {
    it('delegates to service and returns paginated result', async () => {
      const query = { limit: 20, offset: 0 };

      const result = await controller.findAll(mockAuthUser, GROUP_ID, query);

      expect(mockFindAll).toHaveBeenCalledWith(GROUP_ID, ADMIN_ID, query);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});

describe('ListAnnouncementsQueryDto defaults', () => {
  it('applies default limit and offset', () => {
    const dto = new ListAnnouncementsQueryDto();
    expect(dto.limit).toBe(20);
    expect(dto.offset).toBe(0);
  });
});

describe('CreateAnnouncementDto', () => {
  it('trims whitespace from content via @Transform', () => {
    const dto = plainToInstance(CreateAnnouncementDto, { content: '  Hello members!  ' });
    expect(dto.content).toBe('Hello members!');
  });

  it('leaves non-string values unchanged', () => {
    const dto = plainToInstance(CreateAnnouncementDto, { content: 42 });
    expect(dto.content).toBe(42);
  });

  it('rejects content containing HTML open tag', async () => {
    const dto = plainToInstance(CreateAnnouncementDto, {
      content: '<script>alert(1)</script>',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('rejects content containing HTML close tag', async () => {
    const dto = plainToInstance(CreateAnnouncementDto, { content: 'hello <b>world</b>' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('accepts clean markdown content without HTML', async () => {
    const dto = plainToInstance(CreateAnnouncementDto, {
      content: '**Bold** and _italic_ text with [a link](https://example.com)',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'content')).toHaveLength(0);
  });
});
