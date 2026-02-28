"use client";

import type { YearStat } from "@/lib/types";
import { movingAverage } from "@/lib/aggregate";
import { EChart } from "@/components/charts/EChart";

type Props = {
  stats: YearStat[];
  smoothing: "none" | 3 | 5;
};

const SCORE_COLORS = [
  "#1d4ed8",
  "#2563eb",
  "#3b82f6",
  "#60a5fa",
  "#93c5fd",
  "#fca5a5",
  "#f87171",
  "#ef4444",
  "#dc2626",
  "#b91c1c"
];

function scoreToColor(value: number): string {
  const clamped = Math.min(10, Math.max(1, value));
  const idx = Math.min(SCORE_COLORS.length - 1, Math.max(0, Math.round(clamped) - 1));
  return SCORE_COLORS[idx];
}

export function OverallTrendChart({ stats, smoothing }: Props) {
  const years = stats.map((s) => s.year);
  const mean = stats.map((s) => s.mean);
  const ci95Low = stats.map((s) => s.ci95Low);
  const ci95High = stats.map((s) => s.ci95High);

  const smoothedMean = smoothing === "none" ? mean : movingAverage(mean, smoothing);
  const smoothedCi95Low = smoothing === "none" ? ci95Low : movingAverage(ci95Low, smoothing);
  const smoothedCi95High = smoothing === "none" ? ci95High : movingAverage(ci95High, smoothing);
  const ci95Diff = smoothedCi95High.map((high, idx) => Math.max(0, high - smoothedCi95Low[idx]));
  const yValues = [...smoothedMean, ...smoothedCi95Low, ...smoothedCi95High];
  const rawMin = yValues.length ? Math.min(...yValues) : 1;
  const rawMax = yValues.length ? Math.max(...yValues) : 10;
  const spread = Math.max(rawMax - rawMin, 0.6);
  const pad = spread * 0.2;
  const yMin = Math.max(1, Number((rawMin - pad).toFixed(2)));
  const yMax = Math.min(10, Number((rawMax + pad).toFixed(2)));

  const scoreGradient = {
    type: "linear",
    x: 0,
    y: 1,
    x2: 0,
    y2: 0,
    colorStops: [
      { offset: 0, color: "#1d4ed8" },
      { offset: 0.5, color: "#93c5fd" },
      { offset: 0.7, color: "#fca5a5" },
      { offset: 1, color: "#b91c1c" }
    ]
  };

  const option = {
    animationDuration: 400,
    tooltip: {
      trigger: "axis",
      formatter: (params: any[]) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const s = stats[idx];
        const lines = [
          `Year: ${s.year}`,
          `Papers: ${s.count}`,
          `Mean: ${s.mean.toFixed(2)}`
        ];
        lines.push(`95% Interval: ${s.ci95Low.toFixed(2)} - ${s.ci95High.toFixed(2)}`);
        return lines.join("<br/>");
      }
    },
    legend: { top: 0, data: ["Mean", "95% Interval"] },
    grid: { left: 36, right: 20, top: 42, bottom: 28 },
    xAxis: { type: "category", data: years },
    yAxis: {
      type: "value",
      min: yMin,
      max: yMax,
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            "rgba(29, 78, 216, 0.04)",
            "rgba(37, 99, 235, 0.035)",
            "rgba(59, 130, 246, 0.03)",
            "rgba(96, 165, 250, 0.025)",
            "rgba(147, 197, 253, 0.02)",
            "rgba(252, 165, 165, 0.02)",
            "rgba(248, 113, 113, 0.025)",
            "rgba(239, 68, 68, 0.03)",
            "rgba(220, 38, 38, 0.035)",
            "rgba(185, 28, 28, 0.04)"
          ]
        }
      }
    },
    series: [
      {
        name: "95% Lower",
        type: "line",
        stack: "ci95",
        lineStyle: { opacity: 0 },
        symbol: "none",
        data: smoothedCi95Low,
        tooltip: { show: false },
        emphasis: { disabled: true }
      },
      {
        name: "95% Interval",
        type: "line",
        stack: "ci95",
        lineStyle: { opacity: 0 },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 1,
            x2: 0,
            y2: 0,
            colorStops: [
              { offset: 0, color: "rgba(29, 78, 216, 0.18)" },
              { offset: 0.5, color: "rgba(148, 163, 184, 0.12)" },
              { offset: 1, color: "rgba(185, 28, 28, 0.18)" }
            ]
          }
        },
        symbol: "none",
        data: ci95Diff
      },
      {
        name: "Mean",
        type: "line",
        smooth: true,
        lineStyle: { width: 3, color: scoreGradient },
        itemStyle: {
          color: (params: any) => scoreToColor(Number(params.value))
        },
        symbolSize: 6,
        data: smoothedMean
      }
    ]
  };

  return <EChart option={option} height={420} />;
}
