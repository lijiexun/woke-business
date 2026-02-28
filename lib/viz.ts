import type { YearStat } from "@/lib/types";

export type SummaryArtifact = {
  rows: number;
  year_min: number;
  year_max: number;
  mean_score: number;
  median_score: number;
  journals: number;
  fields: number;
  types: number;
};

export type FiltersArtifact = {
  years: number[];
  journals: string[];
  fields: string[];
  types: string[];
};

export type JournalYearCellArtifact = {
  journal: string;
  year: number;
  count: number;
  mean: number;
};

export type FieldTrendArtifact = {
  years: number[];
  series: Array<{ field: string; points: Array<{ year: number; count: number; mean: number }> }>;
};

export type KeywordOverTimeArtifact = {
  years: number[];
  series: Record<string, Array<{ year: number; count: number; per1k: number }>>;
};

export type WordCloudItem = { text: string; value: number };
export type WordCloudMap = Record<string, WordCloudItem[]>;

export type EmergingWordsArtifact = {
  split_year: number;
  words: Array<{ text: string; delta_per1k: number; early_per1k: number; late_per1k: number }>;
};

export type VizArtifacts = {
  summary: SummaryArtifact;
  filters: FiltersArtifact;
  overallTrend: YearStat[];
  journalYearHeatmap: {
    years: number[];
    journals: string[];
    cells: JournalYearCellArtifact[];
  };
  fieldTrend: FieldTrendArtifact;
  keywordOverTime: KeywordOverTimeArtifact;
  wordCloudByJournal: WordCloudMap;
  wordCloudByField: WordCloudMap;
  emergingWordsDefault: EmergingWordsArtifact;
};

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function loadVizArtifacts(): Promise<VizArtifacts> {
  const [
    summary,
    filters,
    overallTrend,
    journalYearHeatmap,
    fieldTrend,
    keywordOverTime,
    wordCloudByJournal,
    wordCloudByField,
    emergingWordsDefault
  ] = await Promise.all([
    fetchJson<SummaryArtifact>("/data/summary.json"),
    fetchJson<FiltersArtifact>("/data/filters.json"),
    fetchJson<YearStat[]>("/data/overall_trend.json"),
    fetchJson<{ years: number[]; journals: string[]; cells: JournalYearCellArtifact[] }>("/data/journal_year_heatmap.json"),
    fetchJson<FieldTrendArtifact>("/data/field_trend.json"),
    fetchJson<KeywordOverTimeArtifact>("/data/keyword_over_time_top500.json"),
    fetchJson<WordCloudMap>("/data/wordcloud_by_journal.json"),
    fetchJson<WordCloudMap>("/data/wordcloud_by_field.json"),
    fetchJson<EmergingWordsArtifact>("/data/emerging_words_default_split.json")
  ]);

  return {
    summary,
    filters,
    overallTrend,
    journalYearHeatmap,
    fieldTrend,
    keywordOverTime,
    wordCloudByJournal,
    wordCloudByField,
    emergingWordsDefault
  };
}
