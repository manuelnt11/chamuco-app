import { ApiProperty } from '@nestjs/swagger';

import { TripVisibility } from '@chamuco/shared-types';

export class MyTripJoinRequestResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tripId!: string;

  @ApiProperty({ example: 'Cancún 2026' })
  name!: string;

  @ApiProperty({
    description: 'Resolved cover image URL. Null when no cover has been set.',
    example: 'https://storage.googleapis.com/bucket/trip-covers/trip-uuid/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;

  @ApiProperty({ enum: TripVisibility, example: TripVisibility.PUBLIC })
  visibility!: TripVisibility;

  @ApiProperty({ example: '2026-12-01' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-08' })
  endDate!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
