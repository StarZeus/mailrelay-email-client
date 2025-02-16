CREATE TABLE IF NOT EXISTS "attachments" (
	"id" serial PRIMARY KEY NOT NULL,
	"email_id" integer NOT NULL,
	"filename" varchar(255) NOT NULL,
	"content_type" varchar(100) NOT NULL,
	"size" integer NOT NULL,
	"content" "bytea" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "emails" (
	"id" serial PRIMARY KEY NOT NULL,
	"from_email" varchar(255) NOT NULL,
	"to_email" varchar(255) NOT NULL,
	"subject" varchar(255),
	"body" text,
	"sent_date" timestamp DEFAULT now(),
	"read" boolean DEFAULT false
);
--> statement-breakpoint
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
	"email_id" integer,
	"rule_id" integer,
	"action_id" integer,
	"status" varchar(50) NOT NULL,
	"error" text,
	"processed_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50),
	"last_name" varchar(50),
	"email" varchar(255) NOT NULL,
	"job_title" varchar(100),
	"company" varchar(100),
	"location" varchar(100),
	"avatar_url" varchar(255)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attachments" ADD CONSTRAINT "attachments_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "filter_actions" ADD CONSTRAINT "filter_actions_rule_id_filter_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."filter_rules"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_email_id_emails_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."emails"("id") ON DELETE no action ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "attachment_email_id_idx" ON "attachments" USING btree ("email_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "attachment_filename_idx" ON "attachments" USING btree ("filename");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "from_email_idx" ON "emails" USING btree ("from_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "to_email_idx" ON "emails" USING btree ("to_email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sent_date_idx" ON "emails" USING btree ("sent_date");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "email_idx" ON "users" USING btree ("email");