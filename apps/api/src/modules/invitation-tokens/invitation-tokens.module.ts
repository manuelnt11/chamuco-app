import { Module } from '@nestjs/common';
import { EmailModule } from '@/modules/email/email.module';
import { InvitationTokensController } from './invitation-tokens.controller';
import { InvitationTokensService } from './invitation-tokens.service';

@Module({
  imports: [EmailModule],
  controllers: [InvitationTokensController],
  providers: [InvitationTokensService],
})
export class InvitationTokensModule {}
