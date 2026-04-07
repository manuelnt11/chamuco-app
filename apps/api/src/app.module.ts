import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@/config/config.module';
import { SupportAdminAuditInterceptor } from '@/common/interceptors';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { HealthModule } from '@/modules/health/health.module';
import { I18nHelperModule } from '@/i18n/i18n.module';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ConfigModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
    I18nHelperModule,
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: SupportAdminAuditInterceptor },
  ],
})
export class AppModule {}
