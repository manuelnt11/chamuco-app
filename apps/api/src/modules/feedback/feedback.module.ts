import { Module } from '@nestjs/common';
import { FeedbackController } from '@/modules/feedback/feedback.controller';
import { FeedbackService } from '@/modules/feedback/feedback.service';

@Module({
  controllers: [FeedbackController],
  providers: [FeedbackService],
})
export class FeedbackModule {}
