import { createHash } from "node:crypto";

import {
  createSnapshot,
  getLatestSnapshot,
  pruneSnapshots,
  recordExternalSyncSuccess,
} from "@/lib/sih/repository";
import { validateSnapshot } from "@/lib/sih/sync";
import type { ProblemStatement } from "@/lib/types";

type IngestInput = {
  problems: ProblemStatement[];
  sourceCheckedAt: Date;
  sourceUrl?: string;
};

const DEFAULT_SOURCE = "https://sih.gov.in/sih2026PS";

export async function ingestSihSnapshot({
  problems,
  sourceCheckedAt,
  sourceUrl = process.env.SIH_PS_URL || DEFAULT_SOURCE,
}: IngestInput) {
  const latest = await getLatestSnapshot();

  validateSnapshot(problems, latest?.problemStatementCount);

  // Keep hashing deterministic even if the sender changes item ordering.
  const normalized = problems
    .slice()
    .sort((a, b) => a.psNumber.localeCompare(b.psNumber));

  const contentHash = createHash("sha256")
    .update(JSON.stringify(normalized))
    .digest("hex");

  if (latest?.contentHash === contentHash) {
    await recordExternalSyncSuccess({
      snapshotId: latest.id,
      sourceCheckedAt,
    });

    return {
      status: "unchanged" as const,
      updated: false,
      snapshotId: latest.id,
    };
  }

  const snapshot = await createSnapshot({
    problems: normalized,
    contentHash,
    sourceCheckedAt,
    sourceUrl,
  });

  await pruneSnapshots();

  await recordExternalSyncSuccess({
    snapshotId: snapshot.id,
    sourceCheckedAt,
  });

  return {
    status: "updated" as const,
    updated: true,
    snapshotId: snapshot.id,
  };
}
