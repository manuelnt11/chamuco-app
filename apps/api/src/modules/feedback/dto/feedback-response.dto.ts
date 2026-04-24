import { ApiProperty } from '@nestjs/swagger';

export class FeedbackResponseDto {
  @ApiProperty({
    example: 'https://github.com/manuelnt11/Chamuco-App/issues/42',
    description: 'URL of the created GitHub issue.',
  })
  issueUrl!: string;
}
