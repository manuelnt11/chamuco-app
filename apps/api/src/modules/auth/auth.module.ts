import { Global, Module } from '@nestjs/common';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

@Global()
@Module({
  providers: [FirebaseAdminService],
  exports: [FirebaseAdminService],
})
export class AuthModule {}
