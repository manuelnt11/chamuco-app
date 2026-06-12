import { ApiProperty } from '@nestjs/swagger';

import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';

export class MyParticipationResponseDto {
  @ApiProperty({ enum: TripParticipantStatus })
  status!: TripParticipantStatus;

  @ApiProperty({ enum: TripRole })
  role!: TripRole;

  @ApiProperty({ example: true })
  isTraveler!: boolean;
}
