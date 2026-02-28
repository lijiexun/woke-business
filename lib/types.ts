export type ParsedRow = {
  year: number;
  vol: string;
  iss: string;
  author: string;
  title: string;
  abstract: string;
  url: string;
  type: string;
  type_raw: string;
  type_main: string;
  journal: string;
  field: string;
  woke_score: number;
  keywords: string;
  justification: string;
  keywordsList: string[];
  authorsList: string[];
  searchText: string;
};

export type Filters = {
  yearRange: [number, number];
  scoreRange: [number, number];
  journals: string[];
  fields: string[];
  types: string[];
  textQuery: string;
};

export type YearStat = {
  year: number;
  count: number;
  mean: number;
  median: number;
  p25: number;
  p75: number;
  p90: number;
  ci95Low: number;
  ci95High: number;
};

export type AuthorStat = {
  author: string;
  count: number;
  mean: number;
  stdev: number;
  ci95Low: number;
  ci95High: number;
};

export type RankedPaper = {
  title: string;
  vol: string;
  iss: string;
  year: number;
  abstract: string;
  woke_score: number;
  keywords: string[];
  justification: string;
  url: string;
  journal: string;
  field: string;
  author: string;
  authorsList: string[];
};
