"use client";

import { useEffect, useMemo, useState } from "react";
import { computeAuthorRanking, getAuthorDetail } from "@/lib/aggregate";
import type { AuthorStat, ParsedRow, RankedPaper } from "@/lib/types";
import { EChart } from "@/components/charts/EChart";
import { journalFullName } from "@/lib/journals";

type Props = {
  rows: ParsedRow[];
  minPubs: number;
  selectedAuthor: string | null;
  onMinPubs: (n: number) => void;
  onSelectAuthor: (author: string | null) => void;
};

export function AuthorsSection({ rows, minPubs, selectedAuthor, onMinPubs, onSelectAuthor }: Props) {
  const [visibleCount, setVisibleCount] = useState(20);
  const [detailVisibleCount, setDetailVisibleCount] = useState(5);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [explaining, setExplaining] = useState<RankedPaper | null>(null);
  const [pendingPaperId, setPendingPaperId] = useState<string | null>(null);
  const ranking = useMemo(() => computeAuthorRanking(rows, minPubs), [rows, minPubs]);
  const detail = useMemo(() => (selectedAuthor ? getAuthorDetail(rows, selectedAuthor) : null), [rows, selectedAuthor]);
  const visibleRanking = ranking.slice(0, visibleCount);
  const hasMore = visibleCount < ranking.length;
  const timelinePoints = useMemo(() => {
    if (!detail) return [];
    return detail.ranked
      .map((paper, rankedIndex) => ({
        rankedIndex,
        year: paper.year,
        score: paper.woke_score,
        citation: citationLabel(paper)
      }))
      .sort((a, b) => a.year - b.year || a.score - b.score || a.rankedIndex - b.rankedIndex);
  }, [detail]);
  const yearDomain = useMemo(() => {
    if (!timelinePoints.length) return { min: 2000, max: 2024, interval: 1 };
    const years = timelinePoints.map((p) => p.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    if (minYear === maxYear) {
      return { min: minYear - 1, max: maxYear + 1, interval: 1 };
    }
    const span = maxYear - minYear;
    const interval = Math.max(1, Math.ceil(span / 10));
    return { min: minYear, max: maxYear, interval };
  }, [timelinePoints]);

  useEffect(() => {
    setVisibleCount(20);
  }, [rows, minPubs]);

  useEffect(() => {
    setDetailVisibleCount(5);
    setExpandedIds({});
    setExplaining(null);
    setPendingPaperId(null);
  }, [selectedAuthor]);

  useEffect(() => {
    if (!pendingPaperId) return;
    const el = document.getElementById(pendingPaperId);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setPendingPaperId(null);
  }, [pendingPaperId, detailVisibleCount, detail]);

  const option = detail
    ? {
        tooltip: {
          trigger: "item",
          formatter: (p: any) => `${p?.data?.citation ?? ""} ${formatScoreLabel(Number(p?.data?.score ?? 0))}`
        },
        xAxis: {
          type: "value",
          name: "Year",
          minInterval: 1,
          interval: yearDomain.interval,
          min: yearDomain.min,
          max: yearDomain.max,
          axisLabel: {
            formatter: (value: number) => String(Math.round(value))
          },
          axisPointer: {
            label: {
              formatter: (params: any) => String(Math.round(Number(params?.value ?? 0)))
            }
          }
        },
        yAxis: { type: "value", min: 1, max: 10 },
        series: [
          {
            type: "scatter",
            symbolSize: 8,
            data: timelinePoints.map((p) => ({
              value: [p.year, p.score],
              score: p.score,
              citation: p.citation,
              rankedIndex: p.rankedIndex,
              itemStyle: { color: scoreDotColor(p.score) }
            }))
          }
        ]
      }
    : null;

  return (
    <section className="panel p-4" id="authors">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">Author Woke Meter</h3>
        <div className="flex items-center gap-2 text-sm">
          <span>Min pubs: {minPubs}</span>
          <input type="range" min={1} max={20} value={minPubs} onChange={(e) => onMinPubs(Number(e.target.value))} />
        </div>
      </div>

      <div className="space-y-3">
        {visibleRanking.map((r, idx) => (
          <button
            key={r.author}
            className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
            onClick={() => onSelectAuthor(r.author)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 shrink-0 pt-0.5 text-right text-sm font-semibold text-slate-500">#{idx + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <div className="truncate text-sm font-semibold text-slate-900 md:text-base">{r.author}</div>
                    <div className="text-xs font-medium text-slate-600"># papers: {r.count}</div>
                  </div>
                  <div className={`rounded px-2 py-1 text-xs font-semibold ${scoreClass(r.mean)}`}>
                    Mean: {r.mean.toFixed(2)}
                  </div>
                </div>
                <AuthorMeanCiMeter stat={r} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="mt-4">
          <button className="btn-secondary w-full md:w-auto" onClick={() => setVisibleCount((n) => n + 20)}>
            More
          </button>
        </div>
      )}

      {selectedAuthor && detail && option && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/35 p-4">
          <div className="panel max-h-[90vh] w-full max-w-5xl overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-lg font-semibold">{selectedAuthor}</h4>
              <button className="btn-secondary" onClick={() => onSelectAuthor(null)}>
                Close
              </button>
            </div>
            <EChart
              option={option}
              height={240}
              onEvents={{
                click: (params: any) => {
                  const rankedIndex = Number(params?.data?.rankedIndex);
                  if (!Number.isFinite(rankedIndex) || rankedIndex < 0) return;
                  const needed = Math.ceil((rankedIndex + 1) / 5) * 5;
                  setDetailVisibleCount((n) => Math.max(n, needed));
                  setPendingPaperId(`author-paper-${rankedIndex}`);
                }
              }}
            />
            <div className="mt-4">
              <div className="mb-2 font-semibold">Top papers</div>
              <div className="space-y-3">
                {detail.ranked.slice(0, detailVisibleCount).map((paper, idx) => {
                  const id = `author-paper-${idx}`;
                  const expanded = Boolean(expandedIds[id]);
                  const abstractText = paper.abstract.trim() || "No abstract available.";
                  const shortAbstract =
                    abstractText.length > 220 ? `${abstractText.slice(0, 220).trimEnd()}...` : abstractText;
                  return (
                    <article id={id} key={id} className="rounded-lg border border-slate-200 bg-white p-4">
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
                      <div className="mt-1 text-sm font-semibold text-slate-900">
                        Journal: {paper.journal ? journalFullName(paper.journal) : "-"}
                      </div>
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
                          <button
                            className="ml-2 text-teal-700 underline"
                            onClick={() => setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))}
                          >
                            {expanded ? "show less" : "show more"}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              {detailVisibleCount < detail.ranked.length && (
                <div className="mt-4">
                  <button className="btn-secondary w-full md:w-auto" onClick={() => setDetailVisibleCount((n) => n + 5)}>
                    More
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {explaining && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
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
              {explaining.keywords.length ? explaining.keywords.slice(0, 20).join(", ") : "None"}
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

function AuthorMeanCiMeter({ stat }: { stat: AuthorStat }) {
  const ciLow = toScalePercent(stat.ci95Low);
  const ciHigh = toScalePercent(stat.ci95High);
  const mean = toScalePercent(stat.mean);
  const ciWidth = Math.max(1.5, ciHigh - ciLow);
  const summary = `Mean ${stat.mean.toFixed(4)} | 95% CI ${stat.ci95Low.toFixed(4)} - ${stat.ci95High.toFixed(4)}`;

  return (
    <div className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-2">
      <div className="relative h-6">
        <div className="absolute top-1/2 h-0.5 w-full -translate-y-1/2 bg-slate-300" />
        <div
          className={`group absolute top-1/2 h-1.5 -translate-y-1/2 cursor-help rounded ${meterClass(stat.mean)}`}
          style={{ left: `${ciLow}%`, width: `${ciWidth}%` }}
          title={summary}
          aria-label={summary}
        >
          <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-[11px] text-white group-hover:block">
            {summary}
          </div>
        </div>
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-slate-500"
          style={{ left: `${ciLow}%` }}
        />
        <div
          className="pointer-events-none absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-slate-500"
          style={{ left: `${ciHigh}%` }}
        />
        <div className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-slate-900" style={{ left: `${mean}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>1</span>
        <span>10</span>
      </div>
    </div>
  );
}

function toScalePercent(value: number): number {
  const clamped = Math.min(10, Math.max(1, value));
  return ((clamped - 1) / 9) * 100;
}

function meterClass(score: number): string {
  if (score >= 9) return "bg-red-700/70";
  if (score >= 8) return "bg-red-600/65";
  if (score >= 7) return "bg-red-500/60";
  if (score >= 6) return "bg-red-300/65";
  if (score >= 5) return "bg-orange-200/75";
  if (score >= 4) return "bg-sky-200/80";
  if (score >= 3) return "bg-blue-300/75";
  return "bg-blue-500/70";
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

function scoreDotColor(score: number): string {
  if (score >= 9) return "#b91c1c";
  if (score >= 8) return "#dc2626";
  if (score >= 7) return "#ef4444";
  if (score >= 6) return "#fca5a5";
  if (score >= 5) return "#fed7aa";
  if (score >= 4) return "#bae6fd";
  if (score >= 3) return "#93c5fd";
  return "#3b82f6";
}

function citationLabel(paper: RankedPaper): string {
  const first = paper.authorsList[0] ?? "Unknown";
  const trimmedFirst = first.trim();

  if (!trimmedFirst) return `(Unknown, ${paper.year})`;
  if (/et\s+al\.?$/i.test(trimmedFirst)) return `(${trimmedFirst}, ${paper.year})`;

  const surname = surnameFromAuthor(trimmedFirst);
  if (paper.authorsList.length > 1) return `(${surname} et al., ${paper.year})`;
  return `(${surname}, ${paper.year})`;
}

function surnameFromAuthor(author: string): string {
  const withoutSuffix = author.replace(/\bet\s+al\.?$/i, "").trim();
  const tokens = withoutSuffix.split(/\s+/).filter(Boolean);
  if (!tokens.length) return "Unknown";
  const raw = tokens[tokens.length - 1];
  const cleaned = raw.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ'’-]/g, "");
  return cleaned || raw;
}

function formatScoreLabel(score: number): string {
  if (!Number.isFinite(score)) return "";
  if (Number.isInteger(score)) return String(score);
  return score.toFixed(2);
}
