CREATE TYPE "public"."invitation_token_context" AS ENUM('referral', 'trip', 'group');--> statement-breakpoint
CREATE TABLE "invitation_tokens" (
	"token" text PRIMARY KEY NOT NULL,
	"created_by" uuid NOT NULL,
	"context_type" "invitation_token_context" NOT NULL,
	"context_id" uuid,
	"recipient_email" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"redeemers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "invitation_tokens" ADD CONSTRAINT "invitation_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invitation_tokens_one_open_per_context" ON "invitation_tokens" USING btree ("context_type","context_id") WHERE "invitation_tokens"."recipient_email" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_invitation_tokens_one_targeted_per_context" ON "invitation_tokens" USING btree ("context_type","context_id","recipient_email") WHERE "invitation_tokens"."recipient_email" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_invitation_tokens_created_by" ON "invitation_tokens" USING btree ("created_by");