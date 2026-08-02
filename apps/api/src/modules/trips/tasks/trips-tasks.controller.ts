import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { TripsTasksService } from './trips-tasks.service';
import { CreateTripTaskDto } from './dto/create-trip-task.dto';
import { UpdateTripTaskDto } from './dto/update-trip-task.dto';
import { SetTripTaskCompletionDto } from './dto/set-trip-task-completion.dto';
import { TripTaskResponseDto } from './dto/trip-task-response.dto';

@ApiTags('trip-tasks')
@ApiBearerAuth()
@Controller('v1/trips')
export class TripsTasksController {
  constructor(private readonly tripsTasksService: TripsTasksService) {}

  @Get(':id/tasks')
  @ApiOperation({
    summary: 'List trip tasks',
    description:
      "Returns every SHARED task plus the requesting user's own PERSONAL tasks, " +
      'with completed resolved for that user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 200, type: [TripTaskResponseDto] })
  @ApiForbiddenResponse({ description: 'Not an active participant of this trip.' })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TripTaskResponseDto[]> {
    return this.tripsTasksService.listTasks(user, id);
  }

  @Post(':id/tasks')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a trip task',
    description:
      'SHARED requires ORGANIZER or CO_ORGANIZER. PERSONAL is created for the requesting user.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiResponse({ status: 201, type: TripTaskResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiForbiddenResponse({
    description:
      'Not an active participant, not an organizer for a SHARED task, or trip is COMPLETED/CANCELLED.',
  })
  @ApiNotFoundResponse({ description: 'Trip not found.' })
  async createTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    return this.tripsTasksService.createTask(user, id, dto);
  }

  @Patch(':id/tasks/:taskId')
  @ApiOperation({
    summary: 'Rename a trip task',
    description: 'SHARED: ORGANIZER/CO_ORGANIZER only. PERSONAL: owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'taskId', type: String, description: 'Trip task UUID' })
  @ApiResponse({ status: 200, type: TripTaskResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiForbiddenResponse({
    description: 'Not authorized to manage this task, or trip is COMPLETED/CANCELLED.',
  })
  @ApiNotFoundResponse({ description: 'Trip or task not found.' })
  async updateTaskTitle(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTripTaskDto,
  ): Promise<TripTaskResponseDto> {
    return this.tripsTasksService.updateTaskTitle(user, id, taskId, dto);
  }

  @Patch(':id/tasks/:taskId/completion')
  @ApiOperation({
    summary: 'Set a trip task completion state',
    description:
      'PERSONAL: owner only. SHARED: any active participant toggles only their own completion record.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'taskId', type: String, description: 'Trip task UUID' })
  @ApiResponse({ status: 200, type: TripTaskResponseDto })
  @ApiBadRequestResponse({ description: 'Validation error.' })
  @ApiForbiddenResponse({
    description: 'Not authorized to complete this task, or trip is COMPLETED/CANCELLED.',
  })
  @ApiNotFoundResponse({ description: 'Trip or task not found.' })
  async setCompletion(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: SetTripTaskCompletionDto,
  ): Promise<TripTaskResponseDto> {
    return this.tripsTasksService.setCompletion(user, id, taskId, dto);
  }

  @Delete(':id/tasks/:taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a trip task',
    description: 'SHARED: ORGANIZER/CO_ORGANIZER only. PERSONAL: owner only.',
  })
  @ApiParam({ name: 'id', type: String, description: 'Trip UUID' })
  @ApiParam({ name: 'taskId', type: String, description: 'Trip task UUID' })
  @ApiResponse({ status: 204, description: 'Trip task deleted.' })
  @ApiForbiddenResponse({
    description: 'Not authorized to manage this task, or trip is COMPLETED/CANCELLED.',
  })
  @ApiNotFoundResponse({ description: 'Trip or task not found.' })
  async deleteTask(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ): Promise<void> {
    return this.tripsTasksService.deleteTask(user, id, taskId);
  }
}
