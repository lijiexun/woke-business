"use client";

import { useMemo } from "react";
import { computeAuthorRanking, getAuthorDetail } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";
import { EChart } from "@/components/charts/EChart";

type Props = {
  rows: ParsedRow[];
  minPubs: number;
  selectedAuthor: string | null;
  onMinPubs: (n: number) => void;
  onSelectAuthor: (author: string | null) => void;
};

export function AuthorsSection({ rows, minPubs, selectedAuthor, onMinPubs, onSelectAuthor }: Props) {
  const ranking = useMemo(() => computeAuthorRanking(rows, minPubs), [rows, minPubs]);
  const detail = useMemo(() => (selectedAuthor ? getAuthorDetail(rows, selectedAuthor) : null), [rows, selectedAuthor]);

  const option = detail
    ? {
        tooltip: { trigger: "item" },
        xAxis: { type: "category", data: detail.timeline.map((p) => p.year) },
        yAxis: { type: "value", min: 1, max: 10 },
        series: [
          {
            type: "scatter",
            data: detail.timeline.map((p) => p.score),
            itemStyle: { color: "#0f766e" }
          }
        ]
      }
    : null;

  return (
    <section className="panel p-4" id="authors">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="section-title">Author Woke Index</h3>
        <div className="flex items-center gap-2 text-sm">
          <span>Min pubs: {minPubs}</span>
          <input type="range" min={1} max={20} value={minPubs} onChange={(e) => onMinPubs(Number(e.target.value))} />
        </div>
      </div>

      <div className="max-h-96 overflow-auto rounded border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 bg-slate-100 text-left">
            <tr>
              <th className="p-2">Author</th>
              <th className="p-2">Count</th>
              <th className="p-2">Mean</th>
              <th className="p-2">Stdev</th>
            </tr>
          </thead>
          <tbody>
            {ranking.slice(0, 300).map((r) => (
              <tr key={r.author} className="cursor-pointer border-t hover:bg-teal-50" onClick={() => onSelectAuthor(r.author)}>
                <td className="p-2">{r.author}</td>
                <td className="p-2">{r.count}</td>
                <td className="p-2">{r.mean.toFixed(2)}</td>
                <td className="p-2">{r.stdev.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedAuthor && detail && option && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/35 p-4">
          <div className="panel max-h-[90vh] w-full max-w-5xl overflow-auto p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-lg font-semibold">{selectedAuthor}</h4>
              <button className="btn-secondary" onClick={() => onSelectAuthor(null)}>
                Close
              </button>
            </div>
            <EChart option={option} height={240} />
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1 font-semibold">Top 5 papers</div>
                <ul className="space-y-2 text-sm">
                  {detail.top.map((p) => (
                    <li key={`${p.title}-${p.year}`} className="rounded border p-2">
                      <div className="font-medium">{p.title}</div>
                      <div>{p.year} | score {p.woke_score}</div>
                      {p.url && (
                        <a className="text-teal-700 underline" href={p.url} target="_blank" rel="noreferrer">
                          Open URL
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 font-semibold">Bottom 5 papers</div>
                <ul className="space-y-2 text-sm">
                  {detail.bottom.map((p) => (
                    <li key={`${p.title}-${p.year}`} className="rounded border p-2">
                      <div className="font-medium">{p.title}</div>
                      <div>{p.year} | score {p.woke_score}</div>
                      {p.url && (
                        <a className="text-teal-700 underline" href={p.url} target="_blank" rel="noreferrer">
                          Open URL
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}