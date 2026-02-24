"use client";

import { useEffect, useMemo, useRef } from "react";
import { SidebarFilters } from "@/components/layout/SidebarFilters";
import { TopNav } from "@/components/layout/TopNav";
import { SummaryStrip } from "@/components/SummaryStrip";
import { OverallTrendChart } from "@/components/charts/OverallTrendChart";
import { JournalYearHeatmap } from "@/components/charts/JournalYearHeatmap";
import { FieldTrendChart } from "@/components/charts/FieldTrendChart";
import { AuthorsSection } from "@/components/sections/AuthorsSection";
import { JournalRankingSection } from "@/components/sections/JournalRankingSection";
import { KeywordsSection } from "@/components/sections/KeywordsSection";
import { WordCloudSection } from "@/components/sections/WordCloudSection";
import {
  computeFieldTrend,
  computeJournalYearHeatmap,
  computeYearStats,
  dataSummary,
  filterRows
} from "@/lib/aggregate";
import { loadCsvFromFile, loadCsvFromUrl } from "@/lib/parse";
import { useDataStore } from "@/store/useDataStore";

export default function HomePage() {
  const store = useDataStore();
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || store.rawRows.length) return;
    initializedRef.current = true;
    store.setLoading(true);
    loadCsvFromUrl("/sample.csv")
      .then((rows) => store.setRows(rows))
      .catch(() => store.setError("Failed to load /public/sample.csv. Please upload a CSV."))
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
    const types = [...new Set(store.rawRows.map((r) => r.type).filter(Boolean))].sort();
    return { journals, fields, types };
  }, [store.rawRows]);

  const filteredRows = useMemo(() => filterRows(store.rawRows, store.filters), [store.rawRows, store.filters]);
  const summary = useMemo(() => dataSummary(filteredRows, store.filters), [filteredRows, store.filters]);

  const overallStats = useMemo(() => computeYearStats(filteredRows), [filteredRows]);
  const heatmap = useMemo(
    () => computeJournalYearHeatmap(filteredRows, store.heatmapSortByMean),
    [filteredRows, store.heatmapSortByMean]
  );
  const fieldTrend = useMemo(
    () => computeFieldTrend(filteredRows, store.fieldMode === "zscore"),
    [filteredRows, store.fieldMode]
  );

  const exportFiltered = () => {
    const columns = [
      "year",
      "vol",
      "iss",
      "author",
      "title",
      "abstract",
      "url",
      "type",
      "journal",
      "field",
      "woke_score",
      "keywords",
      "justification"
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replaceAll("\"", "\"\"")}"`;
    const lines = [columns.join(",")];
    filteredRows.forEach((r) => {
      lines.push(columns.map((c) => escape((r as Record<string, unknown>)[c])).join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "filtered_utd_scores.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleJournalDrilldown = (journal: string) => {
    const exists = store.filters.journals.includes(journal);
    store.setFilters({ journals: exists ? store.filters.journals.filter((j) => j !== journal) : [journal] });
    store.setSelectedJournalForRanking(journal);
    store.setActiveNav("journals");
  };

  return (
    <main className="mx-auto max-w-[1600px] p-4">
      <TopNav active={store.activeNav} onChange={store.setActiveNav} />

      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <SidebarFilters
          filters={store.filters}
          years={years}
          journals={options.journals}
          fields={options.fields}
          types={options.types}
          onFilters={store.setFilters}
          onReset={store.resetFilters}
          onExport={exportFiltered}
          onFile={(file) => {
            store.setLoading(true);
            loadCsvFromFile(file)
              .then((rows) => store.setRows(rows))
              .catch(() => store.setError("Unable to parse CSV."))
              .finally(() => store.setLoading(false));
          }}
        />

        <section>
          <SummaryStrip {...summary} />

          {store.loading && <div className="panel mb-4 p-4">Loading dataset...</div>}
          {store.error && <div className="panel mb-4 border-red-200 p-4 text-red-700">{store.error}</div>}

          {store.activeNav === "overview" && (
            <div className="space-y-4">
              <section className="panel p-4" id="overview">
                <div className="mb-3 flex flex-wrap items-center gap-3">
                  <h3 className="section-title">Overall Trend Chart</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={store.showMedian} onChange={(e) => store.setShowMedian(e.target.checked)} />
                    Median
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={store.showIqr} onChange={(e) => store.setShowIqr(e.target.checked)} />
                    IQR Band
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={store.showP90} onChange={(e) => store.setShowP90(e.target.checked)} />
                    P90
                  </label>
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
                  showMedian={store.showMedian}
                  showP90={store.showP90}
                  showIqr={store.showIqr}
                  smoothing={store.smoothing}
                />
              </section>

              <section className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="section-title">Journal x Year Heatmap</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={store.heatmapSortByMean}
                      onChange={(e) => store.setHeatmapSortByMean(e.target.checked)}
                    />
                    Sort journals by filtered mean
                  </label>
                </div>
                <JournalYearHeatmap data={heatmap} onJournalClick={handleJournalDrilldown} />
              </section>
            </div>
          )}

          {store.activeNav === "journals" && (
            <div className="space-y-4">
              <section className="panel p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="section-title">Journal x Year Heatmap</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={store.heatmapSortByMean}
                      onChange={(e) => store.setHeatmapSortByMean(e.target.checked)}
                    />
                    Sort journals by filtered mean
                  </label>
                </div>
                <JournalYearHeatmap data={heatmap} onJournalClick={handleJournalDrilldown} />
              </section>
              <JournalRankingSection
                globalRows={filteredRows}
                rawRows={store.rawRows}
                journal={store.selectedJournalForRanking || options.journals[0] || ""}
                journals={options.journals}
                scope={store.rankingScope}
                yearRange={store.filters.yearRange}
                onJournal={store.setSelectedJournalForRanking}
                onScope={store.setRankingScope}
              />
            </div>
          )}

          {store.activeNav === "fields" && (
            <section className="panel p-4" id="fields">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <h3 className="section-title">Field Trend Comparison</h3>
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
                  Z-score within field
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
              <KeywordsSection
                rows={filteredRows}
                selectedKeyword={store.selectedKeyword}
                metric={store.keywordMetric}
                onKeyword={store.setSelectedKeyword}
                onMetric={store.setKeywordMetric}
                onYearClick={(year) => store.setFilters({ yearRange: [year, year] })}
              />
              <WordCloudSection
                rows={filteredRows}
                mode={store.wordCloudMode}
                splitYear={store.splitYear}
                journals={options.journals}
                fields={options.fields}
                onMode={store.setWordCloudMode}
                onSplitYear={store.setSplitYear}
                onKeywordClick={(keyword) => store.setSelectedKeyword(keyword)}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
