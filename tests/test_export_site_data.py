from __future__ import annotations

import csv
import gzip
import tempfile
import unittest
from pathlib import Path

from collector.export_site_data import build_site_data


class ExportSiteDataTests(unittest.TestCase):
    def test_builds_procedure_and_hospital_aggregates(self) -> None:
        fields = [
            "captured_date", "source_list_id", "source_institution_code",
            "procedure_code", "variant_code", "waiting_list_name_raw",
            "region_name_raw", "hospital_name_raw", "waiting_over_60",
            "treated_previous_6_months", "median_wait_days_previous_6_months",
            "mean_wait_days_previous_6_months", "source_row_url",
        ]
        rows = [
            ["2026-08-24", "AAAAO20", "AAAA", "O20", "", "Térdprotézis műtét", "Régió", "Kórház A", "20", "30", "40", "50", "https://example.test/?v=AAAAO20"],
            ["2026-08-24", "BBBBO20", "BBBB", "O20", "", "Térdprotézis műtét", "Régió", "Kórház B", "10", "5", "0", "100", "https://example.test/?v=BBBBO20"],
        ]
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "snapshots/2026/08/2026-08-24.csv.gz"
            path.parent.mkdir(parents=True)
            with gzip.open(path, "wt", encoding="utf-8", newline="") as target:
                writer = csv.writer(target)
                writer.writerow(fields)
                writer.writerows(rows)
            result = build_site_data(Path(temporary))

        self.assertEqual(result["summary"]["reporting_hospitals"], 2)
        self.assertEqual(result["summary"]["waiting_over_60"], 30)
        self.assertEqual(result["procedures"][0]["name"], "Térdprotézis műtét")
        self.assertEqual(result["procedures"][0]["flagged_list_count"], 1)
        self.assertEqual(
            result["procedures"][0]["rows"][0]["history"][0]["waiting_over_60"],
            20,
        )
        self.assertEqual(len(result["hospitals"]), 2)
