import { Module } from '@nestjs/common';
import { GroupsModule } from '@/modules/groups/groups.module';
import { TripsModule } from '@/modules/trips/trips.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [GroupsModule, TripsModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
