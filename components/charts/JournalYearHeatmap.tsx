"use client";

import { EChart } from "@/components/charts/EChart";

type HeatmapData = {
  years: number[];
  journals: string[];
  cells: Array<{ x: number; y: number; value: number; count: number; journal: string; year: number }>;
};

export function JournalYearHeatmap({ data, onJournalClick }: { data: HeatmapData; onJournalClick: (journal: string) => void }) {
  const option = {
    tooltip: {
      formatter: (p: any) => {
        const [x, y, v, c] = p.data;
        return `Journal: ${data.journals[y]}<br/>Year: ${data.years[x]}<br/>Mean: ${Number(v).toFixed(2)}<br/>Count: ${c}`;
      }
    },
    grid: { top: 30, bottom: 40, left: 110, right: 20 },
    xAxis: { type: "category", data: data.years },
    yAxis: { type: "category", data: data.journals },
    visualMap: {
      min: 1,
      max: 10,
      calculable: true,
      orient: "horizontal",
      left: "center",
      bottom: 0
    },
    series: [
      {
        type: "heatmap",
        data: data.cells.map((cell) => [cell.x, cell.y, Number(cell.value.toFixed(3)), cell.count]),
        emphasis: { itemStyle: { borderColor: "#0f766e", borderWidth: 1 } }
      }
    ]
  };

  return (
    <EChart
      option={option}
      height={500}
      onEvents={{
        click: (params: any) => {
          const y = params?.data?.[1];
          const journal = data.journals[y];
          if (journal) onJournalClick(journal);
        }
      }}
    />
  );
}