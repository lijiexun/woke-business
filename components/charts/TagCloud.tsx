"use client";

export function TagCloud({
  words,
  onClick
}: {
  words: Array<{ text: string; value: number; earlyRate?: number; lateRate?: number }>;
  onClick?: (word: string) => void;
}) {
  const max = words.length ? Math.max(...words.map((w) => w.value)) : 1;

  return (
    <div className="panel min-h-56 p-4">
      <div className="flex flex-wrap gap-2">
        {words.map((w) => {
          const size = 12 + (w.value / max) * 24;
          return (
            <button
              key={w.text}
              className="rounded bg-teal-50 px-2 py-1 text-left text-teal-900 hover:bg-teal-100"
              style={{ fontSize: `${size}px` }}
              title={w.earlyRate != null ? `Early ${w.earlyRate.toFixed(2)} / Late ${w.lateRate?.toFixed(2)}` : `${w.value}`}
              onClick={() => onClick?.(w.text)}
            >
              {w.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}