import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { GroupVisibility } from '@chamuco/shared-types';
import { sanitizeProperNoun } from '@/common/transforms/proper-noun.transform';
import { GroupCoverDto } from './group-cover.dto';

export class UpdateGroupDto {
  @ApiProperty({
    description: 'Group name',
    example: 'Mountain Crew',
    required: false,
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => sanitizeProperNoun(value))
  name?: string;

  @ApiProperty({
    description: 'Group description. Null clears the field.',
    example: 'A group for mountain hiking enthusiasts.',
    required: false,
    minLength: 1,
    maxLength: 500,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({
    description: 'Group visibility',
    enum: GroupVisibility,
    required: false,
  })
  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility;

  @ApiProperty({
    description: 'New cover for the group',
    type: GroupCoverDto,
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GroupCoverDto)
  cover?: GroupCoverDto;
}
