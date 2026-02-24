"use client";

type Props = {
  rows: number;
  mean: number;
  median: number;
  selectedYears: string;
  selectedJournalsCount: number;
  selectedFieldsCount: number;
};

export function SummaryStrip({ rows, mean, median, selectedYears, selectedJournalsCount, selectedFieldsCount }: Props) {
  const cards = [
    ["Rows", rows.toLocaleString()],
    ["Mean Score", mean.toFixed(2)],
    ["Median Score", median.toFixed(2)],
    ["Years", selectedYears],
    ["Journal Filters", selectedJournalsCount.toString()],
    ["Field Filters", selectedFieldsCount.toString()]
  ];

  return (
    <section className="panel mb-4 grid grid-cols-2 gap-3 p-3 md:grid-cols-6">
      {cards.map(([label, value]) => (
        <div key={label}>
          <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
          <div className="text-lg font-semibold text-slate-900">{value}</div>
        </div>
      ))}
    </section>
  );
}