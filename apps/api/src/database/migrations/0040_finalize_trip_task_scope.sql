ALTER TABLE "trip_tasks" DROP CONSTRAINT "trip_tasks_completed_only_when_personal";--> statement-breakpoint
ALTER TABLE "trip_tasks" DROP CONSTRAINT "trip_tasks_owner_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "idx_trip_tasks_trip_id_owner_id";--> statement-breakpoint
UPDATE "trip_tasks" SET "scope" = CASE WHEN "owner_id" IS NULL THEN 'SHARED'::"trip_task_scope" ELSE 'PERSONAL'::"trip_task_scope" END WHERE "scope" IS NULL;--> statement-breakpoint
ALTER TABLE "trip_tasks" ALTER COLUMN "scope" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_trip_tasks_trip_id_scope" ON "trip_tasks" USING btree ("trip_id","scope");--> statement-breakpoint
ALTER TABLE "trip_tasks" DROP COLUMN "owner_id";--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD CONSTRAINT "trip_tasks_completed_at_not_shared" CHECK ("trip_tasks"."scope" != 'SHARED' OR "trip_tasks"."completed_at" IS NULL);