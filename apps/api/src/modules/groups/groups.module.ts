import { Module } from '@nestjs/common';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { GroupsDiscoveryService } from './groups-discovery.service';

@Module({
  controllers: [GroupsController],
  providers: [GroupsService, GroupsDiscoveryService],
  exports: [GroupsService],
})
export class GroupsModule {}
