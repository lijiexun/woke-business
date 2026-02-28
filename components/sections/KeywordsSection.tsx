"use client";

import { useMemo } from "react";
import { computeKeywordOverTime, topKeywords } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";
import { KeywordOverTimeChart } from "@/components/charts/KeywordOverTimeChart";
import { rainbowColorByRank } from "@/lib/keywordColor";

type Props = {
  rows: ParsedRow[];
  selectedKeyword: string;
  selectedKeywordColor: string;
  metric: "raw" | "normalized";
  precomputedSeries?: Record<string, Array<{ year: number; count: number; per1k: number }>>;
  onKeyword: (value: string) => void;
  onMetric: (value: "raw" | "normalized") => void;
  onYearClick: (year: number) => void;
};

export function KeywordsSection({
  rows,
  selectedKeyword,
  selectedKeywordColor,
  metric,
  precomputedSeries,
  onKeyword,
  onMetric,
  onYearClick
}: Props) {
  const options = useMemo(() => {
    if (!precomputedSeries) return topKeywords(rows, 500);
    return Object.entries(precomputedSeries)
      .map(([keyword, series]) => ({
        keyword,
        count: series.reduce((acc, p) => acc + p.count, 0)
      }))
      .sort((a, b) => b.count - a.count);
  }, [rows, precomputedSeries]);

  const hasSelected = selectedKeyword ? options.some((o) => o.keyword === selectedKeyword) : false;
  const activeKeyword = hasSelected ? selectedKeyword : options[0]?.keyword || "";
  const activeKeywordRank = activeKeyword ? options.findIndex((o) => o.keyword === activeKeyword) : -1;
  const fallbackColor = rainbowColorByRank(Math.max(0, activeKeywordRank), Math.max(1, options.length));
  const chartColor = hasSelected && selectedKeywordColor ? selectedKeywordColor : fallbackColor;
  const points = useMemo(() => {
    if (!activeKeyword) return [];
    if (precomputedSeries) {
      return (precomputedSeries[activeKeyword] ?? []).map((p) => ({
        year: p.year,
        count: p.count,
        normalizedPer1k: p.per1k
      }));
    }
    return computeKeywordOverTime(rows, activeKeyword);
  }, [rows, activeKeyword, precomputedSeries]);

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
        <KeywordOverTimeChart
          keyword={activeKeyword}
          points={points}
          metric={metric}
          color={chartColor}
          onYearClick={onYearClick}
        />
      ) : (
        <div className="text-sm text-slate-600">No keyword available for current filters.</div>
      )}
    </section>
  );
}
