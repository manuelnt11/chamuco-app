import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { TripRole } from '@chamuco/shared-types';

export class UpdateParticipantRoleDto {
  @ApiProperty({
    description: 'New role to assign to the participant',
    enum: TripRole,
    example: TripRole.CO_ORGANIZER,
  })
  @IsEnum(TripRole)
  role!: TripRole;
}
