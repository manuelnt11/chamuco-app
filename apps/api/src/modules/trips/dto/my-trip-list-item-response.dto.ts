import { ApiProperty } from '@nestjs/swagger';

import { TripRole } from '@chamuco/shared-types';
import { TripResponseDto } from './trip-response.dto';

export class MyTripListItemResponseDto extends TripResponseDto {
  @ApiProperty({
    description: 'Resolved cover image URL. Null when no cover has been set.',
    example: 'https://storage.googleapis.com/bucket/trip-covers/trip-uuid/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

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
