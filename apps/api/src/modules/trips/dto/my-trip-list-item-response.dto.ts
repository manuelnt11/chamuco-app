import { ApiProperty } from '@nestjs/swagger';

import { TripRole } from '@chamuco/shared-types';
import { TripResponseDto } from './trip-response.dto';

export class MyTripListItemResponseDto extends TripResponseDto {
  @ApiProperty({
    description: 'Number of participants with CONFIRMED status.',
    example: 4,
    minimum: 0,
  })
  confirmedParticipantCount!: number;

  @ApiProperty({
    description: "Authenticated user's role in the trip.",
    enum: TripRole,
    example: TripRole.ORGANIZER,
  })
  userRole!: TripRole;
}
