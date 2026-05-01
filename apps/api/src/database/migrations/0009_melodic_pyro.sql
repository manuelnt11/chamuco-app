CREATE TYPE "public"."visa_coverage_type" AS ENUM('COUNTRY', 'ZONE');--> statement-breakpoint
CREATE TYPE "public"."visa_entries" AS ENUM('SINGLE', 'DOUBLE', 'MULTIPLE');--> statement-breakpoint
CREATE TYPE "public"."visa_status" AS ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."visa_type" AS ENUM('TOURIST', 'BUSINESS', 'TRANSIT', 'WORK', 'STUDENT', 'DIGITAL_NOMAD', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."visa_zone" AS ENUM('SCHENGEN', 'GCC', 'CARICOM', 'EAC', 'CAN', 'MERCOSUR', 'ECOWAS');--> statement-breakpoint
CREATE TYPE "public"."eta_status" AS ENUM('ACTIVE', 'EXPIRING_SOON', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."eta_type" AS ENUM('TOURIST', 'TRANSIT');--> statement-breakpoint
CREATE TABLE "user_visas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nationality_id" uuid NOT NULL,
	"coverage_type" "visa_coverage_type" NOT NULL,
	"country_code" char(2),
	"visa_zone" "visa_zone",
	"visa_type" "visa_type" NOT NULL,
	"entries" "visa_entries" NOT NULL,
	"expiry_date" date NOT NULL,
	"visa_status" "visa_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "visa_coverage_consistency" CHECK (("user_visas"."coverage_type" = 'COUNTRY' AND "user_visas"."country_code" IS NOT NULL AND "user_visas"."visa_zone" IS NULL)
      OR
      ("user_visas"."coverage_type" = 'ZONE' AND "user_visas"."visa_zone" IS NOT NULL AND "user_visas"."country_code" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "user_etas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_nationality_id" uuid NOT NULL,
	"passport_number" text NOT NULL,
	"destination_country" char(2) NOT NULL,
	"authorization_number" text NOT NULL,
	"eta_type" "eta_type" NOT NULL,
	"entries" "visa_entries" NOT NULL,
	"expiry_date" date NOT NULL,
	"eta_status" "eta_status" NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_visas" ADD CONSTRAINT "user_visas_nationality_id_user_nationalities_id_fk" FOREIGN KEY ("nationality_id") REFERENCES "public"."user_nationalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_etas" ADD CONSTRAINT "user_etas_user_nationality_id_user_nationalities_id_fk" FOREIGN KEY ("user_nationality_id") REFERENCES "public"."user_nationalities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_visas_nationality_id_idx" ON "user_visas" USING btree ("nationality_id");--> statement-breakpoint
CREATE INDEX "user_visas_visa_status_idx" ON "user_visas" USING btree ("visa_status");--> statement-breakpoint
CREATE INDEX "user_etas_user_nationality_id_idx" ON "user_etas" USING btree ("user_nationality_id");--> statement-breakpoint
CREATE INDEX "user_etas_eta_status_idx" ON "user_etas" USING btree ("eta_status");--> statement-breakpoint
CREATE INDEX "user_etas_passport_number_idx" ON "user_etas" USING btree ("passport_number");--> statement-breakpoint
CREATE TRIGGER user_visas_set_updated_at
  BEFORE UPDATE ON "user_visas"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();--> statement-breakpoint
CREATE TRIGGER user_etas_set_updated_at
  BEFORE UPDATE ON "user_etas"
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();