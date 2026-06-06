CREATE TYPE "public"."trip_status" AS ENUM('DRAFT', 'OPEN', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."trip_visibility" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"cover" uuid,
	"status" "trip_status" DEFAULT 'DRAFT' NOT NULL,
	"visibility" "trip_visibility" NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"default_timezone" varchar(60),
	"default_currency" char(3),
	"participant_capacity" integer NOT NULL,
	"departure_country" char(2) NOT NULL,
	"departure_city" text NOT NULL,
	"landing_country" char(2) NOT NULL,
	"landing_city" text NOT NULL,
	"itinerary_notes" text,
	"agency_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_date_order" CHECK ("trips"."end_date" >= "trips"."start_date")
);
--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_cover_assets_id_fk" FOREIGN KEY ("cover") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE TRIGGER trips_set_updated_at
  BEFORE UPDATE ON "trips"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
