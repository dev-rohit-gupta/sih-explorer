import { NextResponse } from "next/server";
import { syncSih } from "@/lib/sih/sync";

export const runtime = "nodejs";

export async function POST() {
  try {
    const result = await syncSih();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ status: "failed", updated: false, error: error instanceof Error ? error.message : "Sync failed" }, { status: 503 });
  }
}
