"use client";

type Props = {
  label: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
};

export function DualRange({ label, min, max, value, onChange }: Props) {
  const [from, to] = value;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
        <span>{label}</span>
        <span>
          {from} - {to}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={from}
          onChange={(e) => onChange([Math.min(Number(e.target.value), to), to])}
          className="w-full"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={to}
          onChange={(e) => onChange([from, Math.max(Number(e.target.value), from)])}
          className="w-full"
        />
      </div>
    </div>
  );
}