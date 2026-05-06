import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@/config/config.module';
import { SupportAdminAuditInterceptor } from '@/common/interceptors';
import { UserThrottlerGuard } from '@/common/guards';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { FeedbackModule } from '@/modules/feedback/feedback.module';
import { HealthModule } from '@/modules/health/health.module';
import { LocationsModule } from '@/modules/locations/locations.module';
import { JobsModule } from '@/modules/jobs/jobs.module';
import { UsersModule } from '@/modules/users/users.module';
import { CloudStorageModule } from '@/modules/cloud-storage/cloud-storage.module';
import { UploadsModule } from '@/modules/uploads/uploads.module';
import { I18nHelperModule } from '@/i18n/i18n.module';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ConfigModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    CloudStorageModule,
    UploadsModule,
    HealthModule,
    FeedbackModule,
    LocationsModule,
    JobsModule,
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
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: SupportAdminAuditInterceptor },
  ],
})
export class AppModule {}
