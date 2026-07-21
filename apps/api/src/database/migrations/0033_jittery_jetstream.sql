CREATE TABLE "trip_announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_announcements" ADD CONSTRAINT "trip_announcements_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_announcements" ADD CONSTRAINT "trip_announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_trip_announcements_trip_id" ON "trip_announcements" USING btree ("trip_id","created_at");

CREATE TRIGGER trip_announcements_set_updated_at
  BEFORE UPDATE ON "trip_announcements"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();