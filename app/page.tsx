import { BackgroundRefresh } from "@/components/explorer/background-refresh";
import { ExplorerClient } from "@/components/explorer/explorer-client";
import { getExplorerBundle } from "@/lib/sih/repository";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ snapshot?: string }> }) {
  const params = await searchParams;
  const snapshotId = params.snapshot ? Number(params.snapshot) : undefined;
  const bundle = await getExplorerBundle(Number.isFinite(snapshotId) ? snapshotId : undefined);
  return <><BackgroundRefresh enabled={!params.snapshot} /><ExplorerClient bundle={bundle} /></>;
}
