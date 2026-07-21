ALTER TYPE "public"."notification_type" ADD VALUE 'GROUP_MEMBER_REMOVED' BEFORE 'TRIP_INVITATION';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'GROUP_MEMBER_PROMOTED' BEFORE 'TRIP_INVITATION';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'GROUP_MEMBER_DEMOTED' BEFORE 'TRIP_INVITATION';