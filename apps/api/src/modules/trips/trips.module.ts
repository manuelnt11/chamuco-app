import { Module } from '@nestjs/common';

import { TripsController } from './trips.controller';
import { TripsDestinationsController } from './trips-destinations.controller';
import { TripsGroupsController } from './trips-groups.controller';
import { TripsService } from './trips.service';
import { TripsDestinationsService } from './trips-destinations.service';
import { TripsGroupsService } from './trips-groups.service';

@Module({
  controllers: [TripsController, TripsDestinationsController, TripsGroupsController],
  providers: [TripsService, TripsDestinationsService, TripsGroupsService],
})
export class TripsModule {}
