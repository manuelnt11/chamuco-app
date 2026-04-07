import { ApiProperty } from '@nestjs/swagger';

export class UsernameCheckResponseDto {
  @ApiProperty({ example: true, description: 'Whether the username is available' })
  available!: boolean;

  @ApiProperty({ example: 'john_doe', description: 'Normalized (lowercased) username' })
  username!: string;
}
