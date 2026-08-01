import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

import { TripTaskScope } from '@chamuco/shared-types';

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
  title!: string;
}
