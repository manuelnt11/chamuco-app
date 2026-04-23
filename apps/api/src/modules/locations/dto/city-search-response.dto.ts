import { ApiProperty } from '@nestjs/swagger';

export class CityResultDto {
  @ApiProperty({ example: 'Medellín' })
  name!: string;

  @ApiProperty({ example: 'Antioquia' })
  region!: string;
}
