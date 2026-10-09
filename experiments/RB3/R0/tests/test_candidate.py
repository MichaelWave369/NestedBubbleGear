from __future__ import annotations

import csv
import importlib.util
import tempfile
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
RB3 = ROOT.parent
SPEC = importlib.util.spec_from_file_location("rb3_r0_validator", ROOT / "validate_candidate.py")
assert SPEC and SPEC.loader
validator = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(validator)

RUN_SPEC = importlib.util.spec_from_file_location("rb3_r0_runner", RB3 / "src" / "rb3.py")
assert RUN_SPEC and RUN_SPEC.loader
runner = importlib.util.module_from_spec(RUN_SPEC)
RUN_SPEC.loader.exec_module(runner)


class CandidateAuditTests(unittest.TestCase):
    def test_known_source_rows_pass(self):
        receipt = validator.audit()
        self.assertEqual(receipt["candidate_row_count"], 9)
        self.assertEqual(receipt["source_coverage"], 1)
        self.assertEqual(receipt["lineage_coverage"], 1)
        self.assertFalse(receipt["model_execution_authorized"])
        self.assertEqual(receipt["status"], "PASS_RB3_R0_PARTIAL_EXTRACTION_AUDIT")

    def test_candidate_cannot_execute(self):
        with self.assertRaisesRegex(RuntimeError, "REFUSED_RB3_REAL_ROWS"):
            runner.execute(ROOT / "candidate_rows.csv")

    def test_unknown_lineage_cannot_enter_train(self):
        with self.assertRaisesRegex(ValueError, "unknown RB2 lineage"):
            runner.fold_partition(
                [{"lineage_id": "L999", "reported_direction": "NULL"}], 0
            )

    def mutate_csv_and_expect_refusal(self, mutate):
        original = validator.CSV_PATH
        with tempfile.TemporaryDirectory() as directory:
            tmp = Path(directory) / "candidate_rows.csv"
            with original.open(encoding="utf-8", newline="") as handle:
                rows = list(csv.DictReader(handle))
            mutate(rows)
            with tmp.open("w", encoding="utf-8", newline="") as handle:
                writer = csv.DictWriter(handle, fieldnames=validator.EXTRACTION_COLUMNS)
                writer.writeheader()
                writer.writerows(rows)
            try:
                validator.CSV_PATH = tmp
                with self.assertRaises((AssertionError, ValueError)):
                    validator.audit()
            finally:
                validator.CSV_PATH = original

    def test_source_lineage_mismatch_refused(self):
        self.mutate_csv_and_expect_refusal(
            lambda rows: rows[0].__setitem__("lineage_id", "L005")
        )

    def test_out_of_manifest_amplitude_refused(self):
        self.mutate_csv_and_expect_refusal(
            lambda rows: rows[0].__setitem__("amplitude_original", "4 mT")
        )

    def test_outcome_tampering_refused(self):
        self.mutate_csv_and_expect_refusal(
            lambda rows: rows[0].__setitem__("reported_direction", "INCREASE")
        )

    def test_si_unit_conversion_refused(self):
        self.mutate_csv_and_expect_refusal(
            lambda rows: rows[0].__setitem__("amplitude_value_si", "0.2")
        )

    def test_null_is_not_equivalence(self):
        receipt = validator.audit()
        self.assertIn("sha256", "".join(receipt.keys()))
        self.assertNotIn("scientific_result", receipt)


if __name__ == "__main__":
    unittest.main()
