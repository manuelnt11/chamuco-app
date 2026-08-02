import { Test, TestingModule } from '@nestjs/testing';
import { TripTaskScope } from '@chamuco/shared-types';
import { TripsTasksController } from './trips-tasks.controller';
import { TripsTasksService } from './trips-tasks.service';
import type { CreateTripTaskDto } from './dto/create-trip-task.dto';
import type { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import type { SetTripTaskCompletionDto } from './dto/set-trip-task-completion.dto';
import type { TripTaskResponseDto } from './dto/trip-task-response.dto';
import { makeAuthenticatedUser } from '@/test/fixtures/user.fixture';

const mockUser = makeAuthenticatedUser();

const mockTaskResponse: TripTaskResponseDto = {
  id: 'task-uuid',
  tripId: 'trip-uuid',
  scope: TripTaskScope.PERSONAL,
  title: 'Pack sunscreen',
  completed: false,
  ownerId: mockUser.id,
  createdBy: mockUser.id,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('TripsTasksController', () => {
  let controller: TripsTasksController;
  let mockListTasks: jest.Mock;
  let mockCreateTask: jest.Mock;
  let mockUpdateTaskTitle: jest.Mock;
  let mockSetCompletion: jest.Mock;
  let mockDeleteTask: jest.Mock;

  beforeEach(async () => {
    mockListTasks = jest.fn().mockResolvedValue([mockTaskResponse]);
    mockCreateTask = jest.fn().mockResolvedValue(mockTaskResponse);
    mockUpdateTaskTitle = jest.fn().mockResolvedValue(mockTaskResponse);
    mockSetCompletion = jest.fn().mockResolvedValue({ ...mockTaskResponse, completed: true });
    mockDeleteTask = jest.fn().mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripsTasksController],
      providers: [
        {
          provide: TripsTasksService,
          useValue: {
            listTasks: mockListTasks,
            createTask: mockCreateTask,
            updateTaskTitle: mockUpdateTaskTitle,
            setCompletion: mockSetCompletion,
            deleteTask: mockDeleteTask,
          },
        },
      ],
    }).compile();

    controller = module.get<TripsTasksController>(TripsTasksController);
  });

  it('listTasks delegates to service', async () => {
    const result = await controller.listTasks(mockUser, 'trip-uuid');

    expect(mockListTasks).toHaveBeenCalledWith(mockUser, 'trip-uuid');
    expect(result).toEqual([mockTaskResponse]);
  });

  it('createTask delegates to service', async () => {
    const dto: CreateTripTaskDto = { scope: TripTaskScope.PERSONAL, title: 'Pack sunscreen' };

    const result = await controller.createTask(mockUser, 'trip-uuid', dto);

    expect(mockCreateTask).toHaveBeenCalledWith(mockUser, 'trip-uuid', dto);
    expect(result).toBe(mockTaskResponse);
  });

  it('updateTaskTitle delegates to service', async () => {
    const dto: UpdateTripTaskDto = { title: 'Pack reef-safe sunscreen' };

    const result = await controller.updateTaskTitle(mockUser, 'trip-uuid', 'task-uuid', dto);

    expect(mockUpdateTaskTitle).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'task-uuid', dto);
    expect(result).toBe(mockTaskResponse);
  });

  it('setCompletion delegates to service', async () => {
    const dto: SetTripTaskCompletionDto = { completed: true };

    const result = await controller.setCompletion(mockUser, 'trip-uuid', 'task-uuid', dto);

    expect(mockSetCompletion).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'task-uuid', dto);
    expect(result.completed).toBe(true);
  });

  it('deleteTask delegates to service', async () => {
    await controller.deleteTask(mockUser, 'trip-uuid', 'task-uuid');

    expect(mockDeleteTask).toHaveBeenCalledWith(mockUser, 'trip-uuid', 'task-uuid');
  });
});
