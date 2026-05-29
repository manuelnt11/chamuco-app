ALTER TABLE "group_announcements" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TRIGGER group_announcements_set_updated_at
  BEFORE UPDATE ON "group_announcements"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
