"use client";

import { useEffect, useMemo, useState } from "react";
import type { ParsedRow } from "@/lib/types";

type Props = {
  globalRows: ParsedRow[];
  journal: string;
  journals: string[];
  onJournal: (journal: string) => void;
};

export function JournalRankingSection({
  globalRows,
  journal,
  journals,
  onJournal
}: Props) {
  const [visibleCount, setVisibleCount] = useState(10);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [explaining, setExplaining] = useState<ParsedRow | null>(null);

  const rankedRows = useMemo(
    () => [...globalRows.filter((r) => r.journal === journal)].sort((a, b) => b.woke_score - a.woke_score),
    [globalRows, journal]
  );

  useEffect(() => {
    if (journals.length && !journals.includes(journal)) {
      onJournal(journals[0]);
    }
  }, [journals, journal, onJournal]);

  useEffect(() => {
    setVisibleCount(10);
    setExpandedIds({});
  }, [journal, globalRows.length]);

  const visibleRows = rankedRows.slice(0, visibleCount);
  const hasMore = visibleCount < rankedRows.length;

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
      </div>

      <div className="mb-2 text-sm text-slate-600">Matched papers: {rankedRows.length}</div>

      <div className="space-y-3">
        {visibleRows.map((paper, idx) => {
          const id = `${paper.title}-${paper.year}-${idx}`;
          const expanded = Boolean(expandedIds[id]);
          const abstractText = paper.abstract.trim() || "No abstract available.";
          const shortAbstract =
            abstractText.length > 220 ? `${abstractText.slice(0, 220).trimEnd()}...` : abstractText;
          return (
            <article key={id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="text-sm text-slate-500">#{idx + 1}</div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className={`rounded px-2 py-1 text-sm font-semibold ${scoreClass(paper.woke_score)}`}>
                    Woke score: {paper.woke_score}
                  </div>
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-violet-300 bg-violet-100 text-lg font-bold leading-none text-violet-700 hover:bg-violet-200"
                    onClick={() => setExplaining(paper)}
                    aria-label="Explain woke score"
                    title="Explain"
                  >
                    ?
                  </button>
                </div>
              </div>

              <h4 className="text-base font-semibold text-slate-900">
                {paper.url ? (
                  <a href={paper.url} target="_blank" rel="noreferrer" className="text-slate-900 underline">
                    {paper.title}
                  </a>
                ) : (
                  paper.title
                )}
              </h4>
              <div className="mt-1 text-sm text-slate-600">
                Year: {paper.year} | Volume: {paper.vol || "-"} | Issue: {paper.iss || "-"}
              </div>
              <div className="mt-1 text-sm text-slate-700">
                {paper.authorsList.length ? paper.authorsList.join(", ") : "No listed authors"}
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <span className="font-semibold text-slate-900">Abstract: </span>
                {expanded ? abstractText : shortAbstract}
                {abstractText.length > 220 && (
                  <button className="ml-2 text-teal-700 underline" onClick={() => toggleExpanded(id)}>
                    {expanded ? "show less" : "show more"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="mt-4">
          <button className="btn-secondary w-full md:w-auto" onClick={() => setVisibleCount((n) => n + 10)}>
            More
          </button>
        </div>
      )}

      {explaining && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-4 shadow-xl">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div className={`rounded px-2 py-1 text-sm font-semibold ${scoreClass(explaining.woke_score)}`}>
                Woke Score: {explaining.woke_score}
              </div>
              <button className="btn-secondary" onClick={() => setExplaining(null)}>
                Close
              </button>
            </div>
            <div className="mb-1 text-sm font-semibold text-slate-900">Title</div>
            <div className="mb-3 text-base font-semibold text-slate-900">{explaining.title}</div>
            <div className="mb-2 text-sm">
              <span className="font-semibold">Signal words: </span>
              {explaining.keywordsList.length ? explaining.keywordsList.slice(0, 20).join(", ") : "None"}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-semibold text-slate-900">Explanation: </span>
              {explaining.justification || "No explanation available."}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function scoreClass(score: number): string {
  if (score >= 9) return "bg-red-700 text-white";
  if (score >= 8) return "bg-red-600 text-white";
  if (score >= 7) return "bg-red-500 text-white";
  if (score >= 6) return "bg-red-300 text-red-900";
  if (score >= 5) return "bg-orange-200 text-orange-900";
  if (score >= 4) return "bg-sky-200 text-sky-900";
  if (score >= 3) return "bg-blue-300 text-blue-900";
  return "bg-blue-500 text-white";
}
