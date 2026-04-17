import { ApiProperty } from '@nestjs/swagger';
import { DietaryPreference } from '@chamuco/shared-types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  FoodAllergyItemDto,
  MedicalConditionItemDto,
  PhobiaItemDto,
  PhysicalLimitationItemDto,
} from './health-items.dto';

export class UpdateUserHealthDto {
  @ApiProperty({ enum: DietaryPreference, example: DietaryPreference.VEGETARIAN, required: false })
  @IsOptional()
  @IsEnum(DietaryPreference)
  dietaryPreference?: DietaryPreference;

  @ApiProperty({ example: 'No pork', nullable: true, required: false })
  @IsOptional()
  @IsString()
  dietaryNotes?: string | null;

  @ApiProperty({ example: 'Hypertension medication', nullable: true, required: false })
  @IsOptional()
  @IsString()
  generalMedicalNotes?: string | null;

  @ApiProperty({ type: FoodAllergyItemDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodAllergyItemDto)
  foodAllergies?: FoodAllergyItemDto[];

  @ApiProperty({ type: PhobiaItemDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhobiaItemDto)
  phobias?: PhobiaItemDto[];

  @ApiProperty({ type: PhysicalLimitationItemDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhysicalLimitationItemDto)
  physicalLimitations?: PhysicalLimitationItemDto[];

  @ApiProperty({ type: MedicalConditionItemDto, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicalConditionItemDto)
  medicalConditions?: MedicalConditionItemDto[];
}
