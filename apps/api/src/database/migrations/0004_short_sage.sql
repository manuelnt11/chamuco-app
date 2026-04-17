CREATE TYPE "public"."passport_status" AS ENUM('OMITTED', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "user_nationalities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"country_code" char(2) NOT NULL,
	"is_primary" boolean NOT NULL,
	"national_id_number" text,
	"passport_number" text,
	"passport_issue_date" date,
	"passport_expiry_date" date,
	"passport_status" "passport_status" NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_nationalities_user_id_country_code_unique" UNIQUE("user_id","country_code"),
	CONSTRAINT "passport_data_consistency" CHECK (("user_nationalities"."passport_status" = 'OMITTED'
        AND "user_nationalities"."passport_number" IS NULL
        AND "user_nationalities"."passport_issue_date" IS NULL
        AND "user_nationalities"."passport_expiry_date" IS NULL)
      OR
      ("user_nationalities"."passport_status" <> 'OMITTED'
        AND "user_nationalities"."passport_number" IS NOT NULL
        AND "user_nationalities"."passport_issue_date" IS NOT NULL
        AND "user_nationalities"."passport_expiry_date" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "user_nationalities" ADD CONSTRAINT "user_nationalities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_nationalities_user_id_idx" ON "user_nationalities" USING btree ("user_id");
--> statement-breakpoint
CREATE TRIGGER user_nationalities_set_updated_at
  BEFORE UPDATE ON "user_nationalities"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
--> statement-breakpoint
CREATE UNIQUE INDEX "user_nationalities_one_primary_per_user" ON "user_nationalities" USING btree ("user_id") WHERE "user_nationalities"."is_primary" = true;
