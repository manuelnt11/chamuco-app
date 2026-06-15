import { ApiProperty } from '@nestjs/swagger';

import { TripParticipantStatus, TripRole } from '@chamuco/shared-types';

export class ParticipantResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  userId!: string;

  @ApiProperty({ example: 'juan_viajero' })
  username!: string;

  @ApiProperty({ example: 'Juan Viajero' })
  displayName!: string;

  @ApiProperty({ example: 'https://storage.googleapis.com/...', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ enum: TripRole, example: TripRole.PARTICIPANT })
  role!: TripRole;

  @ApiProperty({ example: true })
  isTraveler!: boolean;

  @ApiProperty({
    enum: [TripParticipantStatus.ACCEPTED, TripParticipantStatus.CONFIRMED],
    example: TripParticipantStatus.ACCEPTED,
  })
  status!: TripParticipantStatus.ACCEPTED | TripParticipantStatus.CONFIRMED;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z', nullable: true })
  confirmedAt!: string | null;
}
