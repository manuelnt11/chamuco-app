import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTripTaskCompletionDto {
  @ApiProperty({
    description:
      "For a SHARED task this toggles only the requesting user's own completion record. " +
      'For PERSONAL and ORGANIZER tasks this sets a single shared completion status.',
    example: true,
  })
  @IsBoolean()
  completed!: boolean;
}
