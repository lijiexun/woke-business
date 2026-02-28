import csv
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path


INPUT_CSV = Path("data/utd_scores.csv")
OUTPUT_DIR = Path("public/data")
RUNTIME_ROWS_DIR = OUTPUT_DIR / "runtime_rows"
DEFAULT_SPLIT_YEAR = 2011
TOP_KEYWORDS = 500
WORD_CLOUD_LIMIT = 120
MIN_AUTHOR_PUBS = 5
RUNTIME_SCHEMA = [
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
    "justification",
]

AUTHOR_NOISE = [
    "Search for more papers by this author",
    "Author links open overlay panel",
    "Oxford Academic",
    "PubMed",
    "Google Scholar",
]


def safe_int(value, fallback=0):
    try:
        return int(str(value).strip())
    except Exception:
        return fallback


def as_text(value):
    if value is None:
        return ""
    return str(value).strip()


def percentile(sorted_values, p):
    if not sorted_values:
        return 0.0
    idx = (len(sorted_values) - 1) * p
    lo = int(math.floor(idx))
    hi = int(math.ceil(idx))
    if lo == hi:
        return float(sorted_values[lo])
    return float(sorted_values[lo] + (sorted_values[hi] - sorted_values[lo]) * (idx - lo))


def parse_keywords(raw):
    if raw is None:
        return []
    text = str(raw).strip()
    if not text or text.lower() in {"nan", "[]"}:
        return []

    def normalize(items):
        out = []
        seen = set()
        for item in items:
            value = str(item).strip().strip("'").strip('"').strip().lower()
            if value and value not in seen:
                seen.add(value)
                out.append(value)
        return out

    if text.startswith("[") and text.endswith("]"):
        try:
            parsed = json.loads(text)
            if isinstance(parsed, list):
                return normalize(parsed)
        except Exception:
            try:
                parsed = json.loads(text.replace("'", '"'))
                if isinstance(parsed, list):
                    return normalize(parsed)
            except Exception:
                inside = text[1:-1]
                parts = re.split(r',(?=(?:[^"]*"[^"]*")*[^"]*$)', inside)
                return normalize(parts)
    return normalize(re.split(r"[;,|]", text))


def extract_authors(raw):
    if raw is None:
        return []
    text = str(raw).strip()
    if not text or text.lower() == "nan":
        return []

    cleaned = re.sub(r"\s+", " ", text)
    for noise in AUTHOR_NOISE:
        cleaned = cleaned.replace(noise, " ")
    parts = re.split(r"\band\b|;|,|&|\|", cleaned, flags=re.IGNORECASE)

    out = []
    seen = set()
    for part in parts:
        token = re.sub(r"\b\d+\b", " ", part)
        token = re.sub(r"\S+@\S+", " ", token)
        token = re.sub(r"\s+", " ", token).strip()
        if len(token) <= 2 or not re.search(r"[a-zA-Z]", token):
            continue
        if token not in seen:
            seen.add(token)
            out.append(token)
    return out


def to_float(v, digits=4):
    return round(float(v), digits)


def write_json(name, data):
    out = OUTPUT_DIR / name
    out.write_text(json.dumps(data, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
    return out


def build():
    if not INPUT_CSV.exists():
        raise FileNotFoundError(f"Input dataset not found: {INPUT_CSV}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    rows = []
    years_counter = Counter()
    journals_counter = Counter()
    fields_counter = Counter()
    types_counter = Counter()
    runtime_rows_by_year = defaultdict(list)

    with INPUT_CSV.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            year = safe_int(row.get("year"))
            score = safe_int(row.get("woke_score"))
            journal = (row.get("journal") or "").strip()
            field = (row.get("field") or "").strip()
            typ = (row.get("type") or "").strip()
            kws = parse_keywords(row.get("keywords"))
            authors = extract_authors(row.get("author"))

            cleaned = {
                "year": year,
                "journal": journal,
                "field": field,
                "type": typ,
                "score": score,
                "title": (row.get("title") or "").strip(),
                "keywords": kws,
                "justification": (row.get("justification") or "").strip(),
                "url": (row.get("url") or "").strip(),
                "authors": authors,
            }
            rows.append(cleaned)

            years_counter[year] += 1
            if journal:
                journals_counter[journal] += 1
            if field:
                fields_counter[field] += 1
            if typ:
                types_counter[typ] += 1

            runtime_rows_by_year[year].append([as_text(row.get(col)) for col in RUNTIME_SCHEMA])

    years_sorted = sorted(years_counter)

    # 1) Overall trend
    by_year_scores = defaultdict(list)
    for r in rows:
        by_year_scores[r["year"]].append(r["score"])

    overall_trend = []
    for year in sorted(by_year_scores):
        vals = sorted(by_year_scores[year])
        mean = sum(vals) / len(vals)
        overall_trend.append(
            {
                "year": year,
                "count": len(vals),
                "mean": to_float(mean),
                "median": to_float(percentile(vals, 0.5)),
                "p25": to_float(percentile(vals, 0.25)),
                "p75": to_float(percentile(vals, 0.75)),
                "p90": to_float(percentile(vals, 0.9)),
            }
        )

    # 2) Journal x year heatmap
    bucket_jy = defaultdict(lambda: {"sum": 0, "count": 0})
    for r in rows:
        key = (r["journal"], r["year"])
        bucket_jy[key]["sum"] += r["score"]
        bucket_jy[key]["count"] += 1

    journal_list = sorted(journals_counter)
    heatmap_cells = []
    for j in journal_list:
        for y in years_sorted:
            item = bucket_jy.get((j, y))
            if item:
                heatmap_cells.append(
                    {
                        "journal": j,
                        "year": y,
                        "count": item["count"],
                        "mean": to_float(item["sum"] / item["count"]),
                    }
                )

    # 3) Field trend
    bucket_fy = defaultdict(lambda: {"sum": 0, "count": 0})
    for r in rows:
        key = (r["field"], r["year"])
        bucket_fy[key]["sum"] += r["score"]
        bucket_fy[key]["count"] += 1

    field_trend = []
    for f in sorted(fields_counter):
        points = []
        for y in years_sorted:
            item = bucket_fy.get((f, y))
            if item:
                points.append(
                    {"year": y, "count": item["count"], "mean": to_float(item["sum"] / item["count"])}
                )
        field_trend.append({"field": f, "points": points})

    # 5) Author ranking
    author_stats = defaultdict(lambda: {"count": 0, "sum": 0, "sum_sq": 0})
    for r in rows:
        for a in set(r["authors"]):
            s = author_stats[a]
            s["count"] += 1
            s["sum"] += r["score"]
            s["sum_sq"] += r["score"] ** 2

    author_ranking = []
    for author, s in author_stats.items():
        if s["count"] < MIN_AUTHOR_PUBS:
            continue
        mean = s["sum"] / s["count"]
        var = max(0.0, (s["sum_sq"] / s["count"]) - (mean**2))
        author_ranking.append(
            {
                "author": author,
                "count": s["count"],
                "mean": to_float(mean),
                "stdev": to_float(math.sqrt(var)),
            }
        )
    author_ranking.sort(key=lambda x: (-x["mean"], -x["count"], x["author"]))

    # 7) Journal internal ranking
    by_journal = defaultdict(list)
    for r in rows:
        by_journal[r["journal"]].append(r)

    journal_internal = {}
    for j, items in by_journal.items():
        ordered = sorted(items, key=lambda x: x["score"], reverse=True)

        def slim(p):
            return {
                "year": p["year"],
                "score": p["score"],
                "title": p["title"],
                "keywords": p["keywords"][:10],
                "justification": p["justification"],
                "url": p["url"],
            }

        journal_internal[j] = {
            "count": len(items),
            "top10": [slim(p) for p in ordered[:10]],
            "bottom10": [slim(p) for p in list(reversed(ordered))[:10]],
        }

    # 8) Keyword frequency over time
    keyword_total = Counter()
    by_year_keyword = defaultdict(Counter)
    for r in rows:
        y = r["year"]
        unique_kws = set(r["keywords"])
        for kw in unique_kws:
            keyword_total[kw] += 1
            by_year_keyword[y][kw] += 1

    top_keywords = [kw for kw, _ in keyword_total.most_common(TOP_KEYWORDS)]
    keyword_over_time = {}
    for kw in top_keywords:
        series = []
        for y in years_sorted:
            c = by_year_keyword[y].get(kw, 0)
            total = years_counter[y]
            norm = (c / total) * 1000 if total else 0
            series.append({"year": y, "count": c, "per1k": to_float(norm)})
        keyword_over_time[kw] = series

    # 9a/9b) Word clouds by journal and field
    keyword_by_journal = {}
    for j in journal_list:
        c = Counter()
        for r in by_journal[j]:
            c.update(r["keywords"])
        keyword_by_journal[j] = [{"text": k, "value": v} for k, v in c.most_common(WORD_CLOUD_LIMIT)]

    keyword_by_field = {}
    for f in sorted(fields_counter):
        c = Counter()
        for r in rows:
            if r["field"] == f:
                c.update(r["keywords"])
        keyword_by_field[f] = [{"text": k, "value": v} for k, v in c.most_common(WORD_CLOUD_LIMIT)]

    # 9c) Emerging words
    early = [r for r in rows if r["year"] <= DEFAULT_SPLIT_YEAR]
    late = [r for r in rows if r["year"] > DEFAULT_SPLIT_YEAR]

    def rate_map(source):
        c = Counter()
        for r in source:
            c.update(set(r["keywords"]))
        denom = len(source) if source else 1
        return {k: (v / denom) * 1000 for k, v in c.items()}

    early_rates = rate_map(early)
    late_rates = rate_map(late)
    all_kws = set(early_rates) | set(late_rates)
    emerging = []
    for kw in all_kws:
        ev = early_rates.get(kw, 0.0)
        lv = late_rates.get(kw, 0.0)
        delta = lv - ev
        if delta > 0:
            emerging.append(
                {
                    "text": kw,
                    "delta_per1k": to_float(delta),
                    "early_per1k": to_float(ev),
                    "late_per1k": to_float(lv),
                }
            )
    emerging.sort(key=lambda x: -x["delta_per1k"])
    emerging = emerging[:WORD_CLOUD_LIMIT]

    # Metadata + summary
    score_values = sorted(r["score"] for r in rows)
    summary = {
        "rows": len(rows),
        "year_min": min(years_sorted) if years_sorted else 0,
        "year_max": max(years_sorted) if years_sorted else 0,
        "mean_score": to_float(sum(score_values) / len(score_values)) if score_values else 0.0,
        "median_score": to_float(percentile(score_values, 0.5)) if score_values else 0.0,
        "journals": len(journals_counter),
        "fields": len(fields_counter),
        "types": len(types_counter),
    }
    filters = {
        "years": years_sorted,
        "journals": sorted(journals_counter),
        "fields": sorted(fields_counter),
        "types": sorted(types_counter),
    }

    files = []
    files.append(write_json("summary.json", summary))
    files.append(write_json("filters.json", filters))
    files.append(write_json("overall_trend.json", overall_trend))
    files.append(write_json("journal_year_heatmap.json", {"years": years_sorted, "journals": journal_list, "cells": heatmap_cells}))
    files.append(write_json("field_trend.json", {"years": years_sorted, "series": field_trend}))
    files.append(write_json("author_ranking_min5.json", author_ranking))
    files.append(write_json("journal_internal_ranking.json", journal_internal))
    files.append(write_json("keyword_over_time_top500.json", {"years": years_sorted, "series": keyword_over_time}))
    files.append(write_json("wordcloud_by_journal.json", keyword_by_journal))
    files.append(write_json("wordcloud_by_field.json", keyword_by_field))
    files.append(
        write_json(
            "emerging_words_default_split.json",
            {"split_year": DEFAULT_SPLIT_YEAR, "words": emerging},
        )
    )

    # Runtime row chunks: enable full-feature client filtering without shipping CSV.
    RUNTIME_ROWS_DIR.mkdir(parents=True, exist_ok=True)
    for stale in RUNTIME_ROWS_DIR.glob("*.json"):
        stale.unlink()

    runtime_files = []
    total_runtime_rows = 0
    for year in sorted(runtime_rows_by_year):
        chunk_rows = runtime_rows_by_year[year]
        payload = {"year": year, "rows": chunk_rows}
        chunk_path = RUNTIME_ROWS_DIR / f"{year}.json"
        chunk_path.write_text(json.dumps(payload, ensure_ascii=True, separators=(",", ":")), encoding="utf-8")
        runtime_files.append(
            {
                "year": year,
                "path": f"/data/runtime_rows/{year}.json",
                "rows": len(chunk_rows),
                "bytes": chunk_path.stat().st_size,
            }
        )
        total_runtime_rows += len(chunk_rows)

    files.append(
        write_json(
            "runtime_rows_manifest.json",
            {"schema": RUNTIME_SCHEMA, "total_rows": total_runtime_rows, "files": runtime_files},
        )
    )
    files.extend([RUNTIME_ROWS_DIR / f"{item['year']}.json" for item in runtime_files])

    manifest = []
    for f in files:
        rel = f.relative_to(OUTPUT_DIR)
        manifest.append({"file": str(rel).replace("\\", "/"), "bytes": f.stat().st_size})
    write_json("manifest.json", {"input_csv": str(INPUT_CSV), "files": manifest})

    print("Generated JSON artifacts:")
    for item in manifest:
        print(f"- {item['file']}: {item['bytes']} bytes")


if __name__ == "__main__":
    build()
