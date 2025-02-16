CREATE TABLE IF NOT EXISTS "filter_actions" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" serial NOT NULL,
	"type" varchar(50) NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "filter_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"from_pattern" text,
	"to_pattern" text,
	"subject_pattern" text,
	"operator" varchar(10) DEFAULT 'AND' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "processed_emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"rule_id" integer,
	"action_id" integer,
	"status" varchar(50) NOT NULL,
	"error" text,
	"processed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "folders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "thread_folders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "threads" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_folders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "folders" CASCADE;--> statement-breakpoint
DROP TABLE "thread_folders" CASCADE;--> statement-breakpoint
DROP TABLE "threads" CASCADE;--> statement-breakpoint
DROP TABLE "user_folders" CASCADE;--> statement-breakpoint
ALTER TABLE "emails" DROP CONSTRAINT "emails_thread_id_threads_id_fk";
--> statement-breakpoint
ALTER TABLE "emails" DROP CONSTRAINT "emails_sender_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "emails" DROP CONSTRAINT "emails_recipient_id_users_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "thread_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sender_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "recipient_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "sent_date_idx";--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "from_email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "to_email" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "received_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "read" boolean DEFAULT false;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "filter_actions" ADD CONSTRAINT "filter_actions_rule_id_filter_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."filter_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_rule_id_filter_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."filter_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_action_id_filter_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "public"."filter_actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "from_email_idx" ON "emails" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "to_email_idx" ON "emails" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "received_at_idx" ON "emails" USING btree ("received_at");--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "thread_id";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "sender_id";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "recipient_id";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "sent_date";