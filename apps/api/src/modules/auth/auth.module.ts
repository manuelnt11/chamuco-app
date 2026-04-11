import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '@/common/guards/roles.guard';
import { AuthController } from '@/modules/auth/auth.controller';
import { AuthService } from '@/modules/auth/auth.service';
import { FirebaseAuthGuard } from '@/modules/auth/firebase-auth.guard';
import { FirebaseAdminService } from '@/modules/auth/firebase-admin.service';
import { UsersModule } from '@/modules/users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    FirebaseAdminService,
    FirebaseAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: FirebaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AuthService, FirebaseAdminService, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule {}
