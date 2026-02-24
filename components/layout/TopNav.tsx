"use client";

type Props = {
  active: "overview" | "journals" | "fields" | "authors" | "keywords";
  onChange: (value: Props["active"]) => void;
};

const items: Props["active"][] = ["overview", "journals", "fields", "authors", "keywords"];

export function TopNav({ active, onChange }: Props) {
  return (
    <nav className="panel sticky top-0 z-10 mb-4 flex flex-wrap items-center justify-between gap-2 p-3">
      <h1 className="text-xl font-bold text-slate-900">Woke Business</h1>
      <div className="flex gap-2">
        {items.map((item) => (
          <button
            key={item}
            className={active === item ? "btn-primary" : "btn-secondary"}
            onClick={() => onChange(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>
    </nav>
  );
}
