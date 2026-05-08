import { Module } from '@nestjs/common';
import { GroupsModule } from '@/modules/groups/groups.module';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [GroupsModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
