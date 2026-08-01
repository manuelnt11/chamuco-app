import { ApiProperty } from '@nestjs/swagger';

import { TripTaskScope } from '@chamuco/shared-types';

export class TripTaskResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tripId!: string;

  @ApiProperty({ enum: TripTaskScope, example: TripTaskScope.PERSONAL })
  scope!: TripTaskScope;

  @ApiProperty({ example: 'Pack sunscreen' })
  title!: string;

  @ApiProperty({
    description:
      'Completion state for the requesting user — for a SHARED task this reflects their own ' +
      'completion record, not the task overall.',
    example: false,
  })
  completed!: boolean;

  @ApiProperty({
    description: 'Owner of a PERSONAL task; null for a SHARED task.',
    example: null,
    nullable: true,
  })
  ownerId!: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  createdBy!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;
}
