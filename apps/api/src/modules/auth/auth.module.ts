import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@/common/guards/roles.guard';
import { FirebaseAuthGuard } from '@/modules/auth/firebase-auth.guard';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';

@Global()
@Module({
  providers: [
    FirebaseAdminService,
    FirebaseAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [FirebaseAdminService, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
