"use client";

import { useEffect, useMemo, useRef } from "react";
import { SidebarFilters } from "@/components/layout/SidebarFilters";
import { TopNav } from "@/components/layout/TopNav";
import { SummaryStrip } from "@/components/SummaryStrip";
import { OverallTrendChart } from "@/components/charts/OverallTrendChart";
import { FieldTrendChart } from "@/components/charts/FieldTrendChart";
import { JournalTrendChart } from "@/components/charts/JournalTrendChart";
import type { MultiSelectOption } from "@/components/ui/MultiSelect";
import { AuthorsSection } from "@/components/sections/AuthorsSection";
import { JournalRankingSection } from "@/components/sections/JournalRankingSection";
import { KeywordsSection } from "@/components/sections/KeywordsSection";
import { WordCloudSection } from "@/components/sections/WordCloudSection";
import {
  computeFieldTrend,
  computeJournalTrend,
  computeYearStats,
  dataSummary,
  filterRows,
  topKeywords
} from "@/lib/aggregate";
import { rainbowColorByRank } from "@/lib/keywordColor";
import { loadCsvFromUrl, loadRuntimeRowsFromUrl } from "@/lib/parse";
import { useDataStore } from "@/store/useDataStore";

export default function HomePage() {
  const store = useDataStore();
  const initializedRef = useRef(false);
  const prevNavRef = useRef(store.activeNav);

  useEffect(() => {
    if (initializedRef.current || store.rawRows.length) return;
    initializedRef.current = true;
    store.setLoading(true);
    loadRuntimeRowsFromUrl("/data/runtime_rows_manifest.json")
      .then((rows) => {
        if (!rows.length) throw new Error("Primary runtime JSON resolved to zero rows.");
        store.setRows(rows);
      })
      .catch(() =>
        loadCsvFromUrl("/api/utd-csv")
          .then((rows) => {
            if (!rows.length) throw new Error("CSV fallback resolved to zero rows.");
            store.setRows(rows);
          })
          .catch(() =>
            loadCsvFromUrl("/sample.csv")
              .then((rows) => {
                if (!rows.length) throw new Error("Sample dataset resolved to zero rows.");
                store.setRows(rows);
              })
              .catch(() => store.setError("Failed to load runtime JSON, full CSV route, and /public/sample.csv."))
          )
      )
      .finally(() => store.setLoading(false));
  }, [store.rawRows.length, store.setError, store.setLoading, store.setRows]);

  const years = useMemo<[number, number]>(() => {
    if (!store.rawRows.length) return [2000, 2024];
    const arr = store.rawRows.map((r) => r.year);
    return [Math.min(...arr), Math.max(...arr)];
  }, [store.rawRows]);

  const options = useMemo(() => {
    const journals = [...new Set(store.rawRows.map((r) => r.journal).filter(Boolean))].sort();
    const fields = [...new Set(store.rawRows.map((r) => r.field).filter(Boolean))].sort();
    const typeCounts = new Map<string, number>();

    store.rawRows.forEach((row) => {
      const type = row.type.trim();
      if (!type) return;
      typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    });

    const entries = [...typeCounts.entries()];
    const sorted = entries
      .filter(([type]) => type !== "Other")
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

    const other = entries.find(([type]) => type === "Other");
    if (other) sorted.push(other);

    const types: MultiSelectOption[] = sorted.map(([type]) => ({
      value: type,
      label: type
    }));

    return { journals, fields, types };
  }, [store.rawRows]);

  const fieldConstrainedRows = useMemo(
    () =>
      store.filters.fields.length
        ? store.rawRows.filter((row) => store.filters.fields.includes(row.field))
        : store.rawRows,
    [store.rawRows, store.filters.fields]
  );

  const availableJournalsByField = useMemo(
    () => new Set(fieldConstrainedRows.map((r) => r.journal).filter(Boolean)),
    [fieldConstrainedRows]
  );
  const availableTypesByField = useMemo(
    () => new Set(fieldConstrainedRows.map((r) => r.type).filter(Boolean)),
    [fieldConstrainedRows]
  );

  const journalOptions = useMemo(
    () =>
      options.journals.map((journal) => ({
        value: journal,
        label: journal,
        disabled: store.filters.fields.length > 0 && !availableJournalsByField.has(journal)
      })),
    [options.journals, store.filters.fields.length, availableJournalsByField]
  );

  const typeOptions = useMemo(
    () =>
      options.types.map((type) => ({
        ...type,
        disabled: store.filters.fields.length > 0 && !availableTypesByField.has(type.value)
      })),
    [options.types, store.filters.fields.length, availableTypesByField]
  );

  useEffect(() => {
    if (!store.filters.fields.length) return;

    const nextJournals = store.filters.journals.filter((journal) => availableJournalsByField.has(journal));
    const nextTypes = store.filters.types.filter((type) => availableTypesByField.has(type));
    if (nextJournals.length === store.filters.journals.length && nextTypes.length === store.filters.types.length) return;

    store.setFilters({
      journals: nextJournals,
      types: nextTypes
    });
  }, [
    store.filters.fields.length,
    store.filters.journals,
    store.filters.types,
    availableJournalsByField,
    availableTypesByField,
    store.setFilters
  ]);

  const filteredRows = useMemo(() => filterRows(store.rawRows, store.filters), [store.rawRows, store.filters]);
  const filteredJournals = useMemo(
    () => [...new Set(filteredRows.map((r) => r.journal).filter(Boolean))].sort(),
    [filteredRows]
  );
  const summary = useMemo(() => dataSummary(filteredRows, store.filters), [filteredRows, store.filters]);

  const overallStats = useMemo(() => computeYearStats(filteredRows), [filteredRows]);
  const journalTrend = useMemo(
    () => computeJournalTrend(filteredRows, store.journalMode === "zscore"),
    [filteredRows, store.journalMode]
  );

  const fieldTrend = useMemo(
    () => computeFieldTrend(filteredRows, store.fieldMode === "zscore"),
    [filteredRows, store.fieldMode]
  );

  useEffect(() => {
    const prevNav = prevNavRef.current;
    if (store.activeNav === "keywords" && prevNav !== "keywords") {
      const rankedKeywords = topKeywords(filteredRows, 500);
      const topKeyword = rankedKeywords[0]?.keyword ?? "";
      store.setSelectedKeyword(topKeyword);
      store.setSelectedKeywordColor(rainbowColorByRank(0, Math.max(1, rankedKeywords.length)));
    }
    prevNavRef.current = store.activeNav;
  }, [store.activeNav, filteredRows, store.setSelectedKeyword, store.setSelectedKeywordColor]);

  return (
    <main className="mx-auto max-w-[1600px] p-4">
      <TopNav active={store.activeNav} onChange={store.setActiveNav} />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <SidebarFilters
          filters={store.filters}
          years={years}
          journals={journalOptions}
          fields={options.fields}
          types={typeOptions}
          onFilters={store.setFilters}
          onReset={store.resetFilters}
        />

        <section>
          <SummaryStrip {...summary} />

          {store.loading && <div className="panel mb-4 p-4">Loading dataset...</div>}
          {store.error && <div className="panel mb-4 border-red-200 p-4 text-red-700">{store.error}</div>}

          {store.activeNav === "overview" && (
            <section className="panel p-4" id="overview">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h3 className="section-title">Overall Trend Chart</h3>
                <select
                  className="select max-w-52"
                  value={String(store.smoothing)}
                  onChange={(e) => {
                    const next = e.target.value === "none" ? "none" : Number(e.target.value);
                    store.setSmoothing(next as "none" | 3 | 5);
                  }}
                >
                  <option value="none">No smoothing</option>
                  <option value="3">3-year MA</option>
                  <option value="5">5-year MA</option>
                </select>
              </div>
              <OverallTrendChart
                stats={overallStats}
                smoothing={store.smoothing}
              />
            </section>
          )}

          {store.activeNav === "journals" && (
            <div className="space-y-4">
              <section className="panel p-4">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="section-title">Journal Trend Comparison</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={store.journalMode === "raw"}
                      onChange={() => store.setJournalMode("raw")}
                    />
                    Raw
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      checked={store.journalMode === "zscore"}
                      onChange={() => store.setJournalMode("zscore")}
                    />
                    Z-score within journal
                  </label>
                </div>
                <JournalTrendChart
                  years={journalTrend.years}
                  series={journalTrend.series}
                  yLabel={store.journalMode === "raw" ? "Mean woke score" : "Z-score"}
                />
              </section>
              <JournalRankingSection
                globalRows={filteredRows}
                journal={store.selectedJournalForRanking || filteredJournals[0] || ""}
                journals={filteredJournals}
                onJournal={store.setSelectedJournalForRanking}
              />
            </div>
          )}

          {store.activeNav === "fields" && (
            <section className="panel p-4" id="fields">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h3 className="section-title">Discipline Trend Comparison</h3>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={store.fieldMode === "raw"}
                    onChange={() => store.setFieldMode("raw")}
                  />
                  Raw
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={store.fieldMode === "zscore"}
                    onChange={() => store.setFieldMode("zscore")}
                  />
                  Z-score within discipline
                </label>
              </div>
              <FieldTrendChart
                years={fieldTrend.years}
                series={fieldTrend.series}
                yLabel={store.fieldMode === "raw" ? "Mean woke score" : "Z-score"}
              />
            </section>
          )}

          {store.activeNav === "authors" && (
            <AuthorsSection
              rows={filteredRows}
              minPubs={store.authorMinPubs}
              selectedAuthor={store.selectedAuthor}
              onMinPubs={store.setAuthorMinPubs}
              onSelectAuthor={store.setSelectedAuthor}
            />
          )}

          {store.activeNav === "keywords" && (
            <div className="space-y-4">
              <WordCloudSection
                rows={filteredRows}
                onKeywordClick={(keyword, color) => {
                  store.setSelectedKeyword(keyword);
                  store.setSelectedKeywordColor(color);
                }}
              />
              <KeywordsSection
                rows={filteredRows}
                selectedKeyword={store.selectedKeyword}
                selectedKeywordColor={store.selectedKeywordColor}
                metric={store.keywordMetric}
                onKeyword={(keyword) => {
                  store.setSelectedKeyword(keyword);
                  store.setSelectedKeywordColor("");
                }}
                onMetric={store.setKeywordMetric}
                onYearClick={(year) => store.setFilters({ yearRange: [year, year] })}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
