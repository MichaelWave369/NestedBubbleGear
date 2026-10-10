from __future__ import annotations

import csv
import importlib.util
import json
import tempfile
from pathlib import Path
import unittest

HERE = Path(__file__).resolve()
ROOT = HERE.parents[1]
MOD = importlib.util.spec_from_file_location("nbg_rb3_r1_validator", ROOT / "validate_candidate.py")
assert MOD is not None and MOD.loader is not None
validator = importlib.util.module_from_spec(MOD)
MOD.loader.exec_module(validator)

RB3_MOD = importlib.util.spec_from_file_location("nbg_rb3_runner_r1", ROOT.parent / "src" / "rb3.py")
assert RB3_MOD is not None and RB3_MOD.loader is not None
runner = importlib.util.module_from_spec(RB3_MOD)
RB3_MOD.loader.exec_module(runner)


class RB3R1ExtractionTests(unittest.TestCase):
    def test_positive_source_audit(self):
        receipt = validator.validate()
        self.assertEqual(receipt["status"], "PASS_RB3_R1_PARTIAL_SOURCE_AUDIT")
        self.assertEqual(receipt["additional_rows"], 18)
        self.assertEqual(receipt["combined_candidate_rows"], 27)
        self.assertEqual(receipt["source_coverage"], 3)
        self.assertEqual(receipt["lineage_coverage"], 2)
        self.assertFalse(receipt["model_execution_authorized"])

    def test_source_identity_and_lineage_are_not_a_new_fold(self):
        _, rows = validator.read_csv(validator.CANDIDATE)
        self.assertEqual({r["lineage_id"] for r in rows}, {"L002"})
        self.assertEqual({r["source_id"] for r in rows}, {"RB2-S002", "RB2-S003"})

    def test_source_only_rows_cannot_train(self):
        with self.assertRaisesRegex(RuntimeError, "REFUSED_RB3_REAL_ROWS"):
            runner.execute(ROOT / "additional_rows.csv")

    def mutate_csv(self, mutate):
        orig = validator.CANDIDATE
        with tempfile.TemporaryDirectory() as d:
            path = Path(d) / "mutated.csv"
            fields, rows = validator.read_csv(orig)
            mutate(rows)
            with path.open("w", encoding="utf-8", newline="") as f:
                writer = csv.DictWriter(f, fieldnames=fields)
                writer.writeheader()
                writer.writerows(rows)
            try:
                validator.CANDIDATE = path
                with self.assertRaises((AssertionError, ValueError)):
                    validator.validate()
            finally:
                validator.CANDIDATE = orig

    def test_outcome_label_tamper_refused(self):
        self.mutate_csv(
            lambda rows: rows[0].__setitem__("reported_direction", "DECREASE")
        )

    def test_cross_lineage_tamper_refused(self):
        self.mutate_csv(
            lambda rows: rows[0].__setitem__("lineage_id", "L004")
        )

    def test_amplitude_unit_tamper_refused(self):
        self.mutate_csv(
            lambda rows: rows[0].__setitem__("amplitude_value_si", "1.0")
        )

    def test_missing_2014_exposure_fabrication_refused(self):
        def mutate(rows):
            target = next(r for r in rows if r["source_id"] == "RB2-S003")
            target["exposure_duration_s"] = "86400"
        self.mutate_csv(mutate)

    def test_unjustified_2016_duty_cycle_refused(self):
        self.mutate_csv(
            lambda rows: rows[0].__setitem__("duty_cycle", "1.0")
        )

    def test_clashing_outcomes_are_visible_not_silently_fixed(self):
        report = validator.validate()
        self.assertGreater(report["predictor_collision_groups_with_different_labels"], 0)

    def test_candidate_evidence_must_remain_uncertainty_labeled(self):
        evidence = validator.load_json(validator.EVIDENCE)
        self.assertEqual(evidence["review_status"], "CANDIDATE_PENDING_INDEPENDENT_REVIEW")
        self.assertTrue(all(x["raw_mean"] == "NOT_EXTRACTED" for x in evidence["records"]))


if __name__ == "__main__":
    unittest.main()
