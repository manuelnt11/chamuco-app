ALTER TABLE "user_nationalities" ADD CONSTRAINT "national_id_number_format" CHECK ("user_nationalities"."national_id_number" IS NULL OR "user_nationalities"."national_id_number" ~ '^[A-Z0-9-]+$');
ALTER TABLE "user_nationalities" ADD CONSTRAINT "passport_number_format" CHECK ("user_nationalities"."passport_number" IS NULL OR "user_nationalities"."passport_number" ~ '^[A-Z0-9-]+$');
