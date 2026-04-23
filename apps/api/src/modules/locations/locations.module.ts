import { Module } from '@nestjs/common';
import { LocationsController } from '@/modules/locations/locations.controller';
import { LocationsService } from '@/modules/locations/locations.service';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
})
export class LocationsModule {}
