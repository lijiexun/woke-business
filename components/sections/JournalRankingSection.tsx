"use client";

import { useMemo } from "react";
import { computeJournalInternalRanking } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";

type Props = {
  globalRows: ParsedRow[];
  rawRows: ParsedRow[];
  journal: string;
  journals: string[];
  scope: "global" | "year_journal";
  yearRange: [number, number];
  onJournal: (journal: string) => void;
  onScope: (scope: "global" | "year_journal") => void;
};

export function JournalRankingSection({
  globalRows,
  rawRows,
  journal,
  journals,
  scope,
  yearRange,
  onJournal,
  onScope
}: Props) {
  const scopedRows = useMemo(() => {
    if (scope === "global") return globalRows;
    return rawRows.filter((r) => r.journal === journal && r.year >= yearRange[0] && r.year <= yearRange[1]);
  }, [scope, globalRows, rawRows, journal, yearRange]);

  const ranking = useMemo(() => computeJournalInternalRanking(scopedRows, journal), [scopedRows, journal]);

  return (
    <section className="panel p-4" id="journals">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="section-title">Journal Internal Ranking</h3>
        <select value={journal} className="select max-w-64" onChange={(e) => onJournal(e.target.value)}>
          {journals.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={scope === "global"} onChange={() => onScope("global")} />
          Use global filters
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={scope === "year_journal"} onChange={() => onScope("year_journal")} />
          Only year range + journal
        </label>
      </div>

      <div className="mb-2 text-sm text-slate-600">Matched papers: {ranking.count}</div>
      <div className="grid gap-4 md:grid-cols-2">
        <PaperList title="Top 10" papers={ranking.top} />
        <PaperList title="Bottom 10" papers={ranking.bottom} />
      </div>
    </section>
  );
}

function PaperList({
  title,
  papers
}: {
  title: string;
  papers: Array<{ year: number; woke_score: number; title: string; keywords: string[]; justification: string; url: string }>;
}) {
  return (
    <div>
      <h4 className="mb-2 font-semibold">{title}</h4>
      <div className="max-h-96 space-y-2 overflow-auto">
        {papers.map((p, i) => (
          <article key={`${p.title}-${i}`} className="rounded border border-slate-200 p-2 text-sm">
            <div className="font-medium">{p.title}</div>
            <div className="text-slate-600">
              {p.year} | score {p.woke_score}
            </div>
            <div className="mt-1 text-xs">{p.keywords.slice(0, 8).join(", ")}</div>
            <div className="mt-1 line-clamp-3 text-xs text-slate-700">{p.justification}</div>
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer" className="mt-1 inline-block text-teal-700 underline">
                Open URL
              </a>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}