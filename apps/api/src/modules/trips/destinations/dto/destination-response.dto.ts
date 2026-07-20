import { ApiProperty } from '@nestjs/swagger';

export class DestinationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tripId!: string;

  @ApiProperty({ example: 1, minimum: 1 })
  position!: number;

  @ApiProperty({ example: 'MX', minLength: 2, maxLength: 2 })
  countryCode!: string;

  @ApiProperty({ example: 'CANCUN' })
  city!: string;

  @ApiProperty({ example: 'Beach stop', nullable: true })
  label!: string | null;

  @ApiProperty({
    description: 'Rich-text itinerary for this destination (HTML string).',
    nullable: true,
  })
  itinerary!: string | null;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;
}

export class DestinationWriteResponseDto extends DestinationResponseDto {
  @ApiProperty({
    description:
      'True when trip is IN_PROGRESS — edit requires organizer confirmation and notifies participants.',
    example: false,
  })
  requiresConfirmation!: boolean;
}
