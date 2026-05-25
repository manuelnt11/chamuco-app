CREATE TABLE "user_fcm_tokens" (
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"device_hint" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_used_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_fcm_tokens_user_id_token_pk" PRIMARY KEY("user_id","token")
);
--> statement-breakpoint
ALTER TABLE "user_fcm_tokens" ADD CONSTRAINT "user_fcm_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_user_fcm_tokens_user_id" ON "user_fcm_tokens" USING btree ("user_id");
