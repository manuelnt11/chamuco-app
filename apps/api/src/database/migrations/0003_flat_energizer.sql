CREATE TYPE "public"."dietary_preference" AS ENUM('OMNIVORE', 'VEGETARIAN', 'VEGAN', 'PESCATARIAN', 'GLUTEN_FREE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."food_allergen" AS ENUM('GLUTEN', 'CRUSTACEANS', 'EGGS', 'FISH', 'PEANUTS', 'SOYBEANS', 'MILK', 'TREE_NUTS', 'CELERY', 'MUSTARD', 'SESAME', 'SULPHITES', 'LUPIN', 'MOLLUSCS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."medical_condition_type" AS ENUM('DIABETES', 'EPILEPSY', 'SEVERE_ALLERGY_EPIPEN', 'ASTHMA', 'HEART_CONDITION', 'HYPERTENSION', 'BLOOD_CLOTTING_DISORDER', 'IMMUNODEFICIENCY', 'MENTAL_HEALTH_CONDITION', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."phobia_type" AS ENUM('HEIGHTS', 'ENCLOSED_SPACES', 'FLYING', 'DEEP_WATER', 'OPEN_WATER', 'ANIMALS', 'INSECTS', 'SNAKES', 'SPIDERS', 'DARKNESS', 'CROWDS', 'MOTION_SICKNESS', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."physical_limitation_type" AS ENUM('WHEELCHAIR_USER', 'REDUCED_MOBILITY', 'CANNOT_USE_STAIRS', 'HEARING_IMPAIRMENT', 'VISUAL_IMPAIRMENT', 'REQUIRES_OXYGEN', 'REQUIRES_CPAP', 'CHRONIC_PAIN', 'JOINT_CONDITION', 'CARDIAC_CONDITION', 'RESPIRATORY_CONDITION', 'PREGNANCY', 'OTHER');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"date_of_birth" jsonb NOT NULL,
	"birth_country" char(2),
	"birth_city" text,
	"home_country" char(2) NOT NULL,
	"home_city" text,
	"phone_number" text NOT NULL,
	"bio" text,
	"dietary_preference" "dietary_preference" DEFAULT 'OMNIVORE' NOT NULL,
	"dietary_notes" text,
	"general_medical_notes" text,
	"food_allergies" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"phobias" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"physical_limitations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"medical_conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"emergency_contacts" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"loyalty_programs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE TRIGGER user_profiles_set_updated_at
  BEFORE UPDATE ON "user_profiles"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();