from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True, slots=True)
class WaitingListRow:
    source_list_id: str
    source_institution_code: str
    procedure_code: str
    variant_code: str
    waiting_list_name_raw: str
    region_name_raw: str
    hospital_name_raw: str
    waiting_over_60: int
    treated_previous_6_months: int
    median_wait_days_previous_6_months: int
    mean_wait_days_previous_6_months: int
    source_row_url: str

    def as_dict(self) -> dict[str, str | int]:
        return asdict(self)

    def quality_flags(self) -> tuple[str, ...]:
        flags: list[str] = []
        if self.treated_previous_6_months < 20:
            flags.append("LOW_SAMPLE")
        if (
            self.median_wait_days_previous_6_months == 0
            and self.mean_wait_days_previous_6_months > 30
        ):
            flags.append("STRONGLY_SKEWED")
        if (
            abs(
                self.mean_wait_days_previous_6_months
                - self.median_wait_days_previous_6_months
            )
            > 60
        ):
            flags.append("HIGH_MEAN_MEDIAN_GAP")
        return tuple(flags)
