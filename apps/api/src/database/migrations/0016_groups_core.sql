-- Groups core entity: add group_visibility enum and groups table
--> statement-breakpoint
CREATE TYPE "public"."group_visibility" AS ENUM('PUBLIC', 'PRIVATE');
--> statement-breakpoint
CREATE TABLE "groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(100) NOT NULL,
  "description" text,
  "cover" uuid NOT NULL,
  "visibility" "group_visibility" NOT NULL,
  "created_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_cover_assets_id_fk" FOREIGN KEY ("cover") REFERENCES "public"."assets"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE TRIGGER groups_set_updated_at
  BEFORE UPDATE ON "groups"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
