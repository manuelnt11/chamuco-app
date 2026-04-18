import { ApiProperty } from '@nestjs/swagger';
import { AppCurrency, AppLanguage, AppTheme } from '@chamuco/shared-types';

export class UserPreferencesResponseDto {
  @ApiProperty({ enum: AppLanguage, example: AppLanguage.ES })
  language!: AppLanguage;

  @ApiProperty({ enum: AppCurrency, example: AppCurrency.COP })
  currency!: AppCurrency;

  @ApiProperty({ enum: AppTheme, example: AppTheme.SYSTEM })
  theme!: AppTheme;
}
