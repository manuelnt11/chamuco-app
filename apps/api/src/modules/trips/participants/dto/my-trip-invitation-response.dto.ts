import { ApiProperty } from '@nestjs/swagger';

class InvitationTripDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: 'Ruta por Colombia 2026' })
  name!: string;

  @ApiProperty({
    description: 'Ready-to-use URL for the trip cover image, or null if not set.',
    example: 'https://storage.googleapis.com/...',
    nullable: true,
  })
  coverUrl!: string | null;
}

export class MyTripInvitationResponseDto {
  @ApiProperty({ type: InvitationTripDto })
  trip!: InvitationTripDto;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  initiatedAt!: string;
}
