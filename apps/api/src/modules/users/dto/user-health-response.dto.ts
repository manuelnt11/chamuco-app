import { ApiProperty } from '@nestjs/swagger';
import { DietaryPreference } from '@chamuco/shared-types';
import {
  FoodAllergyItemDto,
  MedicalConditionItemDto,
  PhobiaItemDto,
  PhysicalLimitationItemDto,
} from './health-items.dto';

export class UserHealthResponseDto {
  @ApiProperty({ enum: DietaryPreference, example: DietaryPreference.OMNIVORE })
  dietaryPreference!: DietaryPreference;

  @ApiProperty({ example: null, nullable: true })
  dietaryNotes!: string | null;

  @ApiProperty({ example: null, nullable: true })
  generalMedicalNotes!: string | null;

  @ApiProperty({ type: FoodAllergyItemDto, isArray: true, example: [] })
  foodAllergies!: FoodAllergyItemDto[];

  @ApiProperty({ type: PhobiaItemDto, isArray: true, example: [] })
  phobias!: PhobiaItemDto[];

  @ApiProperty({ type: PhysicalLimitationItemDto, isArray: true, example: [] })
  physicalLimitations!: PhysicalLimitationItemDto[];

  @ApiProperty({ type: MedicalConditionItemDto, isArray: true, example: [] })
  medicalConditions!: MedicalConditionItemDto[];
}
