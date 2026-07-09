import { ApiProperty } from '@nestjs/swagger';

import { BaseAnnouncementResponseDto } from '@/common/dto/base-announcement-response.dto';

export class AnnouncementResponseDto extends BaseAnnouncementResponseDto {
  @ApiProperty({ description: 'Group UUID.' })
  groupId!: string;
}
