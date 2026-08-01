import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateTripTaskDto {
  @ApiProperty({ description: 'New task title.', example: 'Pack reef-safe sunscreen' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}
