"use client";

import { EChart } from "@/components/charts/EChart";

function splitEvenly<T>(items: T[], rows: number): T[][] {
  if (rows <= 1 || items.length <= 1) return [items];
  const base = Math.floor(items.length / rows);
  const extra = items.length % rows;
  const out: T[][] = [];
  let start = 0;
  for (let i = 0; i < rows; i += 1) {
    const size = base + (i < extra ? 1 : 0);
    out.push(items.slice(start, start + size));
    start += size;
  }
  return out.filter((r) => r.length);
}

export function JournalTrendChart({
  years,
  series,
  yLabel
}: {
  years: number[];
  series: Array<{ journal: string; points: Array<{ year: number; value: number | null }> }>;
  yLabel: string;
}) {
  const names = series.map((s) => s.journal);
  const rowCount = names.length > 18 ? 3 : names.length > 8 ? 2 : 1;
  const legendRows = splitEvenly(names, rowCount);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const year = params?.[0]?.axisValueLabel ?? "";
        const lines = [`Year: ${year}`];
        (params ?? []).forEach((p) => {
          const value = typeof p.value === "number" ? p.value.toFixed(4) : "N/A";
          lines.push(`${p.marker ?? ""}${p.seriesName}: ${value}`);
        });
        return lines.join("<br/>");
      }
    },
    legend: legendRows.map((row, idx) => ({
      type: "plain",
      orient: "horizontal",
      top: idx * 24,
      left: "center",
      itemGap: 14,
      data: row
    })),
    grid: { left: 70, right: 20, top: 56 + rowCount * 24, bottom: 28 },
    xAxis: { type: "category", data: years },
    yAxis: {
      type: "value",
      name: yLabel,
      nameLocation: "middle",
      nameGap: 52
    },
    series: series.map((s) => ({
      name: s.journal,
      type: "line",
      smooth: true,
      connectNulls: true,
      data: s.points.map((p) => p.value)
    }))
  };

  return <EChart option={option} height={420} />;
}
