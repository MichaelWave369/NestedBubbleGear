import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt1.py"
spec = importlib.util.spec_from_file_location("nbgt1", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)

class NBGT1Tests(unittest.TestCase):
    def result(self):
        return m.run_suite()

    def test_all_checks_pass(self):
        r = self.result()
        self.assertEqual(r["checks_passed"], 10)
        self.assertEqual(r["checks_total"], 10)
        self.assertEqual(r["verdict"], "PASS_NBGT1")

    def test_coarse_keyhole_collapses_histories(self):
        w = self.result()["witness"]
        self.assertEqual(w["coarse_a_t2"], w["coarse_b_t2"])
        self.assertEqual(w["coarse_a_t2"], {"macro": {"status": "READY"}})

    def test_full_state_retains_lineage_difference(self):
        w = self.result()["witness"]
        self.assertNotEqual(w["full_a_t2"], w["full_b_t2"])
        self.assertEqual(w["full_a_t2"]["latent"]["route"], "NORTH")
        self.assertEqual(w["full_b_t2"]["latent"]["route"], "SOUTH")

    def test_future_probe_reveals_residue(self):
        w = self.result()["witness"]
        self.assertEqual(w["probe_a_t3"], "NORTH")
        self.assertEqual(w["probe_b_t3"], "SOUTH")

    def test_late_evidence_is_bitemporal(self):
        w = self.result()["witness"]
        self.assertFalse(w["late_claim_visible_k2"])
        self.assertTrue(w["late_claim_visible_k4"])

    def test_counterfactual_is_explicit(self):
        r = self.result()["receipts"]["counterfactual_without_A1"]
        self.assertEqual(r["mode"], "COUNTERFACTUAL")
        self.assertEqual(r["excluded_event_ids"], ["A1_ROUTE"])
        self.assertEqual(r["state"]["observations"][-1]["value"], "UNKNOWN")

    def test_invalid_future_knowledge_order_refused(self):
        e = {
            "event_id": "BAD",
            "valid_time": 5,
            "known_time": 4,
            "kind": "SET_MACRO",
            "payload": {"key": "x", "value": 1},
            "provenance": "TEST",
        }
        with self.assertRaises(ValueError):
            m.validate_event(e)

    def test_invalid_evidence_status_refused(self):
        e = {
            "event_id": "BAD_CLAIM",
            "valid_time": 1,
            "known_time": 1,
            "kind": "ASSERT_CLAIM",
            "payload": {
                "claim_id": "C",
                "subject": "s",
                "predicate": "p",
                "object": "o",
            },
            "provenance": "TEST",
            "evidence_status": "TOTALLY_TRUE_BRO",
            "sources": [],
        }
        with self.assertRaises(ValueError):
            m.validate_event(e)

    def test_replay_exact(self):
        a, _ = m.frozen_histories()
        r1 = m.replay(a, world_cutoff=3, knowledge_cutoff=3)
        r2 = m.replay(a, world_cutoff=3, knowledge_cutoff=3)
        self.assertEqual(m.canonical(r1), m.canonical(r2))

    def test_counterfactual_replay_exact(self):
        a, _ = m.frozen_histories()
        r1 = m.replay(
            a, world_cutoff=3, knowledge_cutoff=3, exclude_event_ids=("A1_ROUTE",)
        )
        r2 = m.replay(
            a, world_cutoff=3, knowledge_cutoff=3, exclude_event_ids=("A1_ROUTE",)
        )
        self.assertEqual(m.canonical(r1), m.canonical(r2))

if __name__ == "__main__":
    unittest.main()
