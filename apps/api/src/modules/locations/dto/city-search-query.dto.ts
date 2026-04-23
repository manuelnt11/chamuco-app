import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO31661Alpha2, IsString, MinLength } from 'class-validator';

export class CitySearchQueryDto {
  @ApiProperty({ description: 'City name prefix for autocomplete', example: 'Med', minLength: 2 })
  @IsString()
  @MinLength(2)
  namePrefix!: string;

  @ApiProperty({ description: 'ISO 3166-1 alpha-2 country code', example: 'CO' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsISO31661Alpha2()
  country!: string;
}
