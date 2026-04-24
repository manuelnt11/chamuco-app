import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateFeedbackDto {
  @ApiProperty({
    example: 'The trip creation flow is confusing — I could not find where to add destinations.',
    description: 'User feedback comment. Must be between 10 and 2000 characters.',
    minLength: 10,
    maxLength: 2000,
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  comment!: string;

  @ApiPropertyOptional({
    example: '/trips/123',
    description: 'Page path where feedback was submitted.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  currentPage?: string;

  @ApiPropertyOptional({
    example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...',
    description: 'Browser user agent string.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  userAgent?: string;

  @ApiPropertyOptional({
    example: '1920x1080',
    description: 'Viewport dimensions at submission time.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  viewportSize?: string;

  @ApiPropertyOptional({ example: 'es-CO', description: 'Browser language setting.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @ApiPropertyOptional({ example: 'dark', description: 'Active UI theme at submission time.' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  theme?: string;
}
