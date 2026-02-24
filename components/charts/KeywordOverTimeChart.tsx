"use client";

import { EChart } from "@/components/charts/EChart";

export function KeywordOverTimeChart({
  keyword,
  points,
  metric,
  onYearClick
}: {
  keyword: string;
  points: Array<{ year: number; count: number; normalizedPer1k: number }>;
  metric: "raw" | "normalized";
  onYearClick?: (year: number) => void;
}) {
  const years = points.map((p) => p.year);
  const values = metric === "raw" ? points.map((p) => p.count) : points.map((p) => p.normalizedPer1k);

  const option = {
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const p = points[idx];
        return `Year: ${p.year}<br/>Count: ${p.count}<br/>Per 1k papers: ${p.normalizedPer1k.toFixed(2)}`;
      }
    },
    xAxis: { type: "category", data: years },
    yAxis: { type: "value", name: metric === "raw" ? "Count" : "Per 1k" },
    grid: { left: 45, right: 20, top: 25, bottom: 30 },
    series: [
      {
        name: keyword,
        type: "bar",
        itemStyle: { color: "#0f766e" },
        data: values
      }
    ]
  };

  return (
    <EChart
      option={option}
      height={360}
      onEvents={{
        click: (params: any) => {
          const year = years[params?.dataIndex ?? -1];
          if (onYearClick && year) onYearClick(year);
        }
      }}
    />
  );
}