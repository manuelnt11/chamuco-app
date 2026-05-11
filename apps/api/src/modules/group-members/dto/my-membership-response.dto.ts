import { ApiProperty } from '@nestjs/swagger';
import { GroupMemberStatus, GroupRole } from '@chamuco/shared-types';

export class MyMembershipResponseDto {
  @ApiProperty({ enum: GroupMemberStatus })
  status!: GroupMemberStatus;

  @ApiProperty({ enum: GroupRole })
  role!: GroupRole;
}
