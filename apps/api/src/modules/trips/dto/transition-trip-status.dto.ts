import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { TripStatus } from '@chamuco/shared-types';

export class TransitionTripStatusDto {
  @ApiProperty({
    description: 'Target status to transition the trip into.',
    enum: TripStatus,
    example: TripStatus.OPEN,
  })
  @IsEnum(TripStatus)
  status!: TripStatus;
}
