import { Test, TestingModule } from '@nestjs/testing';
import { AuthProvider, PlatformRole, ProfileVisibility } from '@chamuco/shared-types';
import { TripsGroupsController } from './trips-groups.controller';
import { TripsGroupsService } from './trips-groups.service';
import type { TripGroupResponseDto } from './dto/trip-group-response.dto';
import type { AuthenticatedUser } from '@/types/express';

const mockUser: AuthenticatedUser = {
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
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  lastActiveAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockGroupTripResponse: TripGroupResponseDto = {
  tripId: 'trip-uuid',
  groupId: 'group-uuid',
  addedAt: '2026-01-01T00:00:00.000Z',
};

describe('TripsGroupsController', () => {
  let controller: TripsGroupsController;
  let mockListTripGroups: jest.Mock;
  let mockAddTripGroup: jest.Mock;
  let mockRemoveTripGroup: jest.Mock;

  beforeEach(async () => {
    mockListTripGroups = jest.fn().mockResolvedValue([mockGroupTripResponse]);
    mockAddTripGroup = jest.fn().mockResolvedValue(mockGroupTripResponse);
    mockRemoveTripGroup = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsGroupsController],
      providers: [
        {
          provide: TripsGroupsService,
          useValue: {
            listTripGroups: mockListTripGroups,
            addTripGroup: mockAddTripGroup,
            removeTripGroup: mockRemoveTripGroup,
          },
        },
      ],
    }).compile();

    controller = module.get<TripsGroupsController>(TripsGroupsController);
  });

  it('listTripGroups delegates to service', async () => {
    const result = await controller.listTripGroups(mockUser, 'trip-uuid');

    expect(mockListTripGroups).toHaveBeenCalledWith(mockUser, 'trip-uuid');
    expect(result).toEqual([mockGroupTripResponse]);
  });

  it('addTripGroup delegates to service', async () => {
    const dto = { groupId: 'group-uuid' };

    const result = await controller.addTripGroup(mockUser, 'trip-uuid', dto);

    expect(mockAddTripGroup).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockGroupTripResponse);
  });

  it('removeTripGroup delegates to service', async () => {
    await controller.removeTripGroup(mockUser, 'trip-uuid', 'group-uuid');

    expect(mockRemoveTripGroup).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'group-uuid');
  });
});
