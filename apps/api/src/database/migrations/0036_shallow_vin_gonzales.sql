ALTER TABLE "invitation_tokens" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "trip_destinations" ADD COLUMN "itinerary" text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invitation_tokens_one_targeted_per_context" ON "invitation_tokens" USING btree ("context_type","context_id","recipient_email") WHERE "invitation_tokens"."recipient_email" IS NOT NULL;
