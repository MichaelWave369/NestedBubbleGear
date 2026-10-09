from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest

HERE = Path(__file__).resolve()
MODULE_PATH = HERE.parents[1] / "src" / "rb3.py"
SPEC = importlib.util.spec_from_file_location("nbg_rb3", MODULE_PATH)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("cannot load RB3 module")
rb3 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(rb3)


class RB3ContractTests(unittest.TestCase):
    def test_static_contract(self):
        checks = rb3.static_check()
        self.assertTrue(all(checks.values()))

    def test_lineage_folds_exact(self):
        lineages = [f"L{i:03d}" for i in range(1, 12)]
        self.assertEqual(rb3.canonical_lineage_folds(lineages), rb3.EXPECTED_FOLDS)

    def test_forbidden_identity_fields_absent(self):
        features = set(rb3.NUMERIC_MULTI) | set(rb3.CATEGORICAL_MULTI)
        self.assertFalse(features & rb3.FORBIDDEN_FEATURE_FIELDS)

    def test_unknown_category_has_unk_bucket(self):
        train = [{"frequency_hz": 10, "field_type": "MAGNETIC"}]
        pp = rb3.Preprocessor(("frequency_hz",), ("field_type",)).fit(train)
        vec = pp.transform_row({"frequency_hz": 10, "field_type": "UNSEEN"})
        self.assertEqual(vec[-1], 1.0)

    def test_missing_numeric_has_indicator(self):
        pp = rb3.Preprocessor(("frequency_hz",), ()).fit([
            {"frequency_hz": 10},
            {"frequency_hz": 20},
        ])
        vec = pp.transform_row({"frequency_hz": None})
        self.assertEqual(vec[1], 1.0)

    def test_shuffled_boundary_preserves_targets(self):
        rows = rb3.synthetic_rows()[:20]
        out = rb3.shuffle_boundaries(rows, 369)
        self.assertEqual(
            [r["reported_direction"] for r in rows],
            [r["reported_direction"] for r in out],
        )
        self.assertEqual(
            sorted((r["bubble_from"], r["bubble_to"]) for r in rows),
            sorted((r["bubble_from"], r["bubble_to"]) for r in out),
        )

    def test_label_permutation_preserves_label_multiset(self):
        rows = rb3.synthetic_rows()[:40]
        out = rb3.permute_training_labels(rows, 370)
        self.assertEqual(
            sorted(r["reported_direction"] for r in rows),
            sorted(r["reported_direction"] for r in out),
        )

    def test_synthetic_positive_control(self):
        result = rb3.synthetic_control()
        self.assertTrue(result["passed"])
        self.assertGreaterEqual(result["multiparameter"]["balanced_accuracy"], 0.75)
        self.assertGreaterEqual(result["multiparameter"]["macro_f1"], 0.70)
        self.assertGreaterEqual(
            result["multiparameter"]["balanced_accuracy"]
            - result["freq_only"]["balanced_accuracy"],
            0.25,
        )

    def test_fold_partition_has_no_lineage_overlap(self):
        rows = []
        for lineage in [f"L{i:03d}" for i in range(1, 12)]:
            rows.append({"lineage_id": lineage, "reported_direction": "NULL"})
        for k in range(5):
            train, valid, test = rb3.fold_partition(rows, k)
            t = {r["lineage_id"] for r in train}
            v = {r["lineage_id"] for r in valid}
            e = {r["lineage_id"] for r in test}
            self.assertFalse(t & v)
            self.assertFalse(t & e)
            self.assertFalse(v & e)


if __name__ == "__main__":
    unittest.main()
