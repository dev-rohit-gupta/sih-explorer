import { createHash } from "node:crypto";
import { asc, desc, eq } from "drizzle-orm";
import { sihProblemStatements, sihSnapshots, sihSyncRuns } from "@/db/schema";
import { db } from "@/lib/db";
import type { ExplorerBundle, ProblemCategory, ProblemStatement, SnapshotSummary } from "@/lib/types";

function asSnapshot(row: typeof sihSnapshots.$inferSelect): SnapshotSummary {
  return {
    id: row.id,
    sourceUrl: row.sourceUrl,
    sourceCheckedAt: row.sourceCheckedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    contentHash: row.contentHash,
    problemStatementCount: row.problemStatementCount,
    softwareCount: row.softwareCount,
    hardwareCount: row.hardwareCount,
  };
}

function asProblem(row: typeof sihProblemStatements.$inferSelect): ProblemStatement {
  return {
    serialNo: row.serialNo,
    psNumber: row.psNumber,
    numericId: row.numericId,
    title: row.title,
    organization: row.organization,
    department: row.department,
    category: row.category as ProblemCategory,
    theme: row.theme,
    submittedIdeas: row.submittedIdeas,
    ideaCapacity: row.ideaCapacity,
    deadline: row.deadline,
    background: row.background,
    description: row.description,
    expectedSolution: row.expectedSolution,
    datasetInfo: row.datasetInfo,
    datasetUrl: row.datasetUrl,
    youtubeUrl: row.youtubeUrl,
    contactInfo: row.contactInfo,
    officialUrl: row.officialUrl,
  };
}

function problemHash(problem: ProblemStatement) {
  return createHash("sha1").update(JSON.stringify(problem)).digest("hex");
}

function diffSnapshots(current: ProblemStatement[], previous: ProblemStatement[]) {
  const currentMap = new Map(current.map((problem) => [problem.psNumber, problemHash(problem)]));
  const previousMap = new Map(previous.map((problem) => [problem.psNumber, problemHash(problem)]));

  let added = 0;
  let updated = 0;
  let removed = 0;

  for (const [id, hash] of currentMap) {
    if (!previousMap.has(id)) added++;
    else if (previousMap.get(id) !== hash) updated++;
  }

  for (const id of previousMap.keys()) {
    if (!currentMap.has(id)) removed++;
  }

  return { added, updated, removed };
}

async function problemsForSnapshot(snapshotId: number) {
  const database = db();
  const rows = await database
    .select()
    .from(sihProblemStatements)
    .where(eq(sihProblemStatements.snapshotId, snapshotId))
    .orderBy(asc(sihProblemStatements.serialNo));

  return rows.map(asProblem);
}

export async function getExplorerBundle(snapshotId?: number): Promise<ExplorerBundle> {
  try {
    const database = db();
    const snapshotRows = await database
      .select()
      .from(sihSnapshots)
      .orderBy(desc(sihSnapshots.createdAt))
      .limit(8);

    const snapshots = snapshotRows.map(asSnapshot);
    const selectedId = snapshotId && snapshots.some((snapshot) => snapshot.id === snapshotId)
      ? snapshotId
      : snapshots[0]?.id;

    if (!selectedId) {
      return {
        selectedSnapshot: null,
        snapshots: [],
        problems: [],
        sourceStatus: {
          state: "never-synced",
          lastAttemptAt: null,
          message: "No SIH snapshot has been synced yet.",
        },
        changes: null,
      };
    }

    const problems = await problemsForSnapshot(selectedId);
    const selectedIndex = snapshots.findIndex((snapshot) => snapshot.id === selectedId);
    const previousSnapshot = snapshots[selectedIndex + 1];
    const changes = previousSnapshot
      ? diffSnapshots(problems, await problemsForSnapshot(previousSnapshot.id))
      : null;

    const [lastRun] = await database
      .select({
        status: sihSyncRuns.status,
        startedAt: sihSyncRuns.startedAt,
        error: sihSyncRuns.error,
      })
      .from(sihSyncRuns)
      .orderBy(desc(sihSyncRuns.startedAt))
      .limit(1);

    const sourceStatus = !lastRun
      ? {
          state: "healthy" as const,
          lastAttemptAt: null,
          message: "Showing the latest saved SIH snapshot.",
        }
      : lastRun.status === "failed"
        ? {
            state: "unavailable" as const,
            lastAttemptAt: lastRun.startedAt.toISOString(),
            message: "The official SIH source could not be refreshed. Showing the last successful snapshot.",
          }
        : {
            state: "healthy" as const,
            lastAttemptAt: lastRun.startedAt.toISOString(),
            message: "Official SIH source synced successfully.",
          };

    return {
      selectedSnapshot: snapshots.find((snapshot) => snapshot.id === selectedId) ?? null,
      snapshots,
      problems,
      sourceStatus,
      changes,
    };
  } catch {
    return {
      selectedSnapshot: null,
      snapshots: [],
      problems: [],
      sourceStatus: {
        state: "unavailable",
        lastAttemptAt: null,
        message: "Explorer storage is not configured or migrated yet. Add DATABASE_URL and run the Drizzle migration.",
      },
      changes: null,
    };
  }
}

export async function getProblemStatement(psNumber: string, snapshotId?: number) {
  const bundle = await getExplorerBundle(snapshotId);
  return {
    bundle,
    problem: bundle.problems.find((problem) => problem.psNumber.toLowerCase() === psNumber.toLowerCase()) ?? null,
  };
}
