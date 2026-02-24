"use client";

import { EChart } from "@/components/charts/EChart";

export function FieldTrendChart({
  years,
  series,
  yLabel
}: {
  years: number[];
  series: Array<{ field: string; points: Array<{ year: number; value: number | null }> }>;
  yLabel: string;
}) {
  const option = {
    tooltip: { trigger: "axis" },
    legend: { type: "scroll", top: 0 },
    grid: { left: 42, right: 20, top: 48, bottom: 28 },
    xAxis: { type: "category", data: years },
    yAxis: { type: "value", name: yLabel },
    series: series.map((s) => ({
      name: s.field,
      type: "line",
      smooth: true,
      connectNulls: true,
      data: s.points.map((p) => p.value)
    }))
  };

  return <EChart option={option} height={420} />;
}