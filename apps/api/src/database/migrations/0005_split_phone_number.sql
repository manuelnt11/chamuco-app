ALTER TABLE "user_profiles" DROP COLUMN "phone_number";--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone_country_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "phone_local_number" text NOT NULL;
