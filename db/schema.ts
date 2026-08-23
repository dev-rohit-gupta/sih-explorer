import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const sihSnapshots = pgTable(
  "sih_snapshots",
  {
    id: serial("id").primaryKey(),
    sourceUrl: text("source_url").notNull(),
    sourceCheckedAt: timestamp("source_checked_at", { withTimezone: true, mode: "date" }).notNull(),
    contentHash: text("content_hash").notNull(),
    problemStatementCount: integer("problem_statement_count").notNull(),
    softwareCount: integer("software_count").notNull(),
    hardwareCount: integer("hardware_count").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("sih_snapshots_created_at_idx").on(table.createdAt)],
);

export const sihProblemStatements = pgTable(
  "sih_problem_statements",
  {
    id: serial("id").primaryKey(),
    snapshotId: integer("snapshot_id")
      .notNull()
      .references(() => sihSnapshots.id, { onDelete: "cascade" }),
    serialNo: integer("serial_no").notNull(),
    psNumber: text("ps_number").notNull(),
    numericId: integer("numeric_id").notNull(),
    title: text("title").notNull(),
    organization: text("organization").notNull(),
    department: text("department").notNull(),
    category: text("category").notNull(),
    theme: text("theme").notNull(),
    submittedIdeas: integer("submitted_ideas").notNull(),
    ideaCapacity: integer("idea_capacity").notNull(),
    deadline: text("deadline").notNull(),
    background: text("background").notNull(),
    description: text("description").notNull(),
    expectedSolution: text("expected_solution").notNull(),
    datasetInfo: text("dataset_info"),
    datasetUrl: text("dataset_url"),
    youtubeUrl: text("youtube_url"),
    contactInfo: text("contact_info"),
    officialUrl: text("official_url").notNull(),
  },
  (table) => [
    uniqueIndex("sih_problem_statements_snapshot_ps_unique").on(table.snapshotId, table.psNumber),
    index("sih_problem_statements_snapshot_idx").on(table.snapshotId),
    index("sih_problem_statements_ps_number_idx").on(table.psNumber),
  ],
);

export const sihSyncRuns = pgTable(
  "sih_sync_runs",
  {
    id: serial("id").primaryKey(),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "date" }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true, mode: "date" }),
    status: text("status").notNull(),
    httpStatus: integer("http_status"),
    durationMs: integer("duration_ms"),
    error: text("error"),
    snapshotId: integer("snapshot_id").references(() => sihSnapshots.id, { onDelete: "set null" }),
  },
  (table) => [index("sih_sync_runs_started_at_idx").on(table.startedAt)],
);

export const sihSyncState = pgTable("sih_sync_state", {
  id: integer("id").primaryKey(),
  leaseUntil: timestamp("lease_until", { withTimezone: true, mode: "date" }).notNull(),
});
