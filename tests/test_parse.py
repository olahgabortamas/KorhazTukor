from __future__ import annotations

import unittest
from pathlib import Path

from collector.parse import parse_waiting_list_html
from collector.validate import validate_rows


FIXTURES = Path(__file__).parents[1] / "fixtures"


class ParseWaitingListHtmlTests(unittest.TestCase):
    def test_parses_valid_rows_and_preserves_codes(self) -> None:
        html = (FIXTURES / "neak_valid.html").read_text(encoding="utf-8")
        rows = parse_waiting_list_html(html)

        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0].source_list_id, "1122001")
        self.assertEqual(rows[0].source_institution_code, "1122")
        self.assertEqual(rows[0].procedure_code, "001")
        self.assertEqual(rows[0].waiting_over_60, 497)
        self.assertEqual(rows[0].median_wait_days_previous_6_months, 105)
        self.assertEqual(rows[1].procedure_code, "O20")
        self.assertEqual(rows[1].variant_code, "M")
        self.assertEqual(rows[1].median_wait_days_previous_6_months, 0)
        self.assertIn("STRONGLY_SKEWED", rows[1].quality_flags())

    def test_missing_target_table_fails(self) -> None:
        with self.assertRaisesRegex(ValueError, "table#tb_int"):
            parse_waiting_list_html("<html><table id='other'></table></html>")

    def test_changed_header_fails_closed(self) -> None:
        html = (FIXTURES / "neak_valid.html").read_text(encoding="utf-8")
        html = html.replace("Várólista neve", "Új fejléc", 1)
        with self.assertRaisesRegex(ValueError, "headers changed"):
            parse_waiting_list_html(html)

    def test_invalid_numeric_value_fails(self) -> None:
        html = (FIXTURES / "neak_valid.html").read_text(encoding="utf-8")
        html = html.replace("<td>497</td>", "<td>nincs adat</td>", 1)
        with self.assertRaisesRegex(ValueError, "waiting_over_60"):
            parse_waiting_list_html(html)

    def test_validation_rejects_duplicate_ids(self) -> None:
        html = (FIXTURES / "neak_valid.html").read_text(encoding="utf-8")
        rows = parse_waiting_list_html(html)
        with self.assertRaisesRegex(ValueError, "Duplicate source ids"):
            validate_rows(rows + [rows[0]], min_rows=1, max_rows=10)

    def test_validation_rejects_large_row_count_change(self) -> None:
        html = (FIXTURES / "neak_valid.html").read_text(encoding="utf-8")
        rows = parse_waiting_list_html(html)
        with self.assertRaisesRegex(ValueError, "changed by"):
            validate_rows(
                rows,
                min_rows=1,
                max_rows=10,
                previous_row_count=10,
            )


if __name__ == "__main__":
    unittest.main()
