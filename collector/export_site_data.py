from __future__ import annotations

import argparse
import csv
import gzip
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def _read_snapshots(data_dir: Path) -> dict[str, list[dict[str, str]]]:
    snapshots: dict[str, list[dict[str, str]]] = {}
    for path in sorted((data_dir / "snapshots").glob("*/*/*.csv.gz")):
        with gzip.open(path, mode="rt", encoding="utf-8", newline="") as source:
            rows = list(csv.DictReader(source))
        if rows:
            snapshots[rows[0]["captured_date"]] = rows
    if not snapshots:
        raise ValueError("No snapshots found")
    return snapshots


def _display_name(raw_names: list[str]) -> str:
    simplified = [name.split(" - ", 1)[0].strip() for name in raw_names]
    return Counter(simplified).most_common(1)[0][0]


def _flags(row: dict[str, str]) -> list[str]:
    median = int(row["median_wait_days_previous_6_months"])
    mean = int(row["mean_wait_days_previous_6_months"])
    treated = int(row["treated_previous_6_months"])
    flags: list[str] = []
    if treated < 20:
        flags.append("LOW_SAMPLE")
    if median == 0 and mean > 30:
        flags.append("STRONGLY_SKEWED")
    if abs(mean - median) > 60:
        flags.append("HIGH_MEAN_MEDIAN_GAP")
    return flags


def build_site_data(data_dir: Path) -> dict[str, Any]:
    snapshots = _read_snapshots(data_dir)
    dates = sorted(snapshots)
    current_date = dates[-1]
    current = snapshots[current_date]

    procedure_history: dict[str, list[dict[str, int | str]]] = defaultdict(list)
    row_history: dict[str, list[dict[str, int | str]]] = defaultdict(list)
    for date in dates:
        by_procedure: dict[str, list[dict[str, str]]] = defaultdict(list)
        for row in snapshots[date]:
            by_procedure[row["procedure_code"]].append(row)
            row_history[row["source_list_id"]].append(
                {
                    "date": date,
                    "waiting_over_60": int(row["waiting_over_60"]),
                    "treated_previous_6_months": int(
                        row["treated_previous_6_months"]
                    ),
                    "median_wait_days": int(
                        row["median_wait_days_previous_6_months"]
                    ),
                    "mean_wait_days": int(
                        row["mean_wait_days_previous_6_months"]
                    ),
                }
            )
        for code, rows in by_procedure.items():
            procedure_history[code].append(
                {
                    "date": date,
                    "waiting_over_60": sum(int(row["waiting_over_60"]) for row in rows),
                    "treated_previous_6_months": sum(
                        int(row["treated_previous_6_months"]) for row in rows
                    ),
                    "reporting_lists": len(rows),
                }
            )

    procedures: list[dict[str, Any]] = []
    by_procedure_current: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in current:
        by_procedure_current[row["procedure_code"]].append(row)
    for code, rows in by_procedure_current.items():
        detailed_rows = []
        for row in sorted(rows, key=lambda item: int(item["waiting_over_60"]), reverse=True):
            detailed_rows.append(
                {
                    "source_list_id": row["source_list_id"],
                    "hospital_code": row["source_institution_code"],
                    "hospital_name": row["hospital_name_raw"],
                    "region": row["region_name_raw"],
                    "list_name": row["waiting_list_name_raw"],
                    "waiting_over_60": int(row["waiting_over_60"]),
                    "treated_previous_6_months": int(row["treated_previous_6_months"]),
                    "median_wait_days": int(row["median_wait_days_previous_6_months"]),
                    "mean_wait_days": int(row["mean_wait_days_previous_6_months"]),
                    "quality_flags": _flags(row),
                    "source_url": row["source_row_url"],
                    "history": row_history[row["source_list_id"]],
                }
            )
        procedures.append(
            {
                "code": code,
                "name": _display_name([row["waiting_list_name_raw"] for row in rows]),
                "waiting_over_60": sum(int(row["waiting_over_60"]) for row in rows),
                "treated_previous_6_months": sum(
                    int(row["treated_previous_6_months"]) for row in rows
                ),
                "hospital_count": len({row["source_institution_code"] for row in rows}),
                "reporting_list_count": len(rows),
                "flagged_list_count": sum(bool(_flags(row)) for row in rows),
                "history": procedure_history[code],
                "rows": detailed_rows,
            }
        )

    hospitals: list[dict[str, Any]] = []
    by_hospital: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in current:
        by_hospital[row["source_institution_code"]].append(row)
    for code, rows in by_hospital.items():
        name = Counter(row["hospital_name_raw"] for row in rows).most_common(1)[0][0]
        hospitals.append(
            {
                "code": code,
                "name": name,
                "region": Counter(row["region_name_raw"] for row in rows).most_common(1)[0][0],
                "list_count": len(rows),
                "waiting_over_60": sum(int(row["waiting_over_60"]) for row in rows),
                "treated_previous_6_months": sum(
                    int(row["treated_previous_6_months"]) for row in rows
                ),
                "flagged_list_count": sum(bool(_flags(row)) for row in rows),
                "procedures": sorted(
                    {
                        _display_name([row["waiting_list_name_raw"]])
                        for row in rows
                    }
                ),
            }
        )

    return {
        "schema_version": 1,
        "updated_date": current_date,
        "history_start_date": dates[0],
        "snapshot_count": len(dates),
        "source_url": "https://varolista.neak.gov.hu/varolista_pub/varolistak-teteles-lekerdezese/?tk=MIND",
        "summary": {
            "reporting_hospitals": len(by_hospital),
            "procedure_types": len(by_procedure_current),
            "current_rows": len(current),
            "waiting_over_60": sum(int(row["waiting_over_60"]) for row in current),
            "treated_previous_6_months": sum(
                int(row["treated_previous_6_months"]) for row in current
            ),
            "flagged_rows": sum(bool(_flags(row)) for row in current),
        },
        "procedures": sorted(procedures, key=lambda item: item["waiting_over_60"], reverse=True),
        "hospitals": sorted(hospitals, key=lambda item: item["name"]),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Build KórházTükör browser data")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument(
        "--output", type=Path, default=Path("site/public/data/korhaztukor.json")
    )
    args = parser.parse_args()
    payload = build_site_data(args.data_dir)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )
    print(
        f"Exported {len(payload['procedures'])} procedures and "
        f"{len(payload['hospitals'])} hospitals to {args.output}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
