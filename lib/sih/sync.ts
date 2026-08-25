import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNotNull, lte } from "drizzle-orm";
import {
  sihProblemStatements,
  sihSnapshots,
  sihSyncRuns,
  sihSyncState,
} from "@/db/schema";
import { db } from "@/lib/db";
import { parseSihHtml } from "@/lib/sih/parser";
import type { ProblemStatement } from "@/lib/types";

const DEFAULT_SOURCE = "https://sih.gov.in/sih2026PS";

function stableHash(problems: ProblemStatement[]) {
  return createHash("sha256").update(JSON.stringify(problems)).digest("hex");
}

function validateSnapshot(problems: ProblemStatement[], previousCount?: number) {
  const minCount = Number(process.env.SIH_MIN_PS_COUNT ?? 50);

  if (problems.length < minCount) {
    throw new Error(`Suspicious SIH scrape: only ${problems.length} problem statements parsed`);
  }

  const ids = new Set(problems.map((problem) => problem.psNumber));
  if (ids.size !== problems.length) {
    throw new Error("Suspicious SIH scrape: duplicate problem statement IDs found");
  }

  if (previousCount && problems.length < Math.floor(previousCount * 0.7)) {
    throw new Error(`Suspicious SIH scrape: count dropped from ${previousCount} to ${problems.length}`);
  }

  if (problems.some((problem) => !problem.title || !problem.organization || !problem.theme)) {
    throw new Error("Suspicious SIH scrape: required fields are missing");
  }
}

function problemRows(snapshotId: number, problems: ProblemStatement[]) {
  return problems.map((problem) => ({
    snapshotId,
    serialNo: problem.serialNo,
    psNumber: problem.psNumber,
    numericId: problem.numericId,
    title: problem.title,
    organization: problem.organization,
    department: problem.department,
    category: problem.category,
    theme: problem.theme,
    submittedIdeas: problem.submittedIdeas,
    ideaCapacity: problem.ideaCapacity,
    deadline: problem.deadline,
    background: problem.background,
    description: problem.description,
    expectedSolution: problem.expectedSolution,
    datasetInfo: problem.datasetInfo,
    datasetUrl: problem.datasetUrl,
    youtubeUrl: problem.youtubeUrl,
    contactInfo: problem.contactInfo,
    officialUrl: problem.officialUrl,
  }));
}

export async function syncSih({ force = false }: { force?: boolean } = {}) {
  const database = db();
  const sourceUrl = process.env.SIH_PS_URL || DEFAULT_SOURCE;
  const staleMinutes = Number(process.env.SIH_SYNC_STALE_MINUTES ?? 15);
  const startedAt = Date.now();

  const [latest] = await database
    .select({
      id: sihSnapshots.id,
      createdAt: sihSnapshots.createdAt,
      problemStatementCount: sihSnapshots.problemStatementCount,
      contentHash: sihSnapshots.contentHash,
    })
    .from(sihSnapshots)
    .orderBy(desc(sihSnapshots.createdAt))
    .limit(1);

  const [lastSuccess] = await database
    .select({ finishedAt: sihSyncRuns.finishedAt })
    .from(sihSyncRuns)
    .where(and(eq(sihSyncRuns.status, "success"), isNotNull(sihSyncRuns.finishedAt)))
    .orderBy(desc(sihSyncRuns.finishedAt))
    .limit(1);

  const lastCheckedAt = lastSuccess?.finishedAt ?? latest?.createdAt;

  if (
    !force &&
    latest &&
    lastCheckedAt &&
    Date.now() - lastCheckedAt.getTime() < staleMinutes * 60_000
  ) {
    return { status: "fresh" as const, updated: false, snapshotId: latest.id };
  }

  await database
    .insert(sihSyncState)
    .values({ id: 1, leaseUntil: new Date(0) })
    .onConflictDoNothing();

  const [lock] = await database
    .update(sihSyncState)
    .set({ leaseUntil: new Date(Date.now() + 30_000) })
    .where(and(eq(sihSyncState.id, 1), lte(sihSyncState.leaseUntil, new Date())))
    .returning({ id: sihSyncState.id });

  if (!lock) {
    return {
      status: "syncing" as const,
      updated: false,
      snapshotId: latest?.id ?? null,
    };
  }

  const [run] = await database
    .insert(sihSyncRuns)
    .values({ status: "running" })
    .returning({ id: sihSyncRuns.id });

  let httpStatus: number | null = null;

  try {
    const response = await fetch(sourceUrl, {
  cache: "no-store",
  redirect: "follow",
  signal: AbortSignal.timeout(
    Number(process.env.SIH_FETCH_TIMEOUT_MS ?? 10_000)
  ),
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
      "AppleWebKit/537.36 (KHTML, like Gecko) " +
      "Chrome/151.0.0.0 Safari/537.36",

    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9," +
      "image/avif,image/webp,*/*;q=0.8",

    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://sih.gov.in/",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
  },
});

    httpStatus = response.status;
    if (!response.ok) {
  const body = await response.text();

  console.error("[SIH SYNC] Source request failed", {
    status: response.status,
    statusText: response.statusText,
    url: response.url,
    bodyPreview: body.slice(0, 500),
  });

  throw new Error(`SIH source returned HTTP ${response.status}`);
}

    const html = await response.text();
    const problems = parseSihHtml(html, sourceUrl);
    validateSnapshot(problems, latest?.problemStatementCount);

    const contentHash = stableHash(problems);
    const unchanged = latest?.contentHash === contentHash;
    let snapshotId = unchanged && latest ? latest.id : null;

    if (!snapshotId) {
      snapshotId = await database.transaction(async (tx) => {
        const softwareCount = problems.filter((problem) => problem.category === "Software").length;
        const hardwareCount = problems.length - softwareCount;

        const [created] = await tx
          .insert(sihSnapshots)
          .values({
            sourceUrl,
            sourceCheckedAt: new Date(),
            contentHash,
            problemStatementCount: problems.length,
            softwareCount,
            hardwareCount,
          })
          .returning({ id: sihSnapshots.id });

        await tx.insert(sihProblemStatements).values(problemRows(created.id, problems));
        return created.id;
      });

      const retention = Math.max(2, Number(process.env.SIH_SNAPSHOT_RETENTION ?? 20));
      const oldSnapshots = await database
        .select({ id: sihSnapshots.id })
        .from(sihSnapshots)
        .orderBy(desc(sihSnapshots.createdAt))
        .offset(retention);

      if (oldSnapshots.length > 0) {
        await database
          .delete(sihSnapshots)
          .where(inArray(sihSnapshots.id, oldSnapshots.map((snapshot) => snapshot.id)));
      }
    }

    await database
      .update(sihSyncRuns)
      .set({
        status: "success",
        finishedAt: new Date(),
        httpStatus,
        durationMs: Date.now() - startedAt,
        snapshotId,
      })
      .where(eq(sihSyncRuns.id, run.id));

    return {
      status: unchanged ? ("unchanged" as const) : ("updated" as const),
      updated: !unchanged,
      snapshotId,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SIH sync error";

    await database
      .update(sihSyncRuns)
      .set({
        status: "failed",
        finishedAt: new Date(),
        httpStatus,
        durationMs: Date.now() - startedAt,
        error: message,
      })
      .where(eq(sihSyncRuns.id, run.id));

    throw error;
  } finally {
    await database
      .update(sihSyncState)
      .set({ leaseUntil: new Date() })
      .where(eq(sihSyncState.id, 1));
  }
}
