import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

import { sanitizeName } from '@/common/transforms/name.transform';

export class UpdateTripTaskDto {
  @ApiProperty({ description: 'New task title.', example: 'Pack reef-safe sunscreen' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  @Transform(({ value }) => sanitizeName(value))
  title!: string;
}
