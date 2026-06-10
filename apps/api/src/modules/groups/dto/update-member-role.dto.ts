import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { GroupRole } from '@chamuco/shared-types';

export class UpdateMemberRoleDto {
  @ApiProperty({
    description: 'New role to assign to the member',
    enum: [GroupRole.MEMBER, GroupRole.ADMIN, GroupRole.OWNER],
    example: GroupRole.ADMIN,
  })
  @IsEnum(GroupRole)
  role!: GroupRole;
}
