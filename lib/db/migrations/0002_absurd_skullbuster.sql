CREATE TABLE IF NOT EXISTS "folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(50) NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "thread_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"thread_id" integer,
	"folder_id" integer
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "threads" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject" varchar(255),
	"last_activity_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_folders" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"folder_id" integer
);
--> statement-breakpoint
DROP INDEX IF EXISTS "from_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "to_email_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "received_at_idx";--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "thread_id" integer;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "sender_id" integer;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "recipient_id" integer;--> statement-breakpoint
ALTER TABLE "emails" ADD COLUMN "sent_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "processed_emails" ADD COLUMN "email_id" integer;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_folders" ADD CONSTRAINT "thread_folders_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "thread_folders" ADD CONSTRAINT "thread_folders_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_folders" ADD CONSTRAINT "user_folders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_folders" ADD CONSTRAINT "user_folders_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_thread_id_threads_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."threads"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "emails" ADD CONSTRAINT "emails_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
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
CREATE INDEX IF NOT EXISTS "thread_id_idx" ON "emails" USING btree ("thread_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sender_id_idx" ON "emails" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "recipient_id_idx" ON "emails" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "sent_date_idx" ON "emails" USING btree ("sent_date");--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "from_email";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "to_email";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "received_at";--> statement-breakpoint
ALTER TABLE "emails" DROP COLUMN IF EXISTS "read";