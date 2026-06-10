import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { TripsController } from './trips.controller';
import { TripsDestinationsController } from './trips-destinations.controller';
import { TripsGroupsController } from './trips-groups.controller';
import { TripAnnouncementsController } from './trip-announcements.controller';
import { TripsService } from './trips.service';
import { TripsDestinationsService } from './trips-destinations.service';
import { TripsGroupsService } from './trips-groups.service';
import { TripAnnouncementsService } from './trip-announcements.service';

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
