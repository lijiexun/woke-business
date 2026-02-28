"use client";

import { create } from "zustand";
import type { Filters, ParsedRow } from "@/lib/types";

type SmoothingMode = "none" | 3 | 5;
type FieldMode = "raw" | "zscore";
type JournalMode = "raw" | "zscore";
type KeywordMetric = "raw" | "normalized";
type WordCloudMode = "global" | "emerging";

type DataState = {
  rawRows: ParsedRow[];
  filters: Filters;
  authorMinPubs: number;
  selectedAuthor: string | null;
  selectedKeyword: string;
  selectedKeywordColor: string;
  selectedJournalForRanking: string;
  splitYear: number;
  heatmapSortByMean: boolean;
  smoothing: SmoothingMode;
  fieldMode: FieldMode;
  journalMode: JournalMode;
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
  setSelectedKeywordColor: (value: string) => void;
  setSelectedJournalForRanking: (value: string) => void;
  setSplitYear: (value: number) => void;
  setHeatmapSortByMean: (value: boolean) => void;
  setSmoothing: (value: SmoothingMode) => void;
  setFieldMode: (value: FieldMode) => void;
  setJournalMode: (value: JournalMode) => void;
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
  selectedKeywordColor: "",
  selectedJournalForRanking: "",
  splitYear: 2011,
  heatmapSortByMean: false,
  smoothing: "none",
  fieldMode: "raw",
  journalMode: "raw",
  keywordMetric: "raw",
  wordCloudMode: "global",
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
  setSelectedKeywordColor: (selectedKeywordColor) => set({ selectedKeywordColor }),
  setSelectedJournalForRanking: (selectedJournalForRanking) => set({ selectedJournalForRanking }),
  setSplitYear: (splitYear) => set({ splitYear }),
  setHeatmapSortByMean: (heatmapSortByMean) => set({ heatmapSortByMean }),
  setSmoothing: (smoothing) => set({ smoothing }),
  setFieldMode: (fieldMode) => set({ fieldMode }),
  setJournalMode: (journalMode) => set({ journalMode }),
  setKeywordMetric: (keywordMetric) => set({ keywordMetric }),
  setWordCloudMode: (wordCloudMode) => set({ wordCloudMode }),
  setActiveNav: (activeNav) => set({ activeNav })
}));
