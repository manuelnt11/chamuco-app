ALTER TABLE "user_profiles" ADD COLUMN "phone_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "email_verified" boolean DEFAULT false NOT NULL;
