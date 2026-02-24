"use client";

import { useMemo, useState } from "react";
import { computeEmergingKeywords, computeKeywordCloud } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";
import { TagCloud } from "@/components/charts/TagCloud";

type Props = {
  rows: ParsedRow[];
  mode: "journal" | "field" | "emerging";
  splitYear: number;
  journals: string[];
  fields: string[];
  onMode: (mode: "journal" | "field" | "emerging") => void;
  onSplitYear: (year: number) => void;
  onKeywordClick: (keyword: string) => void;
};

export function WordCloudSection({
  rows,
  mode,
  splitYear,
  journals,
  fields,
  onMode,
  onSplitYear,
  onKeywordClick
}: Props) {
  const [journal, setJournal] = useState(journals[0] ?? "");
  const [field, setField] = useState(fields[0] ?? "");

  const words = useMemo(() => {
    if (mode === "journal") {
      return computeKeywordCloud(rows.filter((r) => r.journal === journal), 80);
    }
    if (mode === "field") {
      return computeKeywordCloud(rows.filter((r) => r.field === field), 80);
    }
    return computeEmergingKeywords(rows, splitYear, 80);
  }, [rows, mode, journal, field, splitYear]);

  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="section-title">Word Clouds</h3>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "journal"} onChange={() => onMode("journal")} />
          By journal
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "field"} onChange={() => onMode("field")} />
          By field
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="radio" checked={mode === "emerging"} onChange={() => onMode("emerging")} />
          Emerging
        </label>

        {mode === "journal" && (
          <select className="select max-w-52" value={journal} onChange={(e) => setJournal(e.target.value)}>
            {journals.map((j) => (
              <option key={j}>{j}</option>
            ))}
          </select>
        )}
        {mode === "field" && (
          <select className="select max-w-52" value={field} onChange={(e) => setField(e.target.value)}>
            {fields.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        )}
        {mode === "emerging" && (
          <label className="text-sm">
            Split year: {splitYear}
            <input
              className="ml-2"
              type="range"
              min={2001}
              max={2023}
              value={splitYear}
              onChange={(e) => onSplitYear(Number(e.target.value))}
            />
          </label>
        )}
      </div>
      <TagCloud words={words} onClick={onKeywordClick} />
    </section>
  );
}