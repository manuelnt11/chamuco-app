import { ApiProperty } from '@nestjs/swagger';

import { TripTaskScope } from '@chamuco/shared-types';

export class TripTaskResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id!: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  tripId!: string;

  @ApiProperty({
    description:
      'SHARED: any active participant tracks their own completion. PERSONAL: private to the ' +
      'creator. ORGANIZER: organizer/co-organizer only, both for visibility and completion.',
    enum: TripTaskScope,
    example: TripTaskScope.PERSONAL,
  })
  scope!: TripTaskScope;

  @ApiProperty({ example: 'Pack sunscreen' })
  title!: string;

  @ApiProperty({
    description:
      'Completion state. For a SHARED task this reflects the requesting user’s own ' +
      'completion record. For PERSONAL and ORGANIZER tasks this is a single status shared by ' +
      'everyone who can see the task.',
    example: false,
  })
  completed!: boolean;

  @ApiProperty({
    description:
      'Username of the organizer who completed an ORGANIZER task — accountability for a task ' +
      'that carries more responsibility than SHARED/PERSONAL. Always null for SHARED and ' +
      'PERSONAL, and null for an ORGANIZER task that is not currently completed.',
    example: 'ana_organizer',
    nullable: true,
  })
  completedByUsername!: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  createdBy!: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt!: string;
}
