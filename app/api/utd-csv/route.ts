import { readFile } from "node:fs/promises";
import { join } from "node:path";

type CsvPayload = {
  source: "primary" | "sample";
  text: string;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const PRIMARY_PATH = () => process.env.UTD_CSV_PATH?.trim() || join(process.cwd(), "data", "utd_scores.csv");
const SAMPLE_PATH = () => join(process.cwd(), "public", "sample.csv");

let cachedPayload: CsvPayload | null = null;
let cachedUntil = 0;

async function loadCsvPayload(): Promise<CsvPayload> {
  try {
    const text = await readFile(PRIMARY_PATH(), "utf8");
    return { source: "primary", text };
  } catch {
    const text = await readFile(SAMPLE_PATH(), "utf8");
    return { source: "sample", text };
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (!cachedPayload || now >= cachedUntil) {
      cachedPayload = await loadCsvPayload();
      cachedUntil = now + CACHE_TTL_MS;
    }

    return new Response(cachedPayload.text, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "cache-control": "public, max-age=300, stale-while-revalidate=3600",
        "x-data-source": cachedPayload.source
      }
    });
  } catch {
    return new Response("Both primary CSV and sample CSV are unavailable.", { status: 404 });
  }
}
