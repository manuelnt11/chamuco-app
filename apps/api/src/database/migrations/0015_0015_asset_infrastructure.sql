-- Asset infrastructure: add assets table, migrate users.avatar_url → users.avatar FK
--
-- Multi-step destructive operation documented here:
--   1. Create asset_type and asset_source enums
--   2. Create assets table
--   3. Add users.avatar UUID column (nullable, FK to assets.id)
--   4. Backfill: migrate all existing users.avatar_url (OAuth provider URLs) to assets records
--      - All pre-existing avatar_url values are OAuth URLs (source: url, is_public: true)
--      - No GCS-hosted avatars existed prior to this migration
--   5. Drop users.avatar_url (destructive — safe: all data migrated in step 4)
--
-- Verification (run before applying in production):
--   SELECT COUNT(*) FROM users WHERE avatar_url IS NOT NULL AND avatar IS NULL;
--   -- Must return 0

--> statement-breakpoint
CREATE TYPE "public"."asset_type" AS ENUM('image', 'video', 'file', 'link', 'text');
--> statement-breakpoint
CREATE TYPE "public"."asset_source" AS ENUM('gcs', 'url', 'emoji', 'text');
--> statement-breakpoint
CREATE TABLE "assets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "type" "asset_type" NOT NULL,
  "source" "asset_source" NOT NULL,
  "target" text NOT NULL,
  "file_size" bigint,
  "is_public" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "avatar" uuid;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_avatar_assets_id_fk" FOREIGN KEY ("avatar") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
WITH inserted AS (
  INSERT INTO "assets" ("type", "source", "target", "is_public")
  SELECT 'image', 'url', "avatar_url", true
  FROM "users"
  WHERE "avatar_url" IS NOT NULL
  RETURNING "id", "target"
)
UPDATE "users" u
SET "avatar" = i.id
FROM inserted i
WHERE u."avatar_url" = i.target;
--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "avatar_url";
