export type ProblemCategory = "Software" | "Hardware";

export interface ProblemStatement {
  serialNo: number;
  psNumber: string;
  numericId: number;
  title: string;
  organization: string;
  department: string;
  category: ProblemCategory;
  theme: string;
  submittedIdeas: number;
  ideaCapacity: number;
  deadline: string;
  background: string;
  description: string;
  expectedSolution: string;
  datasetInfo: string | null;
  datasetUrl: string | null;
  youtubeUrl: string | null;
  contactInfo: string | null;
  officialUrl: string;
}

export interface SnapshotSummary {
  id: number;
  sourceUrl: string;
  sourceCheckedAt: string;
  createdAt: string;
  contentHash: string;
  problemStatementCount: number;
  softwareCount: number;
  hardwareCount: number;
}

export interface ExplorerBundle {
  selectedSnapshot: SnapshotSummary | null;
  snapshots: SnapshotSummary[];
  problems: ProblemStatement[];
  sourceStatus: {
    state: "healthy" | "stale" | "unavailable" | "never-synced";
    lastAttemptAt: string | null;
    message: string;
  };
  changes: {
    added: number;
    updated: number;
    removed: number;
  } | null;
}
