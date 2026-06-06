ALTER TABLE "trips" ADD CONSTRAINT "trips_participant_capacity_min" CHECK ("trips"."participant_capacity" >= 1);
