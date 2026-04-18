import { ApiProperty } from '@nestjs/swagger';
import { ProfileVisibility } from '@chamuco/shared-types';

export class KeyStatsDto {
  @ApiProperty({ example: 12 })
  tripsCompleted!: number;

  @ApiProperty({ example: 8 })
  countriesVisited!: number;

  @ApiProperty({ example: 25 })
  citiesVisited!: number;

  @ApiProperty({ example: 45000 })
  kmTraveled!: number;

  @ApiProperty({ example: 3 })
  tripsAsOrganizer!: number;
}

export class PublicProfileResponseDto {
  @ApiProperty({ example: 'jsmith' })
  username!: string;

  @ApiProperty({ example: 'John Smith' })
  displayName!: string;

  @ApiProperty({ example: 'https://cdn.example.com/avatars/jsmith.jpg', nullable: true })
  avatarUrl!: string | null;

  @ApiProperty({ example: 'Avid traveler and mountain lover.', nullable: true })
  bio!: string | null;

  @ApiProperty({ enum: ProfileVisibility, example: ProfileVisibility.PUBLIC })
  profileVisibility!: ProfileVisibility;

  @ApiProperty({
    description: 'Traveler score. Null when profile is not PUBLIC.',
    example: 1420,
    nullable: true,
  })
  travelerScore!: number | null;

  @ApiProperty({
    description:
      'Achievement identifiers. Null when profile is not PUBLIC; empty array when PUBLIC but none earned yet.',
    type: [String],
    nullable: true,
  })
  achievements!: string[] | null;

  @ApiProperty({
    description:
      'Recognition type identifiers. Null when profile is not PUBLIC; empty array when PUBLIC but none received yet.',
    type: [String],
    nullable: true,
  })
  recognitions!: string[] | null;

  @ApiProperty({
    description: 'Key travel statistics. Null when profile is not PUBLIC.',
    type: KeyStatsDto,
    nullable: true,
  })
  keyStats!: KeyStatsDto | null;

  @ApiProperty({
    description:
      'ISO 3166-1 alpha-2 country codes visited. Null when profile is not PUBLIC; empty array when PUBLIC but no trips completed yet.',
    type: [String],
    example: ['MX', 'US', 'ES'],
    nullable: true,
  })
  discoveryMap!: string[] | null;
}
