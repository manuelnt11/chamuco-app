import { ApiProperty } from '@nestjs/swagger';

import { TripStatus, TripVisibility } from '@chamuco/shared-types';

export class TripResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Cancún 2026' })
  name!: string;

  @ApiProperty({ example: 'Beach trip for the whole crew.', nullable: true })
  description!: string | null;

  @ApiProperty({ enum: TripStatus, example: TripStatus.DRAFT })
  status!: TripStatus;

  @ApiProperty({ enum: TripVisibility, example: TripVisibility.PUBLIC })
  visibility!: TripVisibility;

  @ApiProperty({ example: '2026-12-01' })
  startDate!: string;

  @ApiProperty({ example: '2026-12-08' })
  endDate!: string;

  @ApiProperty({ example: 10, minimum: 2 })
  participantCapacity!: number;

  @ApiProperty({ example: 'MX' })
  departureCountry!: string;

  @ApiProperty({ example: 'CIUDAD DE MEXICO' })
  departureCity!: string;

  @ApiProperty({ example: 'MX' })
  landingCountry!: string;

  @ApiProperty({ example: 'CANCUN' })
  landingCity!: string;

  @ApiProperty({ example: 'America/Cancun', nullable: true })
  defaultTimezone!: string | null;

  @ApiProperty({ example: 'MXN', nullable: true })
  defaultCurrency!: string | null;

  @ApiProperty({ nullable: true })
  itineraryNotes!: string | null;

  @ApiProperty({ nullable: true, example: null })
  agencyId!: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  createdBy!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({
    description:
      'True when status is CONFIRMED or IN_PROGRESS — edits require organizer confirmation and will notify participants.',
    example: false,
  })
  requiresConfirmation!: boolean;

  @ApiProperty({
    description:
      'ISO timestamp until which post-trip feedback is open (endDate + TRIP_FEEDBACK_WINDOW_DAYS). Null until trip is COMPLETED.',
    example: '2026-12-15T00:00:00.000Z',
    nullable: true,
  })
  feedbackOpenUntil!: string | null;

  @ApiProperty({
    description: 'Resolved cover image URL. Null when no cover has been set.',
    example: 'https://storage.googleapis.com/bucket/trip-covers/trip-uuid/cover.jpg',
    nullable: true,
  })
  coverUrl!: string | null;
}
