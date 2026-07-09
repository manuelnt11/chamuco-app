import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class PaginatedQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to return.', default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  /* istanbul ignore next */
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Number of items to skip.', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  /* istanbul ignore next */
  offset?: number = 0;
}
