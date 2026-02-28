"use client";

import { useMemo } from "react";
import { computeKeywordCloud } from "@/lib/aggregate";
import type { ParsedRow } from "@/lib/types";
import { TagCloud } from "@/components/charts/TagCloud";

type Props = {
  rows: ParsedRow[];
  onKeywordClick: (keyword: string, color: string) => void;
};

export function WordCloudSection({
  rows,
  onKeywordClick
}: Props) {
  const words = useMemo(() => computeKeywordCloud(rows, 80), [rows]);

  return (
    <section className="panel p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <h3 className="section-title">Word Cloud</h3>
      </div>
      <TagCloud words={words} onClick={onKeywordClick} />
    </section>
  );
}
