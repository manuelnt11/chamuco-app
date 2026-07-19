import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import type { AuthenticatedUser } from '@/types/express';
import { TripAnnouncementsController } from './trip-announcements.controller';
import { TripAnnouncementsService } from './trip-announcements.service';
import { CreateTripAnnouncementDto } from './dto/create-trip-announcement.dto';
import type { TripAnnouncementResponseDto } from './dto/trip-announcement-response.dto';
import { UpdateTripAnnouncementDto } from './dto/update-trip-announcement.dto';
import { ListTripAnnouncementsQueryDto } from './dto/list-trip-announcements-query.dto';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const TRIP_ID = 'trip-uuid';
const ORGANIZER_ID = 'organizer-uuid';
const ORGANIZER_USERNAME = 'organizer-user';
const ANNOUNCEMENT_ID = 'announcement-uuid';

const mockAuthUser: AuthenticatedUser = {
  id: ORGANIZER_ID,
  username: ORGANIZER_USERNAME,
  displayName: 'Organizer',
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

const mockAnnouncementDto: TripAnnouncementResponseDto = {
  id: ANNOUNCEMENT_ID,
  tripId: TRIP_ID,
  createdByUsername: ORGANIZER_USERNAME,
  content: 'Trip departs Sunday at 6am.',
  createdAt: NOW,
  updatedAt: NOW,
};

let mockCreate: jest.Mock;
let mockFindOne: jest.Mock;
let mockFindAll: jest.Mock;
let mockUpdate: jest.Mock;
let mockRemove: jest.Mock;

describe('TripAnnouncementsController', () => {
  let controller: TripAnnouncementsController;

  beforeEach(async () => {
    mockCreate = jest.fn().mockResolvedValue(mockAnnouncementDto);
    mockFindOne = jest.fn().mockResolvedValue(mockAnnouncementDto);
    mockFindAll = jest.fn().mockResolvedValue({ items: [mockAnnouncementDto], total: 1 });
    mockUpdate = jest.fn().mockResolvedValue(mockAnnouncementDto);
    mockRemove = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripAnnouncementsController],
      providers: [
        {
          provide: TripAnnouncementsService,
          useValue: {
            create: mockCreate,
            findOne: mockFindOne,
            findAll: mockFindAll,
            update: mockUpdate,
            remove: mockRemove,
          },
        },
      ],
    }).compile();

    controller = module.get<TripAnnouncementsController>(TripAnnouncementsController);
  });

  describe('create', () => {
    it('delegates to service and returns result', async () => {
      const dto: CreateTripAnnouncementDto = { content: 'Trip departs Sunday at 6am.' };

      const result = await controller.create(mockAuthUser, TRIP_ID, dto);

      expect(mockCreate).toHaveBeenCalledWith(TRIP_ID, ORGANIZER_ID, ORGANIZER_USERNAME, dto);
      expect(result).toEqual(mockAnnouncementDto);
    });
  });

  describe('findAll', () => {
    it('delegates to service and returns paginated result', async () => {
      const query = { limit: 20, offset: 0 };

      const result = await controller.findAll(mockAuthUser, TRIP_ID, query);

      expect(mockFindAll).toHaveBeenCalledWith(TRIP_ID, ORGANIZER_ID, query);
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('delegates to service and returns announcement', async () => {
      const result = await controller.findOne(mockAuthUser, TRIP_ID, ANNOUNCEMENT_ID);

      expect(mockFindOne).toHaveBeenCalledWith(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID);
      expect(result).toEqual(mockAnnouncementDto);
    });
  });

  describe('update', () => {
    it('delegates to service and returns updated announcement', async () => {
      const dto: UpdateTripAnnouncementDto = { content: 'Updated content.' };

      const result = await controller.update(mockAuthUser, TRIP_ID, ANNOUNCEMENT_ID, dto);

      expect(mockUpdate).toHaveBeenCalledWith(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID, dto);
      expect(result).toEqual(mockAnnouncementDto);
    });
  });

  describe('remove', () => {
    it('delegates to service', async () => {
      await controller.remove(mockAuthUser, TRIP_ID, ANNOUNCEMENT_ID);

      expect(mockRemove).toHaveBeenCalledWith(TRIP_ID, ANNOUNCEMENT_ID, ORGANIZER_ID);
    });
  });
});

describe('UpdateTripAnnouncementDto', () => {
  it('trims whitespace from content via @Transform', () => {
    const dto = plainToInstance(UpdateTripAnnouncementDto, { content: '  Updated!  ' });
    expect(dto.content).toBe('Updated!');
  });

  it('leaves non-string values unchanged', () => {
    const dto = plainToInstance(UpdateTripAnnouncementDto, { content: 42 });
    expect(dto.content).toBe(42);
  });

  it('rejects content containing HTML tags', async () => {
    const dto = plainToInstance(UpdateTripAnnouncementDto, { content: '<b>bold</b>' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('accepts valid markdown content', async () => {
    const dto = plainToInstance(UpdateTripAnnouncementDto, {
      content: '**Updated** announcement.',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'content')).toHaveLength(0);
  });
});

describe('ListTripAnnouncementsQueryDto defaults', () => {
  it('applies default limit and offset', () => {
    const dto = new ListTripAnnouncementsQueryDto();
    expect(dto.limit).toBe(20);
    expect(dto.offset).toBe(0);
  });
});

describe('CreateTripAnnouncementDto', () => {
  it('trims whitespace from content via @Transform', () => {
    const dto = plainToInstance(CreateTripAnnouncementDto, { content: '  Hello participants!  ' });
    expect(dto.content).toBe('Hello participants!');
  });

  it('leaves non-string values unchanged', () => {
    const dto = plainToInstance(CreateTripAnnouncementDto, { content: 42 });
    expect(dto.content).toBe(42);
  });

  it('rejects content containing HTML open tag', async () => {
    const dto = plainToInstance(CreateTripAnnouncementDto, {
      content: '<script>alert(1)</script>',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('rejects content containing HTML close tag', async () => {
    const dto = plainToInstance(CreateTripAnnouncementDto, { content: 'hello <b>world</b>' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('accepts clean markdown content without HTML', async () => {
    const dto = plainToInstance(CreateTripAnnouncementDto, {
      content: '**Bold** and _italic_ text with [a link](https://example.com)',
    });
    const errors = await validate(dto);
    expect(errors.filter((e) => e.property === 'content')).toHaveLength(0);
  });
});
