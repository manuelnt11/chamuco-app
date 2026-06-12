import { ApiProperty } from '@nestjs/swagger';
import type { FeedbackResponse } from '@chamuco/shared-types';

export class FeedbackResponseDto implements FeedbackResponse {
  @ApiProperty({
    example: 'https://github.com/manuelnt11/Chamuco-App/issues/42',
    description: 'URL of the created GitHub issue.',
  })
  issueUrl!: string;
}
