"use client";

import type { Filters } from "@/lib/types";
import { MultiSelect } from "@/components/ui/MultiSelect";
import type { MultiSelectOption } from "@/components/ui/MultiSelect";
import { DualRange } from "@/components/ui/DualRange";

type Props = {
  filters: Filters;
  years: [number, number];
  journals: MultiSelectOption[];
  fields: string[];
  types: MultiSelectOption[];
  onFilters: (partial: Partial<Filters>) => void;
  onReset: () => void;
};

export function SidebarFilters({
  filters,
  years,
  journals,
  fields,
  types,
  onFilters,
  onReset
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
          rangeClassName="accent-pink-500"
        />

        <div>
          <div className="label mb-1">Discipline</div>
          <MultiSelect value={filters.fields} options={fields} onChange={(fields) => onFilters({ fields })} />
        </div>

        <div>
          <div className="label mb-1">Journal</div>
          <MultiSelect value={filters.journals} options={journals} onChange={(journals) => onFilters({ journals })} />
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
          <button className="btn-secondary w-full" onClick={onReset}>
            Reset Filters
          </button>
        </div>
      </div>
    </aside>
  );
}
