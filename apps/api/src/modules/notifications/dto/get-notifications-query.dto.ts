import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsISO8601, IsOptional, Max, Min } from 'class-validator';

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description:
      'Cursor for pagination — ISO 8601 timestamp of the last item from the previous page.',
    example: '2026-05-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  cursor?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of notifications to return (1–50).',
    example: 20,
    default: 20,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;
}
