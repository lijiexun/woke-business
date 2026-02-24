import Papa from "papaparse";
import type { ParsedRow } from "./types";

const AUTHOR_NOISE = [
  "Search for more papers by this author",
  "Author links open overlay panel",
  "Oxford Academic",
  "PubMed",
  "Google Scholar"
];

function cleanToken(token: string): string {
  return token
    .replace(/\b\d+\b/g, " ")
    .replace(/\S+@\S+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractAuthors(raw: string): string[] {
  if (!raw) return [];
  const base = String(raw).trim();
  if (!base || base.toLowerCase() === "nan") return [];

  let cleaned = base.replace(/\s+/g, " ");
  AUTHOR_NOISE.forEach((noise) => {
    cleaned = cleaned.replaceAll(noise, " ");
  });

  // Best-effort split for messy author strings scraped from publishers.
  const chunks = cleaned
    .split(/\band\b|;|,|&|\|/gi)
    .map((c) => cleanToken(c))
    .filter(Boolean)
    .filter((c) => c.length > 2)
    .filter((c) => /[a-z]/i.test(c));

  return [...new Set(chunks)];
}

export function parseKeywords(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return [...new Set(raw.map((x) => String(x).trim().toLowerCase()).filter(Boolean))];
  }

  const text = String(raw).trim();
  if (!text || text.toLowerCase() === "nan" || text === "[]") return [];

  const normalize = (items: unknown[]): string[] => {
    return [...new Set(
      items
        .map((item) => String(item).toLowerCase().trim())
        .map((item) => item.replace(/^['\"]|['\"]$/g, "").trim())
        .filter(Boolean)
    )];
  };

  // Handle list-like encodings: JSON arrays and python-style arrays.
  if (text.startsWith("[") && text.endsWith("]")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return normalize(parsed);
    } catch {
      try {
        const parsed = JSON.parse(text.replace(/'/g, '"'));
        if (Array.isArray(parsed)) return normalize(parsed);
      } catch {
        const inside = text.slice(1, -1);
        const parts = inside.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/g);
        return normalize(parts);
      }
    }
  }

  return normalize(text.split(/[;,|]/g));
}

function toInt(value: unknown, fallback = 0): number {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parseCsvText(text: string): ParsedRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true
  });

  // Parse once and attach normalized helper fields used by filters/aggregations.
  return parsed.data.map((row) => {
    const title = row.title?.trim() ?? "";
    const abstract = row.abstract?.trim() ?? "";
    const author = row.author?.trim() ?? "";
    const keywordsRaw = row.keywords ?? "";

    const keywordsList = parseKeywords(keywordsRaw);
    const authorsList = extractAuthors(author);

    return {
      year: toInt(row.year),
      vol: String(row.vol ?? "").trim(),
      iss: String(row.iss ?? "").trim(),
      author,
      title,
      abstract,
      url: row.url?.trim() ?? "",
      type: row.type?.trim() ?? "",
      journal: row.journal?.trim() ?? "",
      field: row.field?.trim() ?? "",
      woke_score: toInt(row.woke_score),
      keywords: String(keywordsRaw ?? ""),
      justification: row.justification?.trim() ?? "",
      keywordsList,
      authorsList,
      searchText: `${title} ${abstract}`.toLowerCase()
    };
  });
}

export async function loadCsvFromUrl(url: string): Promise<ParsedRow[]> {
  const response = await fetch(url);
  const text = await response.text();
  return parseCsvText(text);
}

export async function loadCsvFromFile(file: File): Promise<ParsedRow[]> {
  const text = await file.text();
  return parseCsvText(text);
}
