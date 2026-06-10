import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { TripsController } from './trips.controller';
import { TripsDestinationsController } from './destinations/trips-destinations.controller';
import { TripsGroupsController } from './groups/trips-groups.controller';
import { TripAnnouncementsController } from './announcements/trip-announcements.controller';
import { TripsService } from './trips.service';
import { TripsDestinationsService } from './destinations/trips-destinations.service';
import { TripsGroupsService } from './groups/trips-groups.service';
import { TripAnnouncementsService } from './announcements/trip-announcements.service';

@Module({
  imports: [NotificationsModule],
  controllers: [
    TripsController,
    TripsDestinationsController,
    TripsGroupsController,
    TripAnnouncementsController,
  ],
  providers: [TripsService, TripsDestinationsService, TripsGroupsService, TripAnnouncementsService],
})
export class TripsModule {}
