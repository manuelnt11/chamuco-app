CREATE TYPE "public"."trip_participant_status" AS ENUM('INVITED', 'PENDING_REQUEST', 'ACCEPTED', 'CONFIRMED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."trip_role" AS ENUM('ORGANIZER', 'CO_ORGANIZER', 'PARTICIPANT');--> statement-breakpoint
CREATE TABLE "trip_participants" (
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "trip_role" NOT NULL,
	"status" "trip_participant_status" NOT NULL,
	"is_traveler" boolean NOT NULL,
	"did_travel" boolean,
	"initiated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"confirmed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_participants_trip_id_user_id_pk" PRIMARY KEY("trip_id","user_id"),
	CONSTRAINT "participant_must_be_traveler" CHECK ("trip_participants"."role" != 'PARTICIPANT' OR "trip_participants"."is_traveler" = true)
);
--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_participants" ADD CONSTRAINT "trip_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_trip_participants_user_id_status" ON "trip_participants" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_trip_participants_trip_id_status" ON "trip_participants" USING btree ("trip_id","status");--> statement-breakpoint
CREATE TRIGGER trip_participants_set_updated_at
  BEFORE UPDATE ON "trip_participants"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
