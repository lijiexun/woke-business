"use client";

import { useMemo } from "react";
import { computeKeywordOverTime, topKeywords } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";
import { KeywordOverTimeChart } from "@/components/charts/KeywordOverTimeChart";

type Props = {
  rows: ParsedRow[];
  selectedKeyword: string;
  metric: "raw" | "normalized";
  onKeyword: (value: string) => void;
  onMetric: (value: "raw" | "normalized") => void;
  onYearClick: (year: number) => void;
};

export function KeywordsSection({ rows, selectedKeyword, metric, onKeyword, onMetric, onYearClick }: Props) {
  const options = useMemo(() => topKeywords(rows, 500), [rows]);
  const activeKeyword = selectedKeyword || options[0]?.keyword || "";
  const points = useMemo(() => (activeKeyword ? computeKeywordOverTime(rows, activeKeyword) : []), [rows, activeKeyword]);

  return (
    <section className="panel p-4" id="keywords">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="section-title">Keyword Frequency Over Time</h3>
        <input
          list="keyword-options"
          className="input max-w-64"
          placeholder="Select keyword"
          value={activeKeyword}
          onChange={(e) => onKeyword(e.target.value.toLowerCase())}
        />
        <datalist id="keyword-options">
          {options.map((k) => (
            <option key={k.keyword} value={k.keyword} />
          ))}
        </datalist>

        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={metric === "raw"} onChange={() => onMetric("raw")} />
          Raw counts
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={metric === "normalized"} onChange={() => onMetric("normalized")} />
          Per 1k
        </label>
      </div>

      {activeKeyword ? (
        <KeywordOverTimeChart keyword={activeKeyword} points={points} metric={metric} onYearClick={onYearClick} />
      ) : (
        <div className="text-sm text-slate-600">No keyword available for current filters.</div>
      )}
    </section>
  );
}