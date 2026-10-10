from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r5_e5", ROOT / "bound_audit.py")
assert SPEC and SPEC.loader
bound = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(bound)


class CandidateOracleCeilingTests(unittest.TestCase):
    def setUp(self):
        self.policy = bound.json_file(bound.POLICY)
        self.rows = bound.e4.read_rows()
        self.folds = bound.fold_map_from_original()

    def reject(self, change, error):
        policy = copy.deepcopy(self.policy)
        rows = copy.deepcopy(self.rows)
        folds = copy.deepcopy(self.folds)
        change(policy, rows, folds)
        with self.assertRaisesRegex(ValueError, error):
            bound.checked_bound(policy, rows, folds)

    def test_exact_candidate_ceiling_and_no_model_run(self):
        result = bound.audit()
        self.assertEqual(result["status"], bound.BOUND_STATUS)
        self.assertEqual(result["candidate_rows"], 64)
        self.assertEqual(result["unique_frozen_feature_vectors"], 57)
        self.assertEqual(result["mixed_label_groups"], 4)
        self.assertEqual(result["mixed_label_rows"], 10)
        self.assertEqual(result["oracle_best_correct_with_true_labels"], 60)
        self.assertEqual(result["unavoidable_in_sample_errors"], 4)
        self.assertEqual(result["optimistic_in_sample_upper_bound_pct"], 93.75)
        self.assertIsNone(result["heldout_accuracy"])
        self.assertIsNone(result["actual_trained_model_metrics"])
        self.assertFalse(result["real_model_execution_authorized"])

    def test_l002_lineage_oracle_bound(self):
        rows = [r for r in self.rows if r["lineage_id"] == "L002"]
        b = bound.group_bound(rows)
        self.assertEqual(b["candidate_rows"], 18)
        self.assertEqual(b["oracle_best_correct"], 14)
        self.assertEqual(b["oracle_unavoidable_errors"], 4)
        self.assertEqual(b["oracle_ceiling_fraction"], "14/18")

    def test_original_five_folds_and_missing_sources(self):
        folds = bound.audit()["test_folds"]
        self.assertEqual([f["candidate_rows"] for f in folds], [27, 3, 14, 11, 9])
        self.assertEqual([f["missing_lineages"] for f in folds],
                         [["L005"], ["L006"], [], [], ["L010"]])
        self.assertTrue(all(f["not_a_cross_validation_result"] for f in folds))
        self.assertEqual(folds[0]["oracle_upper_bound_fraction"], "23/27")
        self.assertEqual(folds[0]["unavoidable_candidate_errors"], 4)

    def test_bound_math_for_identical_inputs(self):
        miniature = [
            {"row_id": "a", "source_id":"TEST", "lineage_id":"TEST", "reported_direction": "INCREASE",
             **{field: "x" for field in bound.previous.MODEL_FIELDS}},
            {"row_id": "b", "source_id":"TEST", "lineage_id":"TEST", "reported_direction": "NULL",
             **{field: "x" for field in bound.previous.MODEL_FIELDS}},
            {"row_id": "c", "source_id":"TEST", "lineage_id":"TEST", "reported_direction": "INCREASE",
             **{field: "x" for field in bound.previous.MODEL_FIELDS}},
        ]
        result = bound.group_bound(miniature)
        self.assertEqual(result["oracle_best_correct"], 2)
        self.assertEqual(result["oracle_unavoidable_errors"], 1)
        self.assertEqual(result["opposing_label_groups"], 1)

    def test_falsified_accuracy_raises(self):
        self.reject(lambda p, rs, fs:
                    p["mathematical_bound"].__setitem__("oracle_accuracy_upper_bound_pct", 100),
                    "oracle percentage changed")

    def test_falsified_oracle_numerator_raises(self):
        self.reject(lambda p, rs, fs:
                    p["mathematical_bound"].__setitem__("oracle_best_correct", 64),
                    "oracle numerator changed")

    def test_removing_inconvenient_null_row_refused(self):
        self.reject(lambda p, rs, fs:
                    rs.__setitem__(slice(None), [
                        r for r in rs if r["row_id"] != "RB3R1-S002-04"
                    ]),
                    "candidate number changed")

    def test_relabeling_2014_sox2_refused(self):
        def edit(p, rs, fs):
            next(x for x in rs if x["row_id"] == "RB3R1-S003-14")["reported_direction"] = "INCREASE"
        self.reject(edit, "original R5 E4 collision accounting changed")

    def test_reassigning_l002_to_different_fold_refused(self):
        def edit(p, rs, fs):
            fs[0] = tuple(x for x in fs[0] if x != "L002")
            fs[1] = fs[1] + ("L002",)
        self.reject(edit, "fold reassignment")

    def test_inventing_l005_candidate_refused(self):
        def edit(p, rs, fs):
            rs[0]["lineage_id"] = "L005"
        self.reject(edit, "lineage coverage changed")

    def test_oracle_cannot_be_presented_as_independently_reviewed(self):
        self.reject(lambda p, rs, fs:
                    p["scientific_gates"].__setitem__("independent_review_attestations", 1),
                    "independent review approval fabricated")

    def test_execution_permission_cannot_be_enabled(self):
        self.reject(lambda p, rs, fs:
                    p["scientific_gates"].__setitem__("real_execution_authorized", True),
                    "real model execution authorized")

    def test_heldout_accuracy_claim_cannot_be_enabled(self):
        self.reject(lambda p, rs, fs:
                    p["scientific_gates"].__setitem__("no_heldout_accuracy_claim", False),
                    "scientific claim firewall disabled")

    def test_no_predictor_can_be_invented_posthoc(self):
        self.reject(lambda p, rs, fs:
                    p["scientific_gates"].__setitem__("no_posthoc_predictor_extension", False),
                    "scientific claim firewall disabled")

    def test_missing_source_lineage_cannot_be_hidden(self):
        self.reject(lambda p, rs, fs:
                    p["missing_lineage_map"].__setitem__("0", []),
                    "hidden incomplete lineage coverage")

    def test_pretending_there_are_extra_source_papers_refused(self):
        self.reject(lambda p, rs, fs:
                    p.__setitem__("candidate_source_count", 14),
                    "source coverage changed")

    def test_markdown_explicitly_disclaims_trained_score(self):
        md = bound.markdown(bound.audit())
        self.assertIn("NOT A TRAINED MODEL", md)
        self.assertIn("60/64 (93.75%)", md)
        self.assertIn("23/27", md)

    def test_original_candidate_fit_remains_refused(self):
        with self.assertRaisesRegex(RuntimeError, "REFUSED_RB3_REAL_ROWS"):
            bound.frozen.execute(bound.RB3 / "R0/candidate_rows.csv")


if __name__ == "__main__":
    unittest.main()
