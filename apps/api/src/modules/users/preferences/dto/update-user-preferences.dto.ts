import { ApiProperty } from '@nestjs/swagger';
import { AppCurrency, AppLanguage, AppTheme } from '@chamuco/shared-types';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiProperty({ enum: AppLanguage, example: AppLanguage.ES, required: false })
  @IsOptional()
  @IsEnum(AppLanguage)
  language?: AppLanguage;

  @ApiProperty({ enum: AppCurrency, example: AppCurrency.COP, required: false })
  @IsOptional()
  @IsEnum(AppCurrency)
  currency?: AppCurrency;

  @ApiProperty({ enum: AppTheme, example: AppTheme.SYSTEM, required: false })
  @IsOptional()
  @IsEnum(AppTheme)
  theme?: AppTheme;
}
