CREATE TABLE "support_admin_audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_table" text NOT NULL,
	"target_id" uuid NOT NULL,
	"before_state" jsonb,
	"after_state" jsonb,
	"performed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_admin_audit_log" ADD CONSTRAINT "support_admin_audit_log_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "support_admin_audit_log_admin_user_id_idx" ON "support_admin_audit_log" USING btree ("admin_user_id");
--> statement-breakpoint
CREATE INDEX "support_admin_audit_log_performed_at_idx" ON "support_admin_audit_log" USING btree ("performed_at");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_support_admin_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'support_admin_audit_log is append-only: % operations are not permitted', TG_OP;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER support_admin_audit_log_immutable
  BEFORE UPDATE OR DELETE ON "support_admin_audit_log"
  FOR EACH ROW EXECUTE FUNCTION prevent_support_admin_audit_log_mutation();
