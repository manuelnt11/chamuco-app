import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { FirebaseAuthGuard } from '@/modules/auth/firebase-auth.guard';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
  ],
  exports: [FirebaseAdminService, FirebaseAuthGuard],
})
export class AuthModule {}
