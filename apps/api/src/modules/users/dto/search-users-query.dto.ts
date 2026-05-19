import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUsersQueryDto {
  @ApiPropertyOptional({
    description:
      'Search query. Prefix with @ to search by username only (prefix match). ' +
      'Without @, searches both username (prefix) and display name (partial match).',
    example: '@john',
    minLength: 1,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    description: 'Number of results to return (1–20)',
    example: 10,
    default: 10,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit?: number = 10;
}
