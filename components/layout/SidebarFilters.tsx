"use client";

import type { Filters } from "@/lib/types";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { DualRange } from "@/components/ui/DualRange";

type Props = {
  filters: Filters;
  years: [number, number];
  journals: string[];
  fields: string[];
  types: string[];
  onFilters: (partial: Partial<Filters>) => void;
  onReset: () => void;
  onFile: (file: File) => void;
  onExport: () => void;
};

export function SidebarFilters({
  filters,
  years,
  journals,
  fields,
  types,
  onFilters,
  onReset,
  onFile,
  onExport
}: Props) {
  return (
    <aside className="panel sticky top-16 h-[calc(100vh-5rem)] overflow-auto p-4">
      <h2 className="section-title mb-4">Global Filters</h2>

      <div className="space-y-4">
        <DualRange
          label="Year range"
          min={years[0]}
          max={years[1]}
          value={filters.yearRange}
          onChange={(yearRange) => onFilters({ yearRange })}
        />

        <DualRange
          label="Woke score"
          min={1}
          max={10}
          value={filters.scoreRange}
          onChange={(scoreRange) => onFilters({ scoreRange })}
        />

        <div>
          <div className="label mb-1">Journal</div>
          <MultiSelect value={filters.journals} options={journals} onChange={(journals) => onFilters({ journals })} />
        </div>

        <div>
          <div className="label mb-1">Field</div>
          <MultiSelect value={filters.fields} options={fields} onChange={(fields) => onFilters({ fields })} />
        </div>

        <div>
          <div className="label mb-1">Type</div>
          <MultiSelect value={filters.types} options={types} onChange={(types) => onFilters({ types })} />
        </div>

        <div>
          <div className="label mb-1">Text Search</div>
          <input
            className="input"
            placeholder="title or abstract"
            value={filters.textQuery}
            onChange={(e) => onFilters({ textQuery: e.target.value })}
          />
        </div>

        <div>
          <div className="label mb-1">Load CSV</div>
          <input
            type="file"
            accept=".csv,text/csv"
            className="input"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFile(file);
            }}
          />
        </div>

        <div className="flex gap-2">
          <button className="btn-secondary w-full" onClick={onReset}>
            Reset Filters
          </button>
          <button className="btn-primary w-full" onClick={onExport}>
            Export CSV
          </button>
        </div>
      </div>
    </aside>
  );
}