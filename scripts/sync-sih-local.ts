import dotenv from "dotenv";

dotenv.config({
  path: ".env",
});

import { parseSihHtml } from "../lib/sih/parser";

async function main() {
  const sourceUrl = process.env.SIH_PS_URL;
  const ingestUrl = process.env.SIH_INGEST_URL;
  const ingestSecret = process.env.SIH_INGEST_SECRET;

  if (!sourceUrl) {
    throw new Error("SIH_PS_URL is missing");
  }

  if (!ingestUrl) {
    throw new Error("SIH_INGEST_URL is missing");
  }

  if (!ingestSecret) {
    throw new Error("SIH_INGEST_SECRET is missing");
  }

  console.log("[SIH] Fetching official website...");

  const response = await fetch(sourceUrl, {
    cache: "no-store",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/151.0.0.0 Safari/537.36",

      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",

      "Accept-Language": "en-US,en;q=0.9",

      Referer: "https://sih.gov.in/",
    },

    signal: AbortSignal.timeout(20_000),
  });

  console.log(
    `[SIH] Source response: ${response.status}`,
  );

  if (!response.ok) {
    throw new Error(
      `SIH returned HTTP ${response.status}`,
    );
  }

  const html = await response.text();

  console.log(
    `[SIH] Downloaded ${(html.length / 1024).toFixed(1)} KB`,
  );

  const problems = parseSihHtml(
    html,
    sourceUrl,
  );

  console.log(
    `[SIH] Parsed ${problems.length} problem statements`,
  );

  // Safety check.
  if (problems.length < 50) {
    throw new Error(
      `Suspicious result: only ${problems.length} PSs parsed`,
    );
  }

  const software = problems.filter(
    (problem) =>
      problem.category?.toLowerCase() === "software",
  ).length;

  const hardware = problems.filter(
    (problem) =>
      problem.category?.toLowerCase() === "hardware",
  ).length;

  console.log(`[SIH] Software: ${software}`);
  console.log(`[SIH] Hardware: ${hardware}`);

  console.log("[SIH] Uploading snapshot...");

  const ingestResponse = await fetch(ingestUrl, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ingestSecret}`,
    },

    body: JSON.stringify({
      sourceUrl,
      sourceCheckedAt: new Date().toISOString(),
      problems,
    }),

    signal: AbortSignal.timeout(30_000),
  });

  const result = await ingestResponse.json();

  if (!ingestResponse.ok) {
    throw new Error(
      `Ingest failed (${ingestResponse.status}): ${
        result.error ?? "Unknown error"
      }`,
    );
  }

  console.log("[SIH] Sync complete:");
  console.log(result);
}

main().catch((error) => {
  console.error("[SIH] Sync failed:");
  console.error(error);

  process.exit(1);
});