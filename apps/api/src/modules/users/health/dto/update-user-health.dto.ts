import { ApiProperty } from '@nestjs/swagger';
import { BloodType, DietaryPreference } from '@chamuco/shared-types';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import {
  FoodAllergyItemDto,
  MedicalConditionItemDto,
  PhobiaItemDto,
  PhysicalLimitationItemDto,
} from './health-items.dto';

export class UpdateUserHealthDto {
  @ApiProperty({ enum: BloodType, example: BloodType.O_POSITIVE, nullable: true, required: false })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType | null;

  @ApiProperty({ enum: DietaryPreference, example: DietaryPreference.VEGETARIAN, required: false })
  @IsOptional()
  @IsEnum(DietaryPreference)
  dietaryPreference?: DietaryPreference;

  @ApiProperty({ example: 'No pork', maxLength: 300, nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  dietaryNotes?: string | null;

  @ApiProperty({
    example: 'Hypertension medication',
    maxLength: 1000,
    nullable: true,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
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
