import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';

import { ExportField, ExportFormat } from '@chamuco/shared-types';

export class ExportParticipantsQueryDto {
  @ApiProperty({
    enum: ExportFormat,
    default: ExportFormat.CSV,
    required: false,
    description: 'Output file format. Defaults to csv.',
  })
  @IsEnum(ExportFormat)
  @IsOptional()
  format?: ExportFormat = ExportFormat.CSV;

  @ApiProperty({
    enum: ExportField,
    isArray: true,
    required: false,
    description:
      'Fields to include in the export. Comma-separated or repeated param. Defaults to all fields.',
    example: 'displayName,email,role',
  })
  @IsEnum(ExportField, { each: true })
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    const raw: string = Array.isArray(value) ? value.join(',') : value;
    return raw
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  })
  fields?: ExportField[];
}
