ALTER TABLE "groups" ALTER COLUMN "cover" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "deleted_at" timestamp with time zone;
