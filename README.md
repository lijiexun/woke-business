# Woke Business

Interactive offline-capable web dashboard for analyzing UTD-24 articles (2000-2024) with `woke_score`, `keywords`, and `justification`.

## Stack
- Next.js (App Router) + TypeScript
- TailwindCSS
- ECharts (`echarts-for-react`)
- Zustand
- PapaParse
- Vitest

## Features Implemented
1. Overview trend chart: yearly mean + 95% interval with smoothing (none/3y/5y)
2. Discipline trend comparison: multi-line chart with raw/z-score toggle
3. Journal trend comparison: multi-line chart with raw/z-score toggle
4. Journal internal ranking: ranked paper cards with abstract expansion and score explanation
5. Author ranking and drilldown: min-publication threshold, timeline scatter, and top-paper modal
6. Keyword analysis: searchable keyword-over-time (raw/per-1k) with year click drilldown
7. Interactive word cloud for keyword exploration

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
- Default load flow: `/public/data/runtime_rows_manifest.json` (+ `/public/data/runtime_rows/*.json` chunks), with fallback to `/public/sample.csv`.
- Required columns:
  - `year, vol, iss, author, title, abstract, url, type, journal, field, woke_score, keywords, justification`

## Deployment and Large Files
- `data/utd_scores.csv` is intentionally ignored by git via `.gitignore`.
- Keep the full raw dataset local only; do not commit it.
- Before pushing, run:
```bash
npm run check:tracked-size
```
- The app can run without `data/utd_scores.csv` because runtime data is loaded from `public/data/runtime_rows*.json`.
- For public deployments, commit generated artifacts under `public/data/` (including `runtime_rows` chunks) and `public/sample.csv`.

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
- `runtime_rows_manifest.json`
- `runtime_rows/<year>.json` (full row-level runtime chunks)
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

## Deploy to GitHub Pages
1. Push to `main`; the workflow `.github/workflows/deploy-pages.yml` builds and deploys `out/`.
2. In GitHub repo settings, set `Pages -> Source` to `GitHub Actions`.
3. Runtime data is served statically from `public/data/`; no server API is required.

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
- Most chart/table payloads are computed from filtered raw rows in-browser.
- Prebuilt artifacts under `public/data/` are available for future static/SSR optimization paths.
- Handles ~40k rows in client-side mode for MVP; Web Worker can be added later if needed.
