"use client";

import type { YearStat } from "@/lib/types";
import { movingAverage } from "@/lib/aggregate";
import { EChart } from "@/components/charts/EChart";

type Props = {
  stats: YearStat[];
  showMedian: boolean;
  showP90: boolean;
  showIqr: boolean;
  smoothing: "none" | 3 | 5;
};

export function OverallTrendChart({ stats, showMedian, showP90, showIqr, smoothing }: Props) {
  const years = stats.map((s) => s.year);
  const mean = stats.map((s) => s.mean);
  const median = stats.map((s) => s.median);
  const p90 = stats.map((s) => s.p90);
  const p25 = stats.map((s) => s.p25);
  const iqrDiff = stats.map((s) => s.p75 - s.p25);

  const smoothedMean = smoothing === "none" ? mean : movingAverage(mean, smoothing);
  const smoothedMedian = smoothing === "none" ? median : movingAverage(median, smoothing);
  const smoothedP90 = smoothing === "none" ? p90 : movingAverage(p90, smoothing);

  const option = {
    animationDuration: 400,
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const s = stats[idx];
        return [
          `Year: ${s.year}`,
          `Papers: ${s.count}`,
          `Mean: ${s.mean.toFixed(2)}`,
          `Median: ${s.median.toFixed(2)}`,
          `P25: ${s.p25.toFixed(2)} | P75: ${s.p75.toFixed(2)}`,
          `P90: ${s.p90.toFixed(2)}`
        ].join("<br/>");
      }
    },
    legend: { top: 0 },
    grid: { left: 36, right: 20, top: 40, bottom: 28 },
    xAxis: { type: "category", data: years },
    yAxis: { type: "value", min: 1, max: 10 },
    series: [
      showIqr
        ? {
            name: "P25 Baseline",
            type: "line",
            stack: "iqr",
            lineStyle: { opacity: 0 },
            symbol: "none",
            data: p25
          }
        : null,
      showIqr
        ? {
            name: "IQR",
            type: "line",
            stack: "iqr",
            lineStyle: { opacity: 0 },
            areaStyle: { color: "rgba(20, 184, 166, 0.16)" },
            symbol: "none",
            data: iqrDiff
          }
        : null,
      {
        name: "Mean",
        type: "line",
        smooth: true,
        lineStyle: { width: 3, color: "#0f766e" },
        symbolSize: 6,
        data: smoothedMean
      },
      showMedian
        ? {
            name: "Median",
            type: "line",
            smooth: true,
            lineStyle: { width: 2, color: "#475569", type: "dashed" },
            symbolSize: 4,
            data: smoothedMedian
          }
        : null,
      showP90
        ? {
            name: "P90",
            type: "line",
            smooth: true,
            lineStyle: { width: 2, color: "#b45309" },
            symbolSize: 4,
            data: smoothedP90
          }
        : null
    ].filter(Boolean)
  };

  return <EChart option={option} height={420} />;
}