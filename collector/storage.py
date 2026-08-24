from __future__ import annotations

import csv
import gzip
import io
import json
import os
from collections import Counter
from dataclasses import fields
from datetime import datetime
from pathlib import Path

from collector.models import WaitingListRow


def latest_metadata(data_dir: Path) -> dict[str, object] | None:
    candidates = sorted((data_dir / "metadata").glob("*/*/*.json"))
    if not candidates:
        return None
    return json.loads(candidates[-1].read_text(encoding="utf-8"))


def snapshot_paths(data_dir: Path, captured_at: datetime) -> tuple[Path, Path]:
    relative = Path(
        f"{captured_at:%Y}", f"{captured_at:%m}", f"{captured_at:%Y-%m-%d}"
    )
    return (
        data_dir / "snapshots" / relative.with_suffix(".csv.gz"),
        data_dir / "metadata" / relative.with_suffix(".json"),
    )


def _atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.tmp")
    temporary.write_bytes(content)
    os.replace(temporary, path)


def write_snapshot(
    *,
    data_dir: Path,
    captured_at: datetime,
    rows: list[WaitingListRow],
    metadata: dict[str, object],
) -> tuple[Path, Path]:
    snapshot_path, metadata_path = snapshot_paths(data_dir, captured_at)

    if metadata_path.exists():
        existing = json.loads(metadata_path.read_text(encoding="utf-8"))
        if existing.get("source_sha256") == metadata.get("source_sha256"):
            return snapshot_path, metadata_path
        raise FileExistsError(
            f"A different immutable snapshot already exists for {captured_at:%Y-%m-%d}"
        )

    buffer = io.StringIO(newline="")
    fieldnames = ["captured_date"] + [field.name for field in fields(WaitingListRow)]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    for row in sorted(rows, key=lambda item: item.source_list_id):
        writer.writerow({"captured_date": f"{captured_at:%Y-%m-%d}", **row.as_dict()})

    flag_counts = Counter(flag for row in rows for flag in row.quality_flags())
    complete_metadata = {
        **metadata,
        "row_count": len(rows),
        "quality_flag_counts": dict(sorted(flag_counts.items())),
    }

    csv_bytes = buffer.getvalue().encode("utf-8")
    _atomic_write(snapshot_path, gzip.compress(csv_bytes, compresslevel=9, mtime=0))
    _atomic_write(
        metadata_path,
        (json.dumps(complete_metadata, ensure_ascii=False, indent=2) + "\n").encode(
            "utf-8"
        ),
    )
    return snapshot_path, metadata_path
