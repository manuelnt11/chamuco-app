import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsInt, Max, Min } from 'class-validator';

export class DateOfBirthDto {
  @ApiProperty({ example: 15, minimum: 1, maximum: 31 })
  @IsInt()
  @Min(1)
  @Max(31)
  day!: number;

  @ApiProperty({ example: 6, minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @ApiProperty({ example: 1990, minimum: 1900, maximum: new Date().getFullYear() })
  @IsInt()
  @Min(1900)
  @Max(new Date().getFullYear())
  year!: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  yearVisible!: boolean;
}
