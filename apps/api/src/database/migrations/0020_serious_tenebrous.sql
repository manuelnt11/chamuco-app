CREATE TYPE "public"."delivery_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."notification_channel" AS ENUM('PUSH', 'EMAIL', 'SMS');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('GROUP_INVITATION', 'GROUP_JOIN_ACCEPTED', 'GROUP_ANNOUNCEMENT', 'TRIP_INVITATION', 'TRIP_ANNOUNCEMENT', 'TRIP_KEY_DATE_REMINDER', 'TRIP_COMPLETED', 'PASSPORT_EXPIRING_SOON', 'PASSPORT_EXPIRED', 'ACHIEVEMENT_UNLOCKED');--> statement-breakpoint
CREATE TABLE "notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"notification_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "delivery_status" DEFAULT 'PENDING' NOT NULL,
	"sent_at" timestamp with time zone,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"body" text NOT NULL,
	"data" jsonb,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_notification_id_notifications_id_fk" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id_created_at" ON "notifications" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE TRIGGER notification_deliveries_set_updated_at
  BEFORE UPDATE ON "notification_deliveries"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
