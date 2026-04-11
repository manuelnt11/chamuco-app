import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description:
      'Unique username for the new account. Lowercase letters, numbers, underscores, and dashes only.',
    example: 'john_doe',
    minLength: 3,
    maxLength: 30,
    pattern: '^[a-z0-9_-]{3,30}$',
  })
  @IsString()
  @Matches(/^[a-z0-9_-]{3,30}$/, {
    message:
      'username must be 3–30 characters and contain only lowercase letters, numbers, underscores, and dashes',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  username!: string;

  @ApiProperty({
    description:
      'Display name for the account. Pre-filled from the OAuth provider but editable by the user at registration.',
    example: 'John Doe',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  displayName!: string;
}
