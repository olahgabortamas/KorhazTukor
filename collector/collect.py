from __future__ import annotations

import argparse
import hashlib
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from collector import __version__
from collector.parse import parse_waiting_list_html
from collector.storage import latest_metadata, write_snapshot
from collector.validate import validate_rows


DEFAULT_SOURCE_URL = (
    "https://varolista.neak.gov.hu/varolista_pub/"
    "varolistak-teteles-lekerdezese/?tk=MIND"
)


def _user_agent() -> str:
    contact = os.environ.get(
        "KORHAZTUKOR_CONTACT", "https://github.com/olahgabortamas/KorhazTukor"
    )
    return f"KorhazTukor/{__version__} (+{contact})"


def fetch_html(url: str, attempts: int = 3) -> tuple[bytes, str]:
    delays = (0, 5, 20)
    last_error: Exception | None = None
    for attempt in range(attempts):
        if delays[attempt]:
            time.sleep(delays[attempt])
        request = Request(
            url,
            headers={
                "User-Agent": _user_agent(),
                "Accept": "text/html,application/xhtml+xml",
                "Accept-Language": "hu-HU,hu;q=0.9",
                "Accept-Encoding": "identity",
            },
        )
        try:
            with urlopen(request, timeout=20) as response:
                if response.status != 200:
                    raise RuntimeError(f"Unexpected HTTP status: {response.status}")
                return response.read(), response.geturl()
        except (HTTPError, URLError, TimeoutError, RuntimeError) as error:
            last_error = error
    raise RuntimeError(f"Source fetch failed after {attempts} attempts") from last_error


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Collect one NEAK waiting-list snapshot")
    parser.add_argument("--data-dir", type=Path, default=Path("data"))
    parser.add_argument("--source-url", default=DEFAULT_SOURCE_URL)
    parser.add_argument("--min-rows", type=int, default=50)
    parser.add_argument("--max-rows", type=int, default=500)
    args = parser.parse_args(argv)

    captured_at = datetime.now(timezone.utc)
    body, final_url = fetch_html(args.source_url)
    try:
        html = body.decode("utf-8-sig", errors="strict")
    except UnicodeDecodeError as error:
        raise ValueError("Source response is not valid UTF-8") from error

    rows = parse_waiting_list_html(html)
    previous = latest_metadata(args.data_dir)
    previous_count = int(previous["row_count"]) if previous else None
    validate_rows(
        rows,
        min_rows=args.min_rows,
        max_rows=args.max_rows,
        previous_row_count=previous_count,
    )

    metadata: dict[str, object] = {
        "schema_version": 1,
        "captured_at_utc": captured_at.isoformat().replace("+00:00", "Z"),
        "source_requested_url": args.source_url,
        "source_final_url": final_url,
        "source_sha256": hashlib.sha256(body).hexdigest(),
        "source_bytes": len(body),
        "http_status": 200,
        "parser_version": __version__,
    }
    snapshot_path, metadata_path = write_snapshot(
        data_dir=args.data_dir,
        captured_at=captured_at,
        rows=rows,
        metadata=metadata,
    )
    print(
        f"Collected {len(rows)} rows for {captured_at:%Y-%m-%d}: "
        f"{snapshot_path} ({metadata_path})"
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print(f"Collection failed: {error}", file=sys.stderr)
        raise
