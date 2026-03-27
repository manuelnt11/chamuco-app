import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { HealthModule } from '@/modules/health/health.module';

@Module({
  imports: [ConfigModule, HealthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
