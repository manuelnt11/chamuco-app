CREATE TABLE "trip_task_completions" (
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_task_completions_task_id_user_id_pk" PRIMARY KEY("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "trip_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"owner_id" uuid,
	"title" varchar(200) NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trip_tasks_completed_only_when_personal" CHECK ("trip_tasks"."owner_id" IS NOT NULL OR "trip_tasks"."completed_at" IS NULL)
);
--> statement-breakpoint
ALTER TABLE "trip_task_completions" ADD CONSTRAINT "trip_task_completions_task_id_trip_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."trip_tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_task_completions" ADD CONSTRAINT "trip_task_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_trip_tasks_trip_id_owner_id" ON "trip_tasks" USING btree ("trip_id","owner_id");