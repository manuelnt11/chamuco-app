import { ApiProperty } from '@nestjs/swagger';

import { TripParticipantStatus } from '@chamuco/shared-types';

export class PendingParticipantResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;

  @ApiProperty({ example: 'juan_viajero' })
  username!: string;

  @ApiProperty({ example: 'Juan Viajero' })
  displayName!: string;

  @ApiProperty({ example: 'https://storage.googleapis.com/...', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({
    enum: [TripParticipantStatus.INVITED, TripParticipantStatus.PENDING_REQUEST],
    example: TripParticipantStatus.PENDING_REQUEST,
  })
  status!: TripParticipantStatus.INVITED | TripParticipantStatus.PENDING_REQUEST;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
