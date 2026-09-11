CREATE TYPE "public"."trip_task_scope" AS ENUM('SHARED', 'PERSONAL', 'ORGANIZER');--> statement-breakpoint
ALTER TABLE "trip_tasks" ADD COLUMN "scope" "trip_task_scope";