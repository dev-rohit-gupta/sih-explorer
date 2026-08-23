CREATE TABLE "sih_problem_statements" (
	"id" serial PRIMARY KEY NOT NULL,
	"snapshot_id" integer NOT NULL,
	"serial_no" integer NOT NULL,
	"ps_number" text NOT NULL,
	"numeric_id" integer NOT NULL,
	"title" text NOT NULL,
	"organization" text NOT NULL,
	"department" text NOT NULL,
	"category" text NOT NULL,
	"theme" text NOT NULL,
	"submitted_ideas" integer NOT NULL,
	"idea_capacity" integer NOT NULL,
	"deadline" text NOT NULL,
	"background" text NOT NULL,
	"description" text NOT NULL,
	"expected_solution" text NOT NULL,
	"dataset_info" text,
	"dataset_url" text,
	"youtube_url" text,
	"contact_info" text,
	"official_url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sih_snapshots" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_url" text NOT NULL,
	"source_checked_at" timestamp with time zone NOT NULL,
	"content_hash" text NOT NULL,
	"problem_statement_count" integer NOT NULL,
	"software_count" integer NOT NULL,
	"hardware_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sih_sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"http_status" integer,
	"duration_ms" integer,
	"error" text,
	"snapshot_id" integer
);
--> statement-breakpoint
CREATE TABLE "sih_sync_state" (
	"id" integer PRIMARY KEY NOT NULL,
	"lease_until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sih_problem_statements" ADD CONSTRAINT "sih_problem_statements_snapshot_id_sih_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."sih_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sih_sync_runs" ADD CONSTRAINT "sih_sync_runs_snapshot_id_sih_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."sih_snapshots"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "sih_problem_statements_snapshot_ps_unique" ON "sih_problem_statements" USING btree ("snapshot_id","ps_number");--> statement-breakpoint
CREATE INDEX "sih_problem_statements_snapshot_idx" ON "sih_problem_statements" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "sih_problem_statements_ps_number_idx" ON "sih_problem_statements" USING btree ("ps_number");--> statement-breakpoint
CREATE INDEX "sih_snapshots_created_at_idx" ON "sih_snapshots" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "sih_sync_runs_started_at_idx" ON "sih_sync_runs" USING btree ("started_at");