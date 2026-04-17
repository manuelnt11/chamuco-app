import {
  DietaryPreference,
  FoodAllergen,
  MedicalConditionType,
  PhobiaType,
  PhysicalLimitationType,
} from '@chamuco/shared-types';
import { char, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users.schema';

export const dietaryPreferenceEnum = pgEnum('dietary_preference', [
  DietaryPreference.OMNIVORE,
  DietaryPreference.VEGETARIAN,
  DietaryPreference.VEGAN,
  DietaryPreference.PESCATARIAN,
  DietaryPreference.GLUTEN_FREE,
  DietaryPreference.OTHER,
]);

export const foodAllergenEnum = pgEnum('food_allergen', [
  FoodAllergen.GLUTEN,
  FoodAllergen.CRUSTACEANS,
  FoodAllergen.EGGS,
  FoodAllergen.FISH,
  FoodAllergen.PEANUTS,
  FoodAllergen.SOYBEANS,
  FoodAllergen.MILK,
  FoodAllergen.TREE_NUTS,
  FoodAllergen.CELERY,
  FoodAllergen.MUSTARD,
  FoodAllergen.SESAME,
  FoodAllergen.SULPHITES,
  FoodAllergen.LUPIN,
  FoodAllergen.MOLLUSCS,
  FoodAllergen.OTHER,
]);

export const phobiaTypeEnum = pgEnum('phobia_type', [
  PhobiaType.HEIGHTS,
  PhobiaType.ENCLOSED_SPACES,
  PhobiaType.FLYING,
  PhobiaType.DEEP_WATER,
  PhobiaType.OPEN_WATER,
  PhobiaType.ANIMALS,
  PhobiaType.INSECTS,
  PhobiaType.SNAKES,
  PhobiaType.SPIDERS,
  PhobiaType.DARKNESS,
  PhobiaType.CROWDS,
  PhobiaType.MOTION_SICKNESS,
  PhobiaType.OTHER,
]);

export const physicalLimitationTypeEnum = pgEnum('physical_limitation_type', [
  PhysicalLimitationType.WHEELCHAIR_USER,
  PhysicalLimitationType.REDUCED_MOBILITY,
  PhysicalLimitationType.CANNOT_USE_STAIRS,
  PhysicalLimitationType.HEARING_IMPAIRMENT,
  PhysicalLimitationType.VISUAL_IMPAIRMENT,
  PhysicalLimitationType.REQUIRES_OXYGEN,
  PhysicalLimitationType.REQUIRES_CPAP,
  PhysicalLimitationType.CHRONIC_PAIN,
  PhysicalLimitationType.JOINT_CONDITION,
  PhysicalLimitationType.CARDIAC_CONDITION,
  PhysicalLimitationType.RESPIRATORY_CONDITION,
  PhysicalLimitationType.PREGNANCY,
  PhysicalLimitationType.OTHER,
]);

export const medicalConditionTypeEnum = pgEnum('medical_condition_type', [
  MedicalConditionType.DIABETES,
  MedicalConditionType.EPILEPSY,
  MedicalConditionType.SEVERE_ALLERGY_EPIPEN,
  MedicalConditionType.ASTHMA,
  MedicalConditionType.HEART_CONDITION,
  MedicalConditionType.HYPERTENSION,
  MedicalConditionType.BLOOD_CLOTTING_DISORDER,
  MedicalConditionType.IMMUNODEFICIENCY,
  MedicalConditionType.MENTAL_HEALTH_CONDITION,
  MedicalConditionType.OTHER,
]);

export const userProfiles = pgTable('user_profiles', {
  userId: uuid('user_id')
    .primaryKey()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  dateOfBirth: jsonb('date_of_birth').notNull(),
  birthCountry: char('birth_country', { length: 2 }),
  birthCity: text('birth_city'),
  homeCountry: char('home_country', { length: 2 }).notNull(),
  homeCity: text('home_city'),
  phoneNumber: text('phone_number').notNull(),
  bio: text('bio'),
  dietaryPreference: dietaryPreferenceEnum('dietary_preference')
    .notNull()
    .default(DietaryPreference.OMNIVORE),
  dietaryNotes: text('dietary_notes'),
  generalMedicalNotes: text('general_medical_notes'),
  foodAllergies: jsonb('food_allergies').notNull().default([]),
  phobias: jsonb('phobias').notNull().default([]),
  physicalLimitations: jsonb('physical_limitations').notNull().default([]),
  medicalConditions: jsonb('medical_conditions').notNull().default([]),
  emergencyContacts: jsonb('emergency_contacts').notNull().default([]),
  loyaltyPrograms: jsonb('loyalty_programs').notNull().default([]),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
