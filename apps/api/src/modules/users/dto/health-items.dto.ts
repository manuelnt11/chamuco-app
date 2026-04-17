import { ApiProperty } from '@nestjs/swagger';
import {
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
} from '@chamuco/shared-types';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

export class FoodAllergyItemDto {
  @ApiProperty({ enum: FoodAllergen, example: FoodAllergen.GLUTEN })
  @IsEnum(FoodAllergen)
  allergen!: FoodAllergen;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when allergen is OTHER; null otherwise.',
  })
  @ValidateIf((o: FoodAllergyItemDto) => o.allergen === FoodAllergen.OTHER)
  @IsNotEmpty()
  @IsString()
  description!: string | null;
}

export class PhobiaItemDto {
  @ApiProperty({ enum: PhobiaType, example: PhobiaType.HEIGHTS })
  @IsEnum(PhobiaType)
  phobia!: PhobiaType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when phobia is OTHER; null otherwise.',
  })
  @ValidateIf((o: PhobiaItemDto) => o.phobia === PhobiaType.OTHER)
  @IsNotEmpty()
  @IsString()
  description!: string | null;
}

export class PhysicalLimitationItemDto {
  @ApiProperty({ enum: PhysicalLimitationType, example: PhysicalLimitationType.WHEELCHAIR_USER })
  @IsEnum(PhysicalLimitationType)
  limitation!: PhysicalLimitationType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when limitation is OTHER; null otherwise.',
  })
  @ValidateIf((o: PhysicalLimitationItemDto) => o.limitation === PhysicalLimitationType.OTHER)
  @IsNotEmpty()
  @IsString()
  description!: string | null;
}

export class MedicalConditionItemDto {
  @ApiProperty({ enum: MedicalConditionType, example: MedicalConditionType.DIABETES })
  @IsEnum(MedicalConditionType)
  condition!: MedicalConditionType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when condition is OTHER; null otherwise.',
  })
  @ValidateIf((o: MedicalConditionItemDto) => o.condition === MedicalConditionType.OTHER)
  @IsNotEmpty()
  @IsString()
  description!: string | null;
}
