from __future__ import annotations

import csv
import importlib.util
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("nbg_rb3_r2_validator", ROOT / "validate_candidate.py")
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("R2 validator loading failed")
v = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v)

RUN_SPEC = importlib.util.spec_from_file_location("nbg_rb3_runner_for_r2", ROOT.parent / "src" / "rb3.py")
if RUN_SPEC is None or RUN_SPEC.loader is None:
    raise RuntimeError("RB3 runner loading failed")
runner = importlib.util.module_from_spec(RUN_SPEC)
RUN_SPEC.loader.exec_module(runner)


class RB3R2AuditTests(unittest.TestCase):
    def test_static_receipt(self):
        result = v.validate()
        self.assertEqual(result["status"], "PASS_RB3_R2_CROSS_LINEAGE_PARTIAL_AUDIT")
        self.assertEqual(result["new_rows"], 29)
        self.assertEqual(result["combined_rows"], 56)
        self.assertEqual(result["source_count"], 6)
        self.assertEqual(result["lineage_count"], 5)
        self.assertFalse(result["model_execution_authorized"])

    def test_unfrozen_real_fit_refused(self):
        with self.assertRaisesRegex(RuntimeError, "REFUSED_RB3_REAL_ROWS"):
            runner.execute(ROOT / "additional_rows.csv")

    def test_comparison_classes_include_positive_decreased_and_null(self):
        _, rows = v.load_csv(v.CANDIDATE)
        labels = {x["reported_direction"] for x in rows}
        self.assertEqual(labels, {"INCREASE", "DECREASE", "NULL"})
        self.assertEqual(
            {x["lineage_id"] for x in rows},
            {"L004", "L007", "L008"},
        )

    def mutate_and_refuse(self, edit):
        original = v.CANDIDATE
        with tempfile.TemporaryDirectory() as directory:
            modified = Path(directory) / "modified.csv"
            fields, rows = v.load_csv(original)
            edit(rows)
            with modified.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
            try:
                v.CANDIDATE = modified
                with self.assertRaises((AssertionError, ValueError)):
                    v.validate()
            finally:
                v.CANDIDATE = original

    def test_refuse_invented_frequency(self):
        self.mutate_and_refuse(
            lambda rows: rows[0].__setitem__("frequency_hz", "7.83")
        )

    def test_refuse_amplitude_si_mismatch(self):
        self.mutate_and_refuse(
            lambda rows: rows[0].__setitem__("amplitude_value_si", "5")
        )

    def test_refuse_source_lineage_swap(self):
        self.mutate_and_refuse(
            lambda rows: rows[0].__setitem__("lineage_id", "L007")
        )

    def test_refuse_outcome_flip(self):
        self.mutate_and_refuse(
            lambda rows: rows[0].__setitem__("reported_direction", "NULL")
        )

    def test_refuse_fourth_significant_fibroblast_arm_flip(self):
        def edit(rows):
            target = next(
                row for row in rows
                if row["source_id"] == "RB2-S010"
                and row["frequency_hz"] == "50"
                and row["amplitude_original"] == "0.5 mT"
                and row["endpoint_class"] == "PROLIFERATION"
            )
            target["reported_direction"] = "DECREASE"
            target["reported_significance"] = "SIGNIFICANT"
        self.mutate_and_refuse(edit)

    def test_refuse_erasure_of_harmonic_confounds(self):
        def edit(rows):
            target = next(row for row in rows if row["source_id"] == "RB2-S010")
            target["waveform"] = "SINUSOIDAL"
        self.mutate_and_refuse(edit)

    def test_refuse_invented_duty(self):
        self.mutate_and_refuse(
            lambda rows: rows[0].__setitem__("duty_cycle", "1")
        )

    def test_refuse_cancer_to_normal_cell_promotion(self):
        def edit(rows):
            target = next(row for row in rows if row["source_id"] == "RB2-S011")
            target["sample_class"] = "NORMAL_HUMAN_STEM_CELLS"
        self.mutate_and_refuse(edit)

    def test_source_specific_null_semantics(self):
        _, rows = v.load_csv(v.CANDIDATE)
        self.assertTrue(all(
            row["reported_significance"] == "NOT_REPORTED"
            for row in rows if row["source_id"] == "RB2-S011"
        ))
        self.assertTrue(all(
            row["reported_direction"] == "NULL"
            for row in rows
            if row["source_id"] == "RB2-S010" and row["endpoint_class"] == "SURVIVAL"
        ))


if __name__ == "__main__":
    unittest.main()
