import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateTripAnnouncementDto {
  @ApiProperty({
    description: 'Updated announcement text broadcast to all accepted and confirmed participants.',
    example: 'Updated reminder: trip departs Sunday at 6am from Terminal B.',
    maxLength: 2000,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @Matches(/^[^<>]*$/, { message: 'HTML tags are not allowed in announcement content.' })
  content!: string;
}
