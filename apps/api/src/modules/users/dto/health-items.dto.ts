import { ApiProperty } from '@nestjs/swagger';
import {
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
} from '@chamuco/shared-types';
import { IsEnum } from 'class-validator';
import { IsHealthDescription } from './health-description.validator';

export class FoodAllergyItemDto {
  @ApiProperty({ enum: FoodAllergen, example: FoodAllergen.GLUTEN })
  @IsEnum(FoodAllergen)
  allergen!: FoodAllergen;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when allergen is OTHER; null otherwise. Max 100 characters.',
  })
  @IsHealthDescription('allergen', FoodAllergen.OTHER, 100)
  description!: string | null;
}

export class PhobiaItemDto {
  @ApiProperty({ enum: PhobiaType, example: PhobiaType.HEIGHTS })
  @IsEnum(PhobiaType)
  phobia!: PhobiaType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when phobia is OTHER; null otherwise. Max 100 characters.',
  })
  @IsHealthDescription('phobia', PhobiaType.OTHER, 100)
  description!: string | null;
}

export class PhysicalLimitationItemDto {
  @ApiProperty({ enum: PhysicalLimitationType, example: PhysicalLimitationType.WHEELCHAIR_USER })
  @IsEnum(PhysicalLimitationType)
  limitation!: PhysicalLimitationType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when limitation is OTHER; null otherwise. Max 100 characters.',
  })
  @IsHealthDescription('limitation', PhysicalLimitationType.OTHER, 100)
  description!: string | null;
}

export class MedicalConditionItemDto {
  @ApiProperty({ enum: MedicalConditionType, example: MedicalConditionType.DIABETES })
  @IsEnum(MedicalConditionType)
  condition!: MedicalConditionType;

  @ApiProperty({
    example: null,
    nullable: true,
    description: 'Required when condition is OTHER; null otherwise. Max 100 characters.',
  })
  @IsHealthDescription('condition', MedicalConditionType.OTHER, 100)
  description!: string | null;
}
