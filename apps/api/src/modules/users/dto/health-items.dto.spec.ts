import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import {
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
} from '@chamuco/shared-types';
import {
  FoodAllergyItemDto,
  MedicalConditionItemDto,
  PhobiaItemDto,
  PhysicalLimitationItemDto,
} from './health-items.dto';
import { UpdateUserHealthDto } from './update-user-health.dto';

describe('FoodAllergyItemDto', () => {
  it('is valid when allergen is a known value and description is null', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.GLUTEN,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid when allergen is OTHER and description is provided', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.OTHER,
      description: 'Latex allergy',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when allergen is OTHER and description is null', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.OTHER,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when allergen is OTHER and description is empty string', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.OTHER,
      description: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when allergen is not OTHER and description is a non-string non-null value', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.GLUTEN,
      description: 123,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when description exceeds 100 characters for a non-OTHER allergen', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.GLUTEN,
      description: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when description exceeds 100 characters', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, {
      allergen: FoodAllergen.OTHER,
      description: 'a'.repeat(101),
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when allergen is an unknown value', async () => {
    const dto = plainToInstance(FoodAllergyItemDto, { allergen: 'UNKNOWN', description: null });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PhobiaItemDto', () => {
  it('is valid when phobia is a known value and description is null', async () => {
    const dto = plainToInstance(PhobiaItemDto, { phobia: PhobiaType.HEIGHTS, description: null });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid when phobia is OTHER and description is provided', async () => {
    const dto = plainToInstance(PhobiaItemDto, {
      phobia: PhobiaType.OTHER,
      description: 'Loud noises',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when phobia is OTHER and description is null', async () => {
    const dto = plainToInstance(PhobiaItemDto, { phobia: PhobiaType.OTHER, description: null });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when phobia is OTHER and description is empty string', async () => {
    const dto = plainToInstance(PhobiaItemDto, { phobia: PhobiaType.OTHER, description: '' });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when phobia is not OTHER and description is a non-string non-null value', async () => {
    const dto = plainToInstance(PhobiaItemDto, { phobia: PhobiaType.HEIGHTS, description: 42 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('PhysicalLimitationItemDto', () => {
  it('is valid when limitation is a known value and description is null', async () => {
    const dto = plainToInstance(PhysicalLimitationItemDto, {
      limitation: PhysicalLimitationType.WHEELCHAIR_USER,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid when limitation is OTHER and description is provided', async () => {
    const dto = plainToInstance(PhysicalLimitationItemDto, {
      limitation: PhysicalLimitationType.OTHER,
      description: 'Prosthetic arm',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when limitation is OTHER and description is null', async () => {
    const dto = plainToInstance(PhysicalLimitationItemDto, {
      limitation: PhysicalLimitationType.OTHER,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when limitation is OTHER and description is empty string', async () => {
    const dto = plainToInstance(PhysicalLimitationItemDto, {
      limitation: PhysicalLimitationType.OTHER,
      description: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when limitation is not OTHER and description is a non-string non-null value', async () => {
    const dto = plainToInstance(PhysicalLimitationItemDto, {
      limitation: PhysicalLimitationType.WHEELCHAIR_USER,
      description: true,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('MedicalConditionItemDto', () => {
  it('is valid when condition is a known value and description is null', async () => {
    const dto = plainToInstance(MedicalConditionItemDto, {
      condition: MedicalConditionType.DIABETES,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is valid when condition is OTHER and description is provided', async () => {
    const dto = plainToInstance(MedicalConditionItemDto, {
      condition: MedicalConditionType.OTHER,
      description: 'Rare autoimmune condition',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('is invalid when condition is OTHER and description is null', async () => {
    const dto = plainToInstance(MedicalConditionItemDto, {
      condition: MedicalConditionType.OTHER,
      description: null,
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when condition is OTHER and description is empty string', async () => {
    const dto = plainToInstance(MedicalConditionItemDto, {
      condition: MedicalConditionType.OTHER,
      description: '',
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('is invalid when condition is not OTHER and description is a non-string non-null value', async () => {
    const dto = plainToInstance(MedicalConditionItemDto, {
      condition: MedicalConditionType.DIABETES,
      description: [],
    });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe('UpdateUserHealthDto — @Type factories', () => {
  it('transforms nested array items into their DTO classes', async () => {
    const plain = {
      foodAllergies: [{ allergen: FoodAllergen.GLUTEN, description: null }],
      phobias: [{ phobia: PhobiaType.HEIGHTS, description: null }],
      physicalLimitations: [
        { limitation: PhysicalLimitationType.WHEELCHAIR_USER, description: null },
      ],
      medicalConditions: [{ condition: MedicalConditionType.DIABETES, description: null }],
    };
    const dto = plainToInstance(UpdateUserHealthDto, plain);

    expect(dto.foodAllergies![0]).toBeInstanceOf(FoodAllergyItemDto);
    expect(dto.phobias![0]).toBeInstanceOf(PhobiaItemDto);
    expect(dto.physicalLimitations![0]).toBeInstanceOf(PhysicalLimitationItemDto);
    expect(dto.medicalConditions![0]).toBeInstanceOf(MedicalConditionItemDto);
  });

  it('is valid with no fields (all optional)', async () => {
    const dto = plainToInstance(UpdateUserHealthDto, {});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
