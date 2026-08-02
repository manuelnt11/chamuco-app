import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { TripsController } from './trips.controller';
import { TripsDestinationsController } from './destinations/trips-destinations.controller';
import { TripsTasksController } from './tasks/trips-tasks.controller';
import { TripsGroupsController } from './groups/trips-groups.controller';
import { TripAnnouncementsController } from './announcements/trip-announcements.controller';
import { TripParticipantsController } from './participants/trip-participants.controller';
import { TripInvitationsController } from './invitations/trip-invitations.controller';
import { TripJoinRequestsController } from './join-requests/trip-join-requests.controller';
import { TripsService } from './trips.service';
import { TripsDestinationsService } from './destinations/trips-destinations.service';
import { TripsTasksService } from './tasks/trips-tasks.service';
import { TripsGroupsService } from './groups/trips-groups.service';
import { TripAnnouncementsService } from './announcements/trip-announcements.service';
import { TripParticipantsService } from './participants/trip-participants.service';
import { TripInvitationsService } from './invitations/trip-invitations.service';
import { TripJoinRequestsService } from './join-requests/trip-join-requests.service';
import { TripDiscoveryService } from './discovery/trip-discovery.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    // TripParticipantsController must come before TripsController so that
    // GET /v1/trips/invitations (static) registers before GET /v1/trips/:id (param)
    // and NestJS resolves the static route first.
    TripParticipantsController,
    TripsController,
    TripsDestinationsController,
    TripsTasksController,
    TripsGroupsController,
    TripAnnouncementsController,
    TripInvitationsController,
    TripJoinRequestsController,
  ],
  providers: [
    TripsService,
    TripsDestinationsService,
    TripsTasksService,
    TripsGroupsService,
    TripAnnouncementsService,
    TripParticipantsService,
    TripInvitationsService,
    TripJoinRequestsService,
    TripDiscoveryService,
  ],
  exports: [TripsService],
})
export class TripsModule {}
