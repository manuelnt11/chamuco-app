UPDATE "user_profiles" up
SET "email" = u."email"
FROM "users" u
WHERE up."user_id" = u."id"
  AND up."email" IS NULL;
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "email";