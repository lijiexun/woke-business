"use client";

import dynamic from "next/dynamic";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export function EChart({ option, height = 420, onEvents }: { option: Record<string, unknown>; height?: number; onEvents?: Record<string, (params: unknown) => void> }) {
  return <ReactECharts option={option} style={{ height }} notMerge lazyUpdate onEvents={onEvents} />;
}