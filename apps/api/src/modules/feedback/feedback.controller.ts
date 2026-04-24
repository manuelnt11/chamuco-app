import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '@/types/express';
import { FeedbackService } from '@/modules/feedback/feedback.service';
import { CreateFeedbackDto } from '@/modules/feedback/dto/create-feedback.dto';
import { FeedbackResponseDto } from '@/modules/feedback/dto/feedback-response.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('v1/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  @HttpCode(201)
  @Throttle({ default: { ttl: 86_400_000, limit: 3 } })
  @ApiOperation({
    summary: 'Submit user feedback',
    description:
      'Creates a GitHub issue with the user comment. Limited to 3 submissions per user per 24 hours.',
  })
  @ApiResponse({
    status: 201,
    type: FeedbackResponseDto,
    description: 'Feedback submitted successfully.',
  })
  @ApiResponse({ status: 400, description: 'Validation error — comment too short or too long.' })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded — max 3 submissions per 24 hours.',
  })
  @ApiResponse({ status: 503, description: 'GitHub API unavailable.' })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFeedbackDto,
  ): Promise<FeedbackResponseDto> {
    return this.feedbackService.createFeedback(user.id, dto.comment, {
      currentPage: dto.currentPage,
      userAgent: dto.userAgent,
      viewportSize: dto.viewportSize,
      language: dto.language,
    });
  }
}
