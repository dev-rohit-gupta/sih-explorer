import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { ingestSihSnapshot } from "@/lib/sih/ingest";

export async function POST(request: NextRequest) {
  const secret = process.env.SIH_INGEST_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "SIH_INGEST_SECRET is not configured" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");

  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body.problems)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const result = await ingestSihSnapshot({
      problems: body.problems,
      sourceCheckedAt: new Date(body.sourceCheckedAt ?? Date.now()),
      sourceUrl:
        typeof body.sourceUrl === "string" && body.sourceUrl.length > 0
          ? body.sourceUrl
          : undefined,
    });

    // Refresh explorer pages after new DB data.
    revalidatePath("/", "layout");

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SIH INGEST]", error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "SIH ingest failed",
      },
      { status: 500 },
    );
  }
}
