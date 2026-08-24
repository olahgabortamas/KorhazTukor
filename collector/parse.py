from __future__ import annotations

import re
from html.parser import HTMLParser
from urllib.parse import parse_qs, urlparse

from collector.models import WaitingListRow


EXPECTED_HEADERS = (
    "Várólista neve",
    "Térség neve",
    "Intézmény neve",
    "60 napot meghaladóan várakozók száma",
    "Tárgyhónapot megelőző 6 hónapban ellátott esetek száma",
    "Medián tényleges várakozási idő a megelőző 6 hónapban",
    "Átlagos tényleges várakozási idő a megelőző 6 hónapban",
)


def normalize_text(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split())


class _WaitingListTableParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.in_target_table = False
        self.target_table_seen = False
        self.in_row = False
        self.cell_kind: str | None = None
        self.cell_parts: list[str] = []
        self.current_cells: list[str] = []
        self.current_headers: list[str] = []
        self.current_href = ""
        self.current_row_href = ""
        self.headers: tuple[str, ...] = ()
        self.rows: list[tuple[list[str], str]] = []

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        attributes = dict(attrs)
        if tag == "table" and attributes.get("id") == "tb_int":
            self.in_target_table = True
            self.target_table_seen = True
            return
        if not self.in_target_table:
            return
        if tag == "tr":
            if self.in_row:
                self._finish_row()
            self.in_row = True
            self.current_cells = []
            self.current_headers = []
            self.current_row_href = ""
        elif tag in {"td", "th"} and self.in_row:
            self.cell_kind = tag
            self.cell_parts = []
            self.current_href = ""
        elif tag == "a" and self.cell_kind == "td":
            self.current_href = attributes.get("href") or ""

    def handle_data(self, data: str) -> None:
        if self.in_target_table and self.cell_kind is not None:
            self.cell_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if not self.in_target_table:
            return
        if tag in {"td", "th"} and self.cell_kind == tag:
            value = normalize_text("".join(self.cell_parts))
            if tag == "td":
                self.current_cells.append(value)
                if self.current_href and not self.current_row_href:
                    self.current_row_href = self.current_href
            else:
                self.current_headers.append(value)
            self.cell_kind = None
            self.cell_parts = []
            self.current_href = ""
        elif tag == "tr" and self.in_row:
            self._finish_row()
        elif tag == "table":
            if self.in_row:
                self._finish_row()
            self.in_target_table = False

    def _finish_row(self) -> None:
        if self.current_headers:
            self.headers = tuple(self.current_headers)
        if self.current_cells:
            self.rows.append((self.current_cells, self.current_row_href))
        self.in_row = False
        self.cell_kind = None


def _parse_integer(value: str, field_name: str) -> int:
    compact = value.replace("\xa0", " ").replace(" ", "")
    if not compact.isdigit():
        raise ValueError(f"{field_name} is not a non-negative integer: {value!r}")
    return int(compact)


def _parse_days(value: str, field_name: str) -> int:
    match = re.fullmatch(r"(\d+)\s*nap", normalize_text(value), re.IGNORECASE)
    if not match:
        raise ValueError(f"{field_name} does not use the expected '<n> nap' format: {value!r}")
    return int(match.group(1))


def _source_id_from_url(href: str) -> str:
    values = parse_qs(urlparse(href).query).get("v", [])
    if len(values) != 1:
        raise ValueError(f"Row URL has no unique 'v' source id: {href!r}")
    source_id = values[0]
    if len(source_id) < 7 or not source_id.isalnum():
        raise ValueError(f"Unexpected source id format: {source_id!r}")
    return source_id


def parse_waiting_list_html(html: str) -> list[WaitingListRow]:
    parser = _WaitingListTableParser()
    parser.feed(html)
    parser.close()

    if not parser.target_table_seen:
        raise ValueError("Expected table#tb_int was not found")
    if parser.headers != EXPECTED_HEADERS:
        raise ValueError(
            "Waiting-list table headers changed. "
            f"Expected {EXPECTED_HEADERS!r}, got {parser.headers!r}"
        )

    parsed: list[WaitingListRow] = []
    for index, (cells, href) in enumerate(parser.rows, start=1):
        if len(cells) != 7:
            raise ValueError(f"Data row {index} has {len(cells)} cells instead of 7")
        source_id = _source_id_from_url(href)
        parsed.append(
            WaitingListRow(
                source_list_id=source_id,
                source_institution_code=source_id[:4],
                procedure_code=source_id[4:7],
                variant_code=source_id[7:],
                waiting_list_name_raw=cells[0],
                region_name_raw=cells[1],
                hospital_name_raw=cells[2],
                waiting_over_60=_parse_integer(cells[3], "waiting_over_60"),
                treated_previous_6_months=_parse_integer(
                    cells[4], "treated_previous_6_months"
                ),
                median_wait_days_previous_6_months=_parse_days(
                    cells[5], "median_wait_days_previous_6_months"
                ),
                mean_wait_days_previous_6_months=_parse_days(
                    cells[6], "mean_wait_days_previous_6_months"
                ),
                source_row_url=href,
            )
        )
    return parsed
