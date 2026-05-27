import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({
    description: 'Announcement text broadcast to all active members.',
    example: 'Reminder: trip departs Sunday at 6am. Please confirm attendance.',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content!: string;
}
