import { ApiProperty } from '@nestjs/swagger';

export class AnnouncementResponseDto {
  @ApiProperty({ description: 'Announcement UUID.' })
  id!: string;

  @ApiProperty({ description: 'Group UUID.' })
  groupId!: string;

  @ApiProperty({
    description: 'Username of the user who created the announcement.',
    example: 'jsmith',
  })
  createdByUsername!: string;

  @ApiProperty({ description: 'Announcement content.' })
  content!: string;

  @ApiProperty({ description: 'ISO 8601 creation timestamp.' })
  createdAt!: Date;
}
