import { ApiProperty } from '@nestjs/swagger';
import { MembershipStatus } from '@chamuco/shared-types';

export class TripSearchDestinationDto {
  @ApiProperty({ example: 'Cancún' })
  city!: string;

  @ApiProperty({ example: 'MX', description: 'ISO 3166-1 alpha-2 country code' })
  countryCode!: string;
}

export class TripSearchResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Cancún 2026' })
  name!: string;

  @ApiProperty({ example: 'A beach trip for 10 friends.', nullable: true })
  description!: string | null;

  @ApiProperty({ example: '2026-12-01', description: 'ISO date string (YYYY-MM-DD)' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-08', description: 'ISO date string (YYYY-MM-DD)' })
  endDate!: string;

  @ApiProperty({ example: 10 })
  participantCapacity!: number;

  @ApiProperty({
    example: 4,
    description: 'Number of participants with ACCEPTED or CONFIRMED status',
  })
  confirmedParticipantCount!: number;

  @ApiProperty({ type: [TripSearchDestinationDto] })
  destinations!: TripSearchDestinationDto[];

  @ApiProperty({
    description: "The requesting user's participation status in this trip",
    enum: ['none', 'pending', 'active'],
    example: 'none',
  })
  participationStatus!: MembershipStatus;
}

export class TripSearchResponseDto {
  @ApiProperty({ type: [TripSearchResultDto] })
  data!: TripSearchResultDto[];

  @ApiProperty({ description: 'Total number of matching trips (before pagination)', example: 12 })
  total!: number;
}
