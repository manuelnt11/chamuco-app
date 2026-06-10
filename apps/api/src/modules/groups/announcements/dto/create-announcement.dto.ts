import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement text broadcast to all active members.',
    example: 'Reminder: trip departs Sunday at 6am. Please confirm attendance.',
    maxLength: 2000,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(/^[^<>]*$/, { message: 'HTML tags are not allowed in announcement content.' })
  content!: string;
}
