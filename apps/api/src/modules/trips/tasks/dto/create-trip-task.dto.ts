import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { TripTaskScope } from '@chamuco/shared-types';
import { sanitizeName } from '@/common/transforms/name.transform';

export class CreateTripTaskDto {
  @ApiProperty({
    description:
      'SHARED tasks require ORGANIZER/CO_ORGANIZER and are visible to every active participant. ' +
      'PERSONAL tasks are owned and managed only by the creator.',
    enum: TripTaskScope,
    example: TripTaskScope.PERSONAL,
  })
  @IsEnum(TripTaskScope)
  scope!: TripTaskScope;

  @ApiProperty({ description: 'Task title.', example: 'Pack sunscreen' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => sanitizeName(value))
  title!: string;
}
