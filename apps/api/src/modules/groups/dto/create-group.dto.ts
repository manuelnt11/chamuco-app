import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { GroupVisibility } from '@chamuco/shared-types';
import { sanitizeName } from '@/common/transforms/proper-noun.transform';
import { GroupCoverDto } from './group-cover.dto';

export class CreateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Mountain Crew',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => sanitizeName(value))
  name!: string;

  @ApiProperty({
    description: 'Optional group description',
    example: 'A group for mountain hiking enthusiasts.',
    required: false,
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description:
      'Group visibility. PUBLIC groups are discoverable; PRIVATE groups are invite-only.',
    enum: GroupVisibility,
    example: GroupVisibility.PUBLIC,
  })
  @IsEnum(GroupVisibility)
  visibility!: GroupVisibility;

  @ApiProperty({
    description:
      'Cover for the group. Use source=emoji for an emoji cover or source=gcs after uploading via POST /v1/uploads/signed-url.',
    type: GroupCoverDto,
  })
  @ValidateNested()
  @Type(() => GroupCoverDto)
  cover!: GroupCoverDto;
}
