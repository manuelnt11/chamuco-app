CREATE INDEX "idx_group_members_user_id_status" ON "group_members" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_group_members_group_id_status" ON "group_members" USING btree ("group_id","status");
