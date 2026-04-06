import { plainToClass } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  Min,
  Max,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1000)
  @Max(65535)
  PORT: number = 3000;

  @IsBoolean()
  @IsOptional()
  SWAGGER_ENABLED?: boolean = true;

  @IsString()
  @Matches(/^postgresql:\/\//, {
    message: 'DATABASE_URL must be a valid PostgreSQL connection string',
  })
  DATABASE_URL!: string;

  @IsNumber()
  @Min(1)
  @Max(20)
  DATABASE_POOL_MIN: number = 2;

  @IsNumber()
  @Min(1)
  @Max(100)
  DATABASE_POOL_MAX: number = 10;

  @IsString()
  FIREBASE_SERVICE_ACCOUNT_JSON!: string;
}

export function validate(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.toString()}`);
  }

  return validatedConfig;
}
