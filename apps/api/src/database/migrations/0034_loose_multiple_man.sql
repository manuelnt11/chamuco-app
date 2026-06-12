ALTER TYPE "public"."notification_type" ADD VALUE 'TRIP_INVITATION_ACCEPTED' BEFORE 'TRIP_ANNOUNCEMENT';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRIP_JOIN_ACCEPTED' BEFORE 'TRIP_ANNOUNCEMENT';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRIP_PARTICIPANT_REMOVED' BEFORE 'TRIP_ANNOUNCEMENT';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRIP_ROLE_CHANGED' BEFORE 'TRIP_ANNOUNCEMENT';