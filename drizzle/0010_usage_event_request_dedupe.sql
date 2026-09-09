ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_request_action_outcome_key" UNIQUE("organization_id","request_id","action","outcome");
