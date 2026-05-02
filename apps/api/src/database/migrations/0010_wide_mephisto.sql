ALTER TABLE "user_nationalities" DROP CONSTRAINT "national_id_number_format";--> statement-breakpoint
ALTER TABLE "user_nationalities" DROP CONSTRAINT "passport_number_format";--> statement-breakpoint
ALTER TABLE "user_nationalities" ADD CONSTRAINT "national_id_number_format" CHECK ("user_nationalities"."national_id_number" IS NULL OR "user_nationalities"."national_id_number" ~ '^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$');--> statement-breakpoint
ALTER TABLE "user_nationalities" ADD CONSTRAINT "passport_number_format" CHECK ("user_nationalities"."passport_number" IS NULL OR "user_nationalities"."passport_number" ~ '^[A-Z0-9]([A-Z0-9-]*[A-Z0-9])?$');
