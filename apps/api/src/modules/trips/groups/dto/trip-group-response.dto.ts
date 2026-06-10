import { ApiProperty } from '@nestjs/swagger';

export class TripGroupResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  tripId!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  groupId!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  addedAt!: string;
}
