CREATE TABLE "group_trips" (
	"trip_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "group_trips_trip_id_group_id_pk" PRIMARY KEY("trip_id","group_id")
);
--> statement-breakpoint
CREATE TABLE "trip_destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"country_code" char(2) NOT NULL,
	"city" text NOT NULL,
	"label" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_destinations_trip_id_position_unique" UNIQUE("trip_id","position"),
	CONSTRAINT "trip_destinations_position_min" CHECK ("trip_destinations"."position" >= 1)
);
--> statement-breakpoint
ALTER TABLE "group_trips" ADD CONSTRAINT "group_trips_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_trips" ADD CONSTRAINT "group_trips_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_destinations" ADD CONSTRAINT "trip_destinations_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;