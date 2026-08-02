import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetTripTaskCompletionDto {
  @ApiProperty({
    description: "For a SHARED task this toggles only the requesting user's own completion record.",
    example: true,
  })
  @IsBoolean()
  completed!: boolean;
}
