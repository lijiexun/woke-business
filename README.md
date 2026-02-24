# Woke Business

Interactive offline-capable web dashboard for analyzing UTD-24 articles (2000-2024) with `woke_score`, `keywords`, and `justification`.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- ECharts (`echarts-for-react`)
- Zustand
- PapaParse
- Vitest

## Features Implemented (MVP)
1. Overall Trend Chart: mean line + median toggle + IQR band + p90 toggle + smoothing (none/3y/5y)
2. Journal x Year Heatmap: sortable journals by filtered mean, click-to-drill journal filter
3. Field Trend Comparison: multi-line chart with raw/z-score toggle
5. Author Woke Index: ranking table with min publication threshold and author drilldown modal
7. Journal Internal Ranking: top/bottom papers in selected journal, with scope toggle
8. Keyword Frequency Over Time: searchable keyword selector, raw/per-1k toggle, year click drilldown
9. Word Clouds: by journal, by field, and emerging keywords with split-year control

## Project Structure
```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  charts/
  layout/
  sections/
  ui/
lib/
  aggregate.ts
  parse.ts
  types.ts
store/
  useDataStore.ts
public/
  sample.csv
test/
  aggregate.test.ts
  parse.test.ts
```

## Run Locally
1. Install dependencies:
```bash
npm install
```
2. Start dev server:
```bash
npm run dev
```
3. Open `http://localhost:3000`.

## Data Input
- Default load: `/public/sample.csv`
- For full dataset: use sidebar `Load CSV` file input and select your local CSV (e.g. `data/utd_scores.csv`).
- Required columns:
  - `year, vol, iss, author, title, abstract, url, type, journal, field, woke_score, keywords, justification`

## Build Visualization JSON Artifacts
Generate compact static files for deployment and chart loading:

```bash
npm run build:data
```

This reads `data/utd_scores.csv` and writes these files under `public/data/`:
- `summary.json`
- `filters.json`
- `overall_trend.json`
- `journal_year_heatmap.json`
- `field_trend.json`
- `author_ranking_min5.json`
- `journal_internal_ranking.json`
- `keyword_over_time_top500.json`
- `wordcloud_by_journal.json`
- `wordcloud_by_field.json`
- `emerging_words_default_split.json`
- `manifest.json`

## Large Dataset Workflow (Windows)
- Keep the full dataset local only (`data/utd_scores.csv`) and out of git history.
- Compress local raw data when needed:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/compress-data.ps1
```
- Optional custom paths:
```powershell
powershell -ExecutionPolicy Bypass -File scripts/compress-data.ps1 -InputCsv "D:\data\utd_scores.csv" -OutputGzip "data\utd_scores.csv.gz"
```
- Commit only lightweight files (for example `public/sample.csv`), not raw/large artifacts under `data/`.

## Build Production
```bash
npm run build
npm run start
```

## Tests
```bash
npm run test
```
Includes unit tests for:
- keyword parsing
- author extraction
- moving average

## Performance Notes
- CSV parsed once and held in memory.
- Global filter operation runs against parsed rows only.
- Aggregations are memoized by filter state (`useMemo`).
- Chart payloads use pre-aggregated outputs, not raw rows.
- Handles ~40k rows in client-side mode for MVP; Web Worker can be added later if needed.
