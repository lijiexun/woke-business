Large local datasets are intentionally excluded from git.

Recommended workflow:
1. Keep the raw file locally as `data/utd_scores.csv`.
2. Create a compressed copy when needed:
   `powershell -ExecutionPolicy Bypass -File scripts/compress-data.ps1`
3. Commit only small development data in `public/sample.csv`.

Do not commit `data/*.csv`, `data/*.csv.gz`, or `data/*.parquet`.
