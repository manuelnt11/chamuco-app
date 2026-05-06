import { Global, Module } from '@nestjs/common';
import { CloudStorageService } from './cloud-storage.service';

@Global()
@Module({
  providers: [CloudStorageService],
  exports: [CloudStorageService],
})
export class CloudStorageModule {}
