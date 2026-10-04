import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt2.py"
spec = importlib.util.spec_from_file_location("nbgt2", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT2Tests(unittest.TestCase):
    def result(self):
        return m.run_suite()

    def test_all_checks_pass(self):
        r = self.result()
        self.assertEqual(r["checks_passed"], 12)
        self.assertEqual(r["checks_total"], 12)
        self.assertEqual(r["verdict"], "PASS_NBGT2")

    def test_alleged_relation_not_promoted(self):
        w = self.result()["witness"]
        self.assertEqual(w["late_corroboration_relation"], "ALLEGED_LINK")
        self.assertEqual(w["late_corroboration_status"], "CORROBORATED")

    def test_contradiction_coexists(self):
        ids = set(self.result()["witness"]["middle_assertion_ids"])
        self.assertIn("T03_ALLEGED_LINK", ids)
        self.assertIn("T04_CONTRADICTION", ids)

    def test_late_corroboration_is_bitemporal(self):
        w = self.result()["witness"]
        self.assertNotIn("T05_LATE_CORROBORATION", w["early_assertion_ids"])
        self.assertIn("T05_LATE_CORROBORATION", w["late_assertion_ids"])

    def test_temporal_composition_stays_temporal(self):
        d = self.result()["witness"]["temporal_composition"]
        self.assertEqual(d["status"], "COMPOSED_EXPLICIT_RULE")
        self.assertEqual(d["derived"]["relation"], "OCCURRED_BEFORE")
        self.assertNotEqual(d["derived"]["relation"], "INFERRED_INFLUENCE")

    def test_incompatible_composition_refused(self):
        d = self.result()["witness"]["forbidden_composition"]
        self.assertEqual(d["status"], "REFUSE_UNTYPED_COMPOSITION")
        self.assertIsNone(d["derived"])

    def test_keyhole_is_explicit(self):
        r = self.result()["receipts"]["keyhole"]
        self.assertEqual(r["projection"], "EXPLICIT_KEYHOLE")
        self.assertEqual(set(r["allowed_relations"]), {"DOCUMENTED_INTERACTION", "OCCURRED_BEFORE"})

    def test_counterfactual_is_separate(self):
        r = self.result()["receipts"]
        self.assertEqual(r["late"]["mode"], "OBSERVED")
        self.assertEqual(r["counterfactual"]["mode"], "COUNTERFACTUAL")
        self.assertEqual(r["counterfactual"]["excluded_assertion_ids"], ["T03_ALLEGED_LINK"])

    def test_input_order_is_irrelevant(self):
        assertions = m.frozen_assertions()
        a = m.replay(assertions, world_cutoff=5, knowledge_cutoff=5)
        b = m.replay(m.reordered_equivalent(assertions), world_cutoff=5, knowledge_cutoff=5)
        self.assertEqual(m.canonical(a), m.canonical(b))

    def test_invalid_relation_refused(self):
        e = m.frozen_assertions()[0]
        e = dict(e)
        e["relation"] = "SECRETLY_CAUSED_BY"
        with self.assertRaises(ValueError):
            m.validate_assertion(e)

    def test_replay_exact(self):
        self.assertEqual(m.canonical(self.result()), m.canonical(self.result()))

    def test_sources_are_canonicalized(self):
        r = self.result()["receipts"]["late"]
        alleged = next(a for a in r["assertions"] if a["assertion_id"] == "T03_ALLEGED_LINK")
        self.assertEqual(alleged["sources"], sorted(alleged["sources"]))


if __name__ == "__main__":
    unittest.main()
