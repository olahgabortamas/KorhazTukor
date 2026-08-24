from __future__ import annotations

from collections import Counter

from collector.models import WaitingListRow


def validate_rows(
    rows: list[WaitingListRow],
    *,
    min_rows: int = 50,
    max_rows: int = 500,
    previous_row_count: int | None = None,
    maximum_relative_row_change: float = 0.25,
) -> None:
    row_count = len(rows)
    if not min_rows <= row_count <= max_rows:
        raise ValueError(
            f"Row count {row_count} is outside the safe range {min_rows}..{max_rows}"
        )

    duplicates = [
        source_id
        for source_id, count in Counter(row.source_list_id for row in rows).items()
        if count > 1
    ]
    if duplicates:
        raise ValueError(f"Duplicate source ids: {', '.join(sorted(duplicates))}")

    if previous_row_count:
        relative_change = abs(row_count - previous_row_count) / previous_row_count
        if relative_change > maximum_relative_row_change:
            raise ValueError(
                f"Row count changed by {relative_change:.1%}: "
                f"{previous_row_count} -> {row_count}"
            )
