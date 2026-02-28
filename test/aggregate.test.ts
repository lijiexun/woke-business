import { describe, expect, it } from "vitest";
import { computeJournalTrend, movingAverage } from "../lib/aggregate";
import type { ParsedRow } from "../lib/types";

describe("movingAverage", () => {
  it("returns original values for window 1", () => {
    expect(movingAverage([1, 2, 3], 1)).toEqual([1, 2, 3]);
  });

  it("computes centered moving average", () => {
    const out = movingAverage([1, 2, 3, 4, 5], 3);
    expect(out.map((n) => Number(n.toFixed(4)))).toEqual([1.5, 2, 3, 4, 4.5]);
  });
});

describe("computeJournalTrend", () => {
  const base = {
    vol: "",
    iss: "",
    author: "",
    title: "",
    abstract: "",
    url: "",
    type: "Research Article",
    type_raw: "article",
    type_main: "Research Article",
    field: "Accounting",
    keywords: "",
    justification: "",
    keywordsList: [],
    authorsList: [],
    searchText: ""
  } satisfies Omit<ParsedRow, "year" | "journal" | "woke_score">;

  it("supports z-score normalization within each journal", () => {
    const rows: ParsedRow[] = [
      { ...base, year: 2020, journal: "J1", woke_score: 2 },
      { ...base, year: 2021, journal: "J1", woke_score: 4 },
      { ...base, year: 2020, journal: "J2", woke_score: 6 },
      { ...base, year: 2021, journal: "J2", woke_score: 8 }
    ];

    const raw = computeJournalTrend(rows, false);
    const norm = computeJournalTrend(rows, true);

    expect(raw.series.find((s) => s.journal === "J1")?.points.map((p) => p.value)).toEqual([2, 4]);
    expect(raw.series.find((s) => s.journal === "J2")?.points.map((p) => p.value)).toEqual([6, 8]);
    expect(norm.series.find((s) => s.journal === "J1")?.points.map((p) => Number((p.value ?? 0).toFixed(6)))).toEqual([
      -1, 1
    ]);
    expect(norm.series.find((s) => s.journal === "J2")?.points.map((p) => Number((p.value ?? 0).toFixed(6)))).toEqual([
      -1, 1
    ]);
  });
});
