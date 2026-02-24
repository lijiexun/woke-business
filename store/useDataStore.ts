"use client";

import { create } from "zustand";
import type { Filters, ParsedRow } from "@/lib/types";

type SmoothingMode = "none" | 3 | 5;
type FieldMode = "raw" | "zscore";
type KeywordMetric = "raw" | "normalized";
type RankingScope = "global" | "year_journal";
type WordCloudMode = "journal" | "field" | "emerging";

type DataState = {
  rawRows: ParsedRow[];
  filters: Filters;
  authorMinPubs: number;
  selectedAuthor: string | null;
  selectedKeyword: string;
  selectedJournalForRanking: string;
  rankingScope: RankingScope;
  splitYear: number;
  heatmapSortByMean: boolean;
  showMedian: boolean;
  showP90: boolean;
  showIqr: boolean;
  smoothing: SmoothingMode;
  fieldMode: FieldMode;
  keywordMetric: KeywordMetric;
  wordCloudMode: WordCloudMode;
  activeNav: "overview" | "journals" | "fields" | "authors" | "keywords";
  loading: boolean;
  error: string;
  setRows: (rows: ParsedRow[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  setFilters: (partial: Partial<Filters>) => void;
  resetFilters: () => void;
  setAuthorMinPubs: (value: number) => void;
  setSelectedAuthor: (value: string | null) => void;
  setSelectedKeyword: (value: string) => void;
  setSelectedJournalForRanking: (value: string) => void;
  setRankingScope: (value: RankingScope) => void;
  setSplitYear: (value: number) => void;
  setHeatmapSortByMean: (value: boolean) => void;
  setShowMedian: (value: boolean) => void;
  setShowP90: (value: boolean) => void;
  setShowIqr: (value: boolean) => void;
  setSmoothing: (value: SmoothingMode) => void;
  setFieldMode: (value: FieldMode) => void;
  setKeywordMetric: (value: KeywordMetric) => void;
  setWordCloudMode: (value: WordCloudMode) => void;
  setActiveNav: (value: DataState["activeNav"]) => void;
};

const baseFilters: Filters = {
  yearRange: [2000, 2024],
  scoreRange: [1, 10],
  journals: [],
  fields: [],
  types: [],
  textQuery: ""
};

export const useDataStore = create<DataState>((set, get) => ({
  rawRows: [],
  filters: baseFilters,
  authorMinPubs: 5,
  selectedAuthor: null,
  selectedKeyword: "",
  selectedJournalForRanking: "",
  rankingScope: "global",
  splitYear: 2011,
  heatmapSortByMean: false,
  showMedian: true,
  showP90: false,
  showIqr: true,
  smoothing: "none",
  fieldMode: "raw",
  keywordMetric: "raw",
  wordCloudMode: "journal",
  activeNav: "overview",
  loading: false,
  error: "",

  setRows: (rows) => {
    const years = rows.map((r) => r.year);
    const minYear = years.length ? Math.min(...years) : 2000;
    const maxYear = years.length ? Math.max(...years) : 2024;
    const firstJournal = rows[0]?.journal ?? "";
    set({
      rawRows: rows,
      filters: { ...get().filters, yearRange: [minYear, maxYear], scoreRange: [1, 10] },
      selectedJournalForRanking: firstJournal,
      error: ""
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  setFilters: (partial) => set({ filters: { ...get().filters, ...partial } }),

  resetFilters: () => {
    const rows = get().rawRows;
    const years = rows.map((r) => r.year);
    const minYear = years.length ? Math.min(...years) : 2000;
    const maxYear = years.length ? Math.max(...years) : 2024;
    set({ filters: { ...baseFilters, yearRange: [minYear, maxYear] } });
  },

  setAuthorMinPubs: (authorMinPubs) => set({ authorMinPubs }),
  setSelectedAuthor: (selectedAuthor) => set({ selectedAuthor }),
  setSelectedKeyword: (selectedKeyword) => set({ selectedKeyword }),
  setSelectedJournalForRanking: (selectedJournalForRanking) => set({ selectedJournalForRanking }),
  setRankingScope: (rankingScope) => set({ rankingScope }),
  setSplitYear: (splitYear) => set({ splitYear }),
  setHeatmapSortByMean: (heatmapSortByMean) => set({ heatmapSortByMean }),
  setShowMedian: (showMedian) => set({ showMedian }),
  setShowP90: (showP90) => set({ showP90 }),
  setShowIqr: (showIqr) => set({ showIqr }),
  setSmoothing: (smoothing) => set({ smoothing }),
  setFieldMode: (fieldMode) => set({ fieldMode }),
  setKeywordMetric: (keywordMetric) => set({ keywordMetric }),
  setWordCloudMode: (wordCloudMode) => set({ wordCloudMode }),
  setActiveNav: (activeNav) => set({ activeNav })
}));