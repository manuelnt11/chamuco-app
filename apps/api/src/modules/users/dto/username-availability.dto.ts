import { ApiProperty } from '@nestjs/swagger';

export class UsernameAvailabilityDto {
  @ApiProperty({ example: true, description: 'Whether the username is available' })
  available!: boolean;

  @ApiProperty({ example: 'john_doe', description: 'Normalized (lowercased) username' })
  username!: string;
}
