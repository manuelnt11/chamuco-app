import { ApiProperty } from '@nestjs/swagger';
import type { CityResult } from '@chamuco/shared-types';

export class CityResultDto implements CityResult {
  @ApiProperty({ example: 'Medellín' })
  name!: string;

  @ApiProperty({ example: 'Antioquia' })
  region!: string;
}
