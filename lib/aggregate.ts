import type { AuthorStat, Filters, ParsedRow, RankedPaper, YearStat } from "./types";

export function movingAverage(values: number[], window: number): number[] {
  if (window <= 1) return [...values];
  const half = Math.floor(window / 2);
  return values.map((_, idx) => {
    const start = Math.max(0, idx - half);
    const end = Math.min(values.length - 1, idx + half);
    const slice = values.slice(start, end + 1);
    const sum = slice.reduce((acc, n) => acc + n, 0);
    return sum / slice.length;
  });
}

function percentile(sortedValues: number[], p: number): number {
  if (!sortedValues.length) return 0;
  const index = (sortedValues.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedValues[lower];
  return sortedValues[lower] + (sortedValues[upper] - sortedValues[lower]) * (index - lower);
}

export function filterRows(rows: ParsedRow[], filters: Filters): ParsedRow[] {
  const [minYear, maxYear] = filters.yearRange;
  const [minScore, maxScore] = filters.scoreRange;
  const query = filters.textQuery.trim().toLowerCase();

  const journalSet = new Set(filters.journals);
  const fieldSet = new Set(filters.fields);
  const typeSet = new Set(filters.types);

  // Shared global filter pass used by all charts/tables.
  return rows.filter((row) => {
    if (row.year < minYear || row.year > maxYear) return false;
    if (row.woke_score < minScore || row.woke_score > maxScore) return false;
    if (journalSet.size && !journalSet.has(row.journal)) return false;
    if (fieldSet.size && !fieldSet.has(row.field)) return false;
    if (typeSet.size && !typeSet.has(row.type)) return false;
    if (query && !row.searchText.includes(query)) return false;
    return true;
  });
}

export function computeYearStats(rows: ParsedRow[]): YearStat[] {
  const byYear = new Map<number, number[]>();
  rows.forEach((row) => {
    const current = byYear.get(row.year) ?? [];
    current.push(row.woke_score);
    byYear.set(row.year, current);
  });

  // Per-year distribution summary for trend chart tooltips and percentile bands.
  return [...byYear.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, scores]) => {
      const sorted = [...scores].sort((a, b) => a - b);
      const count = sorted.length;
      const mean = sorted.reduce((acc, n) => acc + n, 0) / count;
      const variance =
        count > 1
          ? sorted.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (count - 1)
          : 0;
      const stderr = count > 0 ? Math.sqrt(variance) / Math.sqrt(count) : 0;
      const ci95Low = Math.max(1, mean - 1.96 * stderr);
      const ci95High = Math.min(10, mean + 1.96 * stderr);
      return {
        year,
        count,
        mean,
        median: percentile(sorted, 0.5),
        p25: percentile(sorted, 0.25),
        p75: percentile(sorted, 0.75),
        p90: percentile(sorted, 0.9),
        ci95Low,
        ci95High
      };
    });
}

export function computeJournalYearHeatmap(rows: ParsedRow[], sortByMean = false) {
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const journals = [...new Set(rows.map((r) => r.journal))];

  // Bucket by journal-year to avoid repeated scans in rendering.
  const bucket = new Map<string, { sum: number; count: number }>();
  rows.forEach((r) => {
    const key = `${r.journal}__${r.year}`;
    const prev = bucket.get(key) ?? { sum: 0, count: 0 };
    prev.sum += r.woke_score;
    prev.count += 1;
    bucket.set(key, prev);
  });

  const means = new Map<string, number>();
  journals.forEach((journal) => {
    const values = years
      .map((year) => bucket.get(`${journal}__${year}`))
      .filter(Boolean) as { sum: number; count: number }[];
    const totalCount = values.reduce((acc, v) => acc + v.count, 0);
    const totalSum = values.reduce((acc, v) => acc + v.sum, 0);
    means.set(journal, totalCount ? totalSum / totalCount : 0);
  });

  const orderedJournals = sortByMean
    ? [...journals].sort((a, b) => (means.get(b) ?? 0) - (means.get(a) ?? 0))
    : [...journals].sort();

  const cells: Array<{ x: number; y: number; value: number; count: number; journal: string; year: number }> = [];
  orderedJournals.forEach((journal, y) => {
    years.forEach((year, x) => {
      const item = bucket.get(`${journal}__${year}`);
      cells.push({
        x,
        y,
        journal,
        year,
        value: item ? item.sum / item.count : 0,
        count: item?.count ?? 0
      });
    });
  });

  return { years, journals: orderedJournals, cells };
}

export function computeFieldTrend(rows: ParsedRow[], normalized = false) {
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const fields = [...new Set(rows.map((r) => r.field))].sort();
  const bucket = new Map<string, { sum: number; count: number }>();

  rows.forEach((row) => {
    const key = `${row.field}__${row.year}`;
    const prev = bucket.get(key) ?? { sum: 0, count: 0 };
    prev.sum += row.woke_score;
    prev.count += 1;
    bucket.set(key, prev);
  });

  const series = fields.map((field) => {
    const yearly = years.map((year) => {
      const item = bucket.get(`${field}__${year}`);
      if (!item) return { year, value: null as number | null };
      return {
        year,
        value: item.sum / item.count
      };
    });

    if (!normalized) {
      return { field, points: yearly };
    }

    // Z-score within each field across selected years.
    const vals = yearly.map((p) => p.value).filter((v): v is number => v !== null);
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const variance = vals.length
      ? vals.reduce((acc, n) => acc + (n - mean) ** 2, 0) / vals.length
      : 0;
    const sd = Math.sqrt(variance) || 1;

    return {
      field,
      points: yearly.map((p) => ({
        year: p.year,
        value: p.value === null ? null : (p.value - mean) / sd
      }))
    };
  });

  return { years, series };
}

export function computeJournalTrend(rows: ParsedRow[], normalized = false) {
  const years = [...new Set(rows.map((r) => r.year))].sort((a, b) => a - b);
  const journals = [...new Set(rows.map((r) => r.journal).filter(Boolean))].sort();

  const bucket = new Map<string, { sum: number; count: number }>();
  rows.forEach((r) => {
    const key = `${r.journal}__${r.year}`;
    const prev = bucket.get(key) ?? { sum: 0, count: 0 };
    prev.sum += r.woke_score;
    prev.count += 1;
    bucket.set(key, prev);
  });

  const series = journals.map((journal) => {
    const yearly = years.map((year) => {
      const item = bucket.get(`${journal}__${year}`);
      return {
        year,
        value: item ? item.sum / item.count : null
      };
    });

    if (!normalized) {
      return { journal, points: yearly };
    }

    // Z-score within each journal across selected years.
    const vals = yearly.map((p) => p.value).filter((v): v is number => v !== null);
    const mean = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const variance = vals.length
      ? vals.reduce((acc, n) => acc + (n - mean) ** 2, 0) / vals.length
      : 0;
    const sd = Math.sqrt(variance) || 1;

    return {
      journal,
      points: yearly.map((p) => ({
        year: p.year,
        value: p.value === null ? null : (p.value - mean) / sd
      }))
    };
  });

  return { years, series };
}

export function computeAuthorRanking(rows: ParsedRow[], minCount: number): AuthorStat[] {
  const stats = new Map<string, number[]>();

  // Expand multi-author rows into per-author score contributions.
  rows.forEach((row) => {
    const uniqueAuthors = [...new Set(row.authorsList)];
    uniqueAuthors.forEach((author) => {
      const prev = stats.get(author) ?? [];
      prev.push(row.woke_score);
      stats.set(author, prev);
    });
  });

  return [...stats.entries()]
    .map(([author, scores]) => {
      const sorted = [...scores].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((acc, n) => acc + n, 0);
      const mean = count ? sum / count : 0;
      const variance =
        count > 1
          ? sorted.reduce((acc, n) => acc + (n - mean) ** 2, 0) / (count - 1)
          : 0;
      const stdev = Math.sqrt(variance);
      const stderr = count ? stdev / Math.sqrt(count) : 0;
      const ci95Low = Math.max(1, mean - 1.96 * stderr);
      const ci95High = Math.min(10, mean + 1.96 * stderr);

      return {
        author,
        count,
        mean,
        stdev,
        ci95Low,
        ci95High
      };
    })
    .filter((a) => a.count >= minCount)
    .sort((a, b) => b.mean - a.mean || b.count - a.count);
}

export function getAuthorDetail(rows: ParsedRow[], authorName: string) {
  const papers = rows
    .filter((row) => row.authorsList.includes(authorName))
    .map<RankedPaper>((row) => ({
      title: row.title,
      vol: row.vol,
      iss: row.iss,
      year: row.year,
      abstract: row.abstract,
      woke_score: row.woke_score,
      keywords: row.keywordsList,
      justification: row.justification,
      url: row.url,
      journal: row.journal,
      field: row.field,
      author: row.author,
      authorsList: row.authorsList
    }));

  const sorted = [...papers].sort((a, b) => b.woke_score - a.woke_score);
  return {
    timeline: papers.map((p) => ({ year: p.year, score: p.woke_score, title: p.title, url: p.url })),
    ranked: sorted
  };
}

export function computeJournalInternalRanking(rows: ParsedRow[], journal: string) {
  const subset = rows.filter((r) => r.journal === journal);
  const sorted = [...subset].sort((a, b) => b.woke_score - a.woke_score);
  const toRanked = (r: ParsedRow): RankedPaper => ({
    title: r.title,
    vol: r.vol,
    iss: r.iss,
    year: r.year,
    abstract: r.abstract,
    woke_score: r.woke_score,
    keywords: r.keywordsList,
    justification: r.justification,
    url: r.url,
    journal: r.journal,
    field: r.field,
    author: r.author,
    authorsList: r.authorsList
  });

  return {
    count: subset.length,
    top: sorted.slice(0, 10).map(toRanked),
    bottom: [...sorted].reverse().slice(0, 10).map(toRanked)
  };
}

export function topKeywords(rows: ParsedRow[], limit = 500) {
  const freq = new Map<string, number>();
  rows.forEach((row) => {
    row.keywordsList.forEach((kw) => freq.set(kw, (freq.get(kw) ?? 0) + 1));
  });
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([keyword, count]) => ({ keyword, count }));
}

export function computeKeywordOverTime(rows: ParsedRow[], keyword: string) {
  const yearTotals = new Map<number, number>();
  const yearKeywordHits = new Map<number, number>();

  rows.forEach((row) => {
    yearTotals.set(row.year, (yearTotals.get(row.year) ?? 0) + 1);
    if (row.keywordsList.includes(keyword)) {
      yearKeywordHits.set(row.year, (yearKeywordHits.get(row.year) ?? 0) + 1);
    }
  });

  const years = [...yearTotals.keys()].sort((a, b) => a - b);
  return years.map((year) => {
    const totalPapers = yearTotals.get(year) ?? 0;
    const count = yearKeywordHits.get(year) ?? 0;
    const normalizedPer1k = totalPapers ? (count / totalPapers) * 1000 : 0;
    return { year, count, normalizedPer1k, totalPapers };
  });
}

export function computeKeywordCloud(rows: ParsedRow[], limit = 80) {
  return topKeywords(rows, limit).map((item) => ({ text: item.keyword, value: item.count }));
}

export function computeEmergingKeywords(rows: ParsedRow[], splitYear: number, limit = 80) {
  const early = rows.filter((r) => r.year <= splitYear);
  const late = rows.filter((r) => r.year > splitYear);

  // Normalize by corpus size per period to compare growth rates fairly.
  const per1k = (source: ParsedRow[]) => {
    const freq = new Map<string, number>();
    source.forEach((r) => r.keywordsList.forEach((k) => freq.set(k, (freq.get(k) ?? 0) + 1)));
    const denom = source.length || 1;
    return new Map([...freq.entries()].map(([k, v]) => [k, (v / denom) * 1000]));
  };

  const earlyRates = per1k(early);
  const lateRates = per1k(late);
  const keys = new Set([...earlyRates.keys(), ...lateRates.keys()]);

  return [...keys]
    .map((key) => {
      const earlyRate = earlyRates.get(key) ?? 0;
      const lateRate = lateRates.get(key) ?? 0;
      return {
        text: key,
        value: lateRate - earlyRate,
        earlyRate,
        lateRate
      };
    })
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function dataSummary(rows: ParsedRow[], filters: Filters) {
  const scores = rows.map((r) => r.woke_score).sort((a, b) => a - b);
  const count = scores.length;
  const mean = count ? scores.reduce((a, b) => a + b, 0) / count : 0;
  const median = count ? percentile(scores, 0.5) : 0;

  return {
    rows: count,
    mean,
    median,
    selectedYears: `${filters.yearRange[0]}-${filters.yearRange[1]}`,
    selectedJournalsCount: filters.journals.length,
    selectedFieldsCount: filters.fields.length
  };
}
