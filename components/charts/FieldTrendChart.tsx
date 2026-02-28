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
    legend: { type: "plain", top: 0, left: "center" },
    grid: { left: 70, right: 20, top: 72, bottom: 28 },
    xAxis: { type: "category", data: years },
    yAxis: {
      type: "value",
      name: yLabel,
      nameLocation: "middle",
      nameGap: 52
    },
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
