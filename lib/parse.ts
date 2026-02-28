import Papa from "papaparse";
import type { ParsedRow } from "./types";

const AUTHOR_NOISE = [
  "Search for more papers by this author",
  "Author links open overlay panel",
  "Search for other works by this author on:",
  "Search for other works by this author",
  "View all authors",
  "See all authors",
  "all authors",
  "Author Notes",
  "Oxford Academic",
  "PubMed",
  "Google Scholar"
];

const NAME_PARTICLES = new Set([
  "de",
  "del",
  "da",
  "di",
  "la",
  "le",
  "van",
  "von",
  "bin",
  "al",
  "el",
  "der",
  "den",
  "ter",
  "ten",
  "dos",
  "das",
  "du",
  "st",
  "st."
]);

const NON_NAME_TOKENS = new Set([
  "the",
  "of",
  "university",
  "college",
  "school",
  "department",
  "institute",
  "center",
  "centre",
  "office",
  "program",
  "programme",
  "faculty",
  "campus",
  "academy",
  "hospital",
  "laboratory",
  "lab",
  "management",
  "business",
  "economics",
  "policy",
  "studies",
  "study",
  "relations",
  "sustainability",
  "association",
  "journal",
  "site",
  "this",
  "organization",
  "organizations",
  "editor",
  "editorial",
  "article",
  "author",
  "authors",
  "correspondence",
  "corresponding",
  "notes",
  "search",
  "works",
  "scholar",
  "pubmed",
  "google",
  "engineering",
  "systems",
  "operations",
  "information",
  "industrial",
  "environmental",
  "computer",
  "research",
  "science",
  "sciences",
  "technology",
  "technological",
  "bureau",
  "council",
  "commission",
  "exchange",
  "state",
  "estate",
  "organizational",
  "behavior",
  "statistics",
  "relationship",
  "banking",
  "evidence",
  "form",
  "we",
  "nber",
  "cepr"
]);

const AFFILIATION_WORDS = [
  "University",
  "College",
  "School",
  "Department",
  "Institute",
  "Center",
  "Centre",
  "Faculty",
  "Hospital",
  "Campus",
  "Program",
  "Programme",
  "Academy",
  "Laboratory",
  "Lab",
  "Office"
];

const AFFILIATION_PATTERN = new RegExp(`\\b(?:${AFFILIATION_WORDS.join("|")})\\b`, "i");
const AFFILIATION_GLUE_MARKER = "__AFF_GLUE__";
const BLANK_TYPE_INFER_JOURNALS = new Set(["MS", "OR", "OS", "JOC", "MKS", "MSOM", "ISR", "MISQ", "JOM"]);

const LOCATION_OR_ORG_TOKENS = new Set([
  "new",
  "york",
  "united",
  "kingdom",
  "states",
  "north",
  "south",
  "east",
  "west",
  "los",
  "angeles",
  "hong",
  "kong",
  "carolina",
  "jersey",
  "hill",
  "haven",
  "lansing",
  "gables",
  "lafayette",
  "san",
  "diego",
  "francisco",
  "cambridge",
  "rotterdam",
  "iowa",
  "bay",
  "arbor",
  "national",
  "federal",
  "political",
  "humanities",
  "reserve",
  "bank",
  "nber",
  "cepr"
]);

const SUFFIX_TOKENS = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v", "vi"]);
const SUFFIX_REGEX_PART = "(?:III|II|IV|VI|V|Jr\\.?|Sr\\.?)";

function isSuffixToken(token: string): boolean {
  return SUFFIX_TOKENS.has(token.toLowerCase());
}

function normalizeAuthorText(raw: string): string {
  let text = raw
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  text = text
    // Split glued initials like "Carl.P" -> "Carl P"
    .replace(/([A-Za-z])\.([A-ZÀ-ÖØ-Þ])/g, "$1 $2")
    // Split glued suffix-to-affiliation tokens like "Jr.University" / "IIIUniversity".
    .replace(new RegExp(`\\b(${SUFFIX_REGEX_PART})([A-ZÀ-ÖØ-Þ])`, "g"), "$1 $2");

  AUTHOR_NOISE.forEach((noise) => {
    // Preserve author boundaries by turning known tail snippets into chunk separators.
    text = text.replaceAll(noise, " | ");
  });

  text = text
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/orcid\.org\/\S+/gi, " ")
    .replace(/\S+@\S+/g, " ")
    .replace(/\bserved as associate editor for this article\b.*$/i, " ")
    .replace(/\bauthor notes?\b.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Break glued affiliation starts, e.g. "LadgeNortheastern University".
  text = text
    .replace(
      /([\p{Ll}])([A-ZÀ-ÖØ-Þ][\p{L}'’.-]+\s+(?:University|College|School|Department|Institute|Center|Centre|Faculty|Hospital|Campus|Program|Programme|Academy|Laboratory|Lab|Office))/gu,
      `$1 ${AFFILIATION_GLUE_MARKER} $2`
    )
    .replace(
      /([\p{L}'’.-])((?:University|College|School|Department|Institute|Center|Centre|Faculty|Hospital|Campus|Program|Programme|Academy|Laboratory|Lab|Office)\b)/gu,
      `$1 ${AFFILIATION_GLUE_MARKER} $2`
    )
    .replace(
      /\b(University|College|School|Department|Institute|Center|Centre|Faculty|Hospital|Campus|Program|Programme|Academy|Laboratory|Lab|Office)([A-Z][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+)/g,
      "$1 $2"
    )
    .replace(/\s+/g, " ")
    .trim();

  return text;
}

function normalizeToken(token: string): string {
  return token
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .replace(/[\u2010-\u2015\u2212]/g, "-")
    .replace(/^[^\p{L}]+/u, "")
    .replace(/[^\p{L}.'’-]+$/u, "")
    .replace(/\u2019/g, "'")
    .trim();
}

function isInitial(token: string): boolean {
  return /^[A-Z](?:\.[A-Z]+)*\.?$/.test(token);
}

function isNameToken(token: string): boolean {
  const t = token.replace(/\.$/, "");
  if (!t) return false;
  if (isSuffixToken(t)) return true;
  if (NAME_PARTICLES.has(t.toLowerCase())) return true;
  if (isInitial(t)) return true;
  if (/^[A-ZÀ-ÖØ-Þ][\p{L}'’-]*$/u.test(t)) return true;
  return false;
}

function stripAffiliationTail(chunk: string): string {
  if (!AFFILIATION_PATTERN.test(chunk)) return chunk;

  const words = chunk.split(/\s+/);
  const idx = words.findIndex((w) => AFFILIATION_PATTERN.test(w));
  if (idx < 0) return chunk;
  return words.slice(0, idx).join(" ").trim();
}

function validateCandidate(parts: string[], allowSingleCoreWithInitial = false): boolean {
  if (!parts.length || parts.length > 6) return false;
  const core = parts.filter((p, idx) => {
    const lower = p.replace(/\.$/, "").toLowerCase();
    const isLowercaseParticle = idx > 0 && NAME_PARTICLES.has(lower) && p === p.toLowerCase();
    return !isLowercaseParticle && !isInitial(p) && !(idx > 0 && isSuffixToken(lower));
  });

  if (core.length > 5) return false;
  if (core.length < 2) {
    const hasInitial = parts.some((p) => isInitial(p));
    if (!(allowSingleCoreWithInitial && core.length === 1 && hasInitial)) return false;
  }
  if (core.some((p) => NON_NAME_TOKENS.has(p.toLowerCase()))) return false;
  if (parts.some((p) => /\d/.test(p))) return false;
  if (core.every((p) => LOCATION_OR_ORG_TOKENS.has(p.toLowerCase()))) return false;
  return true;
}

function isLikelyIncompletePrefix(tokens: string[], size: number): boolean {
  if (size >= tokens.length) return false;
  const last = tokens[size - 1]?.replace(/\.$/, "") ?? "";
  const next = tokens[size] ?? "";
  if (!last || !next) return false;

  const lower = last.toLowerCase();
  if (isSuffixToken(lower)) return false;
  if (NAME_PARTICLES.has(lower) && /^[A-ZÀ-ÖØ-Þ]/u.test(next)) return true;

  return /^[a-z][\p{L}'’-]*$/u.test(last) && /^[A-ZÀ-ÖØ-Þ]/u.test(next);
}

function extractNameFromChunk(rawChunk: string): string | null {
  if (!rawChunk) return null;
  let chunk = rawChunk
    .replace(/\b(?:search for other works by this author(?: on:)?|search for more papers by this author)\b.*$/i, " ")
    .replace(/^[,;|&\s]+/, " ")
    .replace(/^\s*and\s+/i, " ")
    .replace(/\b(?:view all authors|see all authors|all authors)\b.*$/i, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/([\p{Ll}])([A-ZÀ-ÖØ-Þ])/gu, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

  chunk = chunk.replaceAll(AFFILIATION_GLUE_MARKER, " ").replace(/\s+/g, " ").trim();
  const hadAffiliation = AFFILIATION_PATTERN.test(chunk);
  chunk = stripAffiliationTail(chunk);
  if (!chunk) return null;

  const tokens = chunk
    .split(/\s+/)
    .map(normalizeToken)
    .filter(Boolean);

  const collected: string[] = [];
  for (let idx = 0; idx < tokens.length; idx += 1) {
    const token = tokens[idx];
    const normalized = token.replace(/\.$/, "");
    const lower = normalized.toLowerCase();
    if (NON_NAME_TOKENS.has(lower)) break;
    if (!isNameToken(token)) {
      // Some sources contain lowercase middle tokens, e.g. "Ming zhu Wang".
      const next = tokens[idx + 1] ?? "";
      const canKeepLowerMiddle =
        collected.length > 0 &&
        /^[a-z][\p{L}'’-]*$/u.test(token) &&
        !NON_NAME_TOKENS.has(lower) &&
        /^[A-ZÀ-ÖØ-Þ]/u.test(next);
      if (!canKeepLowerMiddle) break;
    }
    collected.push(token.endsWith(".") ? token : normalized);
  }

  while (collected.length) {
    const rawTail = collected[collected.length - 1].replace(/\.$/, "");
    const tail = rawTail.toLowerCase();
    if (!(NAME_PARTICLES.has(tail) && rawTail === rawTail.toLowerCase())) break;
    collected.pop();
  }

  if (!collected.length) return null;

  if (collected.length >= 3) {
    const head = collected[0].replace(/\.$/, "").toLowerCase();
    const tail = collected[collected.length - 1].replace(/\.$/, "").toLowerCase();
    if (head === tail) {
      collected.pop();
    }
  }

  if (hadAffiliation && collected.length > 2) {
    for (let size = 2; size <= Math.min(collected.length, 6); size += 1) {
      if (isLikelyIncompletePrefix(collected, size)) continue;
      const prefix = collected.slice(0, size);
      if (validateCandidate(prefix, false)) {
        let trimAt = size;
        if (collected[trimAt] && isSuffixToken(collected[trimAt])) {
          trimAt += 1;
        }
        collected.splice(trimAt);
        break;
      }
    }
  }

  // Collapse duplicate repeats like "Sumita Raghuram Sumita Raghuram".
  if (collected.length >= 4 && collected.length % 2 === 0) {
    const half = collected.length / 2;
    const left = collected.slice(0, half).join(" ");
    const right = collected.slice(half).join(" ");
    if (left === right) {
      collected.splice(half);
    }
  }

  let selected: string[] | null = null;
  for (let size = 2; size <= Math.min(collected.length, 6); size += 1) {
    if (isLikelyIncompletePrefix(collected, size)) continue;
    const prefix = collected.slice(0, size);
    if (validateCandidate(prefix, false)) {
      selected = prefix;
      break;
    }
  }

  if (!selected) {
    for (let size = 2; size <= Math.min(collected.length, 6); size += 1) {
      if (isLikelyIncompletePrefix(collected, size)) continue;
      const prefix = collected.slice(0, size);
      if (validateCandidate(prefix, true)) {
        selected = prefix;
        break;
      }
    }
  }

  if (!selected) return null;

  // Include trailing suffix token when present, e.g. ", Jr." / ", III".
  if (collected.length > selected.length) {
    const suffixToken = collected[selected.length];
    if (isSuffixToken(suffixToken)) selected = [...selected, suffixToken];
  }

  return selected.join(" ");
}

function toTitleCaseWord(raw: string): string {
  if (!raw) return "";
  if (raw !== raw.toUpperCase() && raw !== raw.toLowerCase()) return raw;

  return raw
    .split("-")
    .map((piece) =>
      piece
        .split("'")
        .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}` : part))
        .join("'")
    )
    .join("-");
}

function normalizeInitialToken(raw: string): string {
  const letters = raw.replace(/\./g, "").toUpperCase();
  if (!letters) return "";
  return `${letters.split("").join(".")}.`;
}

function formatPersonName(rawName: string): string {
  const tokens = rawName.trim().split(/\s+/).filter(Boolean);

  return tokens
    .map((token, idx) => {
      const normalizedToken = token.normalize("NFKD").replace(/\p{M}+/gu, "").replace(/\u2019/g, "'");
      const core = normalizedToken.replace(/[.,]+$/g, "");
      const lower = core.toLowerCase();

      if (!core) return "";
      if (isSuffixToken(lower)) {
        if (lower.startsWith("jr")) return "Jr.";
        if (lower.startsWith("sr")) return "Sr.";
        return core.toUpperCase();
      }
      if (NAME_PARTICLES.has(lower) && idx > 0) return lower;
      if (isInitial(core) || /^[a-z]$/i.test(core)) return normalizeInitialToken(core);
      return toTitleCaseWord(core);
    })
    .filter(Boolean)
    .join(" ");
}

function extractEtAlLabel(rawChunk: string): string | null {
  const cleaned = rawChunk
    .replace(/^[,;|&\s]+/, " ")
    .replace(/^\s*and\s+/i, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;

  const match = cleaned.match(/^(.+?)\s+et\s+al\.?$/i);
  if (!match) return null;

  const lead = formatPersonName(match[1].replace(/[;,]+$/g, "").trim());
  if (!lead) return null;
  return `${lead} et al.`;
}

export function extractAuthors(raw: string): string[] {
  if (!raw) return [];
  const base = String(raw).trim();
  if (!base || base.toLowerCase() === "nan") return [];

  const directEtAl = extractEtAlLabel(base);
  if (directEtAl && !/[;|&]/.test(base)) return [directEtAl];

  const cleaned = normalizeAuthorText(base)
    .replace(/\s*(?:;|&|\|)\s*/g, " | ")
    .replace(/\s+/g, " ")
    .trim();

  const primaryChunks = cleaned
    .split(/\s*\|\s*/)
    .map((chunk) => chunk.replace(/^[,;|&\s]+/, "").replace(/^\s*and\s+/i, "").trim())
    .filter(Boolean);

  const chunks: string[] = [];
  primaryChunks.forEach((chunk) => {
    if (AFFILIATION_PATTERN.test(chunk)) {
      chunks.push(chunk);
      return;
    }

    const byComma = chunk
      .replace(new RegExp(`,\\s+(?=${SUFFIX_REGEX_PART}\\b)`, "gi"), ", ")
      .split(new RegExp(`,\\s+(?!${SUFFIX_REGEX_PART}\\b)(?=[A-ZÀ-ÖØ-Þ])`, "g"))
      .map((part) => part.trim())
      .filter(Boolean);

    byComma.forEach((part) => {
      const byAnd = part
        .split(/\s+\band\b\s+/i)
        .map((s) => s.trim())
        .filter(Boolean);
      chunks.push(...byAnd);
    });
  });

  const seen = new Set<string>();
  const out: string[] = [];

  chunks.forEach((chunk) => {
    const etAl = extractEtAlLabel(chunk);
    const candidate = etAl ?? extractNameFromChunk(chunk);
    if (!candidate) return;

    const formatted = etAl ?? formatPersonName(candidate);
    if (!formatted) return;

    const key = formatted.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(formatted);
  });

  return out;
}

function normalizeTypeRaw(raw: unknown): string {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const TYPE_PATTERNS = {
  tutorial: /\b(tutorial|primer)\b/i,
  review: /\b(book review|review article|review essay|reflections and reviews|meta[- ]analysis|systematic review|literature review|survey)\b/i,
  commentary: /\b(commentary|counterpoint|discussion|dialogue|forum|rejoinder|response|reply|editorial|point-counterpoint|point)\b/i,
  note: /\b(research note|research notes|technical note|short communication|shorter paper|shorter papers|short research article|research report|invited research note|keynote address|keynote addresses|authors'? reply|author'?s reply)\b/i,
  researchArticle:
    /\b(research article|research articles|articles|article|original articles?|originalpaper|main articles|regular article|regular articles|regular|paper|invited research paper|additional articles|other articles|decade award invited article)\b/i,
  specialIssue: /\b(special issue|special research forum|special topic forum|thematic issue|special section)\b/i
};

const BLANK_TYPE_TEXT_PATTERNS = {
  tutorial: /\b(tutorial|primer)\b/i,
  review: /\b(book review|review article|review essay|meta[- ]analysis|systematic review|literature review|survey|state of the art|research prospects)\b/i,
  note: /\b(research note|technical note|research report|short communication|brief report|authors'? reply|author'?s reply|letter to)\b/i,
  commentary:
    /\b(commentary|editorial|editor'?s note|editor'?s comments|rejoinder|counterpoint|point-counterpoint|response|reply|forum|about our authors|research commentary|om forum)\b/i
};

export function classifyTypeMain(rawType: unknown, title: string, abstract: string, journal: string): string {
  const raw = normalizeTypeRaw(rawType);
  const text = `${title ?? ""} ${abstract ?? ""}`.toLowerCase();

  if (!raw || raw === "nan" || raw === "n/a" || raw === "na" || raw === "none" || raw === "-") {
    if (BLANK_TYPE_INFER_JOURNALS.has((journal ?? "").trim())) {
      if (BLANK_TYPE_TEXT_PATTERNS.tutorial.test(text)) return "Tutorial";
      if (BLANK_TYPE_TEXT_PATTERNS.note.test(text)) return "Research Note / Short";
      if (BLANK_TYPE_TEXT_PATTERNS.commentary.test(text)) return "Commentary / Forum / Debate";
      if (BLANK_TYPE_TEXT_PATTERNS.review.test(text)) return "Review";
      return "Research Article";
    }
    return "Unknown";
  }

  if (TYPE_PATTERNS.tutorial.test(raw)) return "Tutorial";
  if (TYPE_PATTERNS.note.test(raw)) return "Research Note / Short";
  if (TYPE_PATTERNS.commentary.test(raw)) return "Commentary / Forum / Debate";
  if (TYPE_PATTERNS.review.test(raw)) return "Review";
  if (TYPE_PATTERNS.specialIssue.test(raw)) return "Research Article";
  if (TYPE_PATTERNS.researchArticle.test(raw)) return "Research Article";
  return "Other";
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

function parseRowRecords(records: Record<string, string>[]): ParsedRow[] {
  // Parse once and attach normalized helper fields used by filters/aggregations.
  return records.map((row) => {
    const title = row.title?.trim() ?? "";
    const abstract = row.abstract?.trim() ?? "";
    const author = row.author?.trim() ?? "";
    const journal = row.journal?.trim() ?? "";
    const keywordsRaw = row.keywords ?? "";
    const typeRaw = row.type?.trim() ?? "";
    const typeMain = classifyTypeMain(typeRaw, title, abstract, journal);

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
      type: typeMain,
      type_raw: typeRaw,
      type_main: typeMain,
      journal,
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

export function parseCsvText(text: string): ParsedRow[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true
  });
  return parseRowRecords(parsed.data);
}

function resolvePublicUrl(url: string): string {
  if (!url) return url;
  if (/^(https?:)?\/\//.test(url) || url.startsWith("data:")) return url;
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");
  if (!basePath || !url.startsWith("/")) return url;
  if (url === basePath || url.startsWith(`${basePath}/`)) return url;
  return `${basePath}${url}`;
}

export async function loadCsvFromUrl(url: string): Promise<ParsedRow[]> {
  const response = await fetch(resolvePublicUrl(url));
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  return parseCsvText(text);
}

type RuntimeRowsManifest = {
  schema: string[];
  files: Array<{ year: number; path: string; rows: number; bytes: number }>;
  total_rows: number;
};

type RuntimeRowsChunk = {
  year: number;
  rows: string[][];
};

function toRecord(schema: string[], row: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  schema.forEach((key, idx) => {
    out[key] = row[idx] ?? "";
  });
  return out;
}

export async function loadRuntimeRowsFromUrl(manifestUrl = "/data/runtime_rows_manifest.json"): Promise<ParsedRow[]> {
  const manifestRes = await fetch(resolvePublicUrl(manifestUrl));
  if (!manifestRes.ok) {
    throw new Error(`Failed to fetch runtime rows manifest: ${manifestRes.status} ${manifestRes.statusText}`);
  }
  const manifest = (await manifestRes.json()) as RuntimeRowsManifest;
  const schema = manifest.schema ?? [];
  if (!schema.length || !manifest.files?.length) {
    throw new Error("Runtime rows manifest is missing schema or files.");
  }

  const chunks = await Promise.all(
    [...manifest.files]
      .sort((a, b) => a.year - b.year)
      .map(async (file): Promise<RuntimeRowsChunk> => {
        const res = await fetch(resolvePublicUrl(file.path));
        if (!res.ok) {
          throw new Error(`Failed to fetch runtime rows chunk ${file.path}: ${res.status} ${res.statusText}`);
        }
        return (await res.json()) as RuntimeRowsChunk;
      })
  );

  const records: Record<string, string>[] = [];
  chunks.forEach((chunk) => {
    chunk.rows.forEach((row) => {
      records.push(toRecord(schema, row));
    });
  });

  return parseRowRecords(records);
}

export async function loadCsvFromFile(file: File): Promise<ParsedRow[]> {
  const text = await file.text();
  return parseCsvText(text);
}
