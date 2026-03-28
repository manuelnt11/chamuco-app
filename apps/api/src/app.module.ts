import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { HealthModule } from '@/modules/health/health.module';

@Module({
  imports: [ConfigModule, DatabaseModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
