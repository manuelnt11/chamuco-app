import { ApiProperty } from '@nestjs/swagger';

import { BaseAnnouncementResponseDto } from '@/common/dto/base-announcement-response.dto';

export class TripAnnouncementResponseDto extends BaseAnnouncementResponseDto {
  @ApiProperty({ description: 'Trip UUID.' })
  tripId!: string;
}
