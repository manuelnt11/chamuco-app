CREATE TYPE "public"."auth_provider" AS ENUM('GOOGLE', 'FACEBOOK');--> statement-breakpoint
CREATE TYPE "public"."platform_role" AS ENUM('USER', 'SUPPORT_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."app_currency" AS ENUM('COP', 'USD');--> statement-breakpoint
CREATE TYPE "public"."app_language" AS ENUM('ES', 'EN');--> statement-breakpoint
CREATE TYPE "public"."app_theme" AS ENUM('LIGHT', 'DARK', 'SYSTEM');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"username" varchar(30) NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"auth_provider" "auth_provider" NOT NULL,
	"firebase_uid" text NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"platform_role" "platform_role" DEFAULT 'USER' NOT NULL,
	"agency_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_firebase_uid_unique" UNIQUE("firebase_uid")
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"language" "app_language" DEFAULT 'ES' NOT NULL,
	"currency" "app_currency" DEFAULT 'COP' NOT NULL,
	"theme" "app_theme" DEFAULT 'SYSTEM' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;