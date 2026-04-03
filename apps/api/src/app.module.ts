import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { HealthModule } from '@/modules/health/health.module';
import { I18nHelperModule } from '@/i18n/i18n.module';
import { I18nModule } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
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
  providers: [],
})
export class AppModule {}
