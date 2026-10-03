import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah26.py"
spec=importlib.util.spec_from_file_location("ah26",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH26Tests(unittest.TestCase):
    def receipts(self):
        return m.run_sequence()

    def test_raw_sequence(self):
        self.assertEqual(tuple(r["raw_status"] for r in self.receipts()),m.EXPECTED_RAW)

    def test_governed_sequence(self):
        self.assertEqual(tuple(r["governed_state"] for r in self.receipts()),m.EXPECTED_GOVERNED)

    def test_sample_sizes(self):
        self.assertEqual(tuple(r["stats"]["N"] for r in self.receipts()),(25,650,1150,1650,314150,314775))

    def test_marginals_stay_matched(self):
        for r in self.receipts():
            self.assertAlmostEqual(r["stats"]["p1"],0.24,places=12)
            self.assertAlmostEqual(r["stats"]["p3"],0.24,places=12)

    def test_assumed_reliability_stays_constant(self):
        for r in self.receipts():
            self.assertAlmostEqual(r["independence_assumed_reliability"],0.84816,places=12)

    def test_observed_reliability_trace(self):
        for a,b in zip((r["observed_dual_reliability"] for r in self.receipts()),m.EXPECTED_RELIABILITY):
            self.assertAlmostEqual(a,b,places=12)

    def test_pending_escalation_before_activation(self):
        r=self.receipts()
        self.assertEqual(r[2]["governed_state"],"PENDING_ESCALATION")
        self.assertFalse(r[2]["alert_active"])
        self.assertEqual(r[3]["governed_state"],"ACTIVE_ALERT")
        self.assertTrue(r[3]["alert_active"])

    def test_active_alert_survives_one_compatible_state(self):
        r=self.receipts()
        self.assertEqual(r[4]["raw_status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(r[4]["governed_state"],"ACTIVE_PENDING_CLEAR")
        self.assertTrue(r[4]["alert_active"])

    def test_two_compatible_states_clear(self):
        r=self.receipts()
        self.assertEqual(r[5]["governed_state"],"CLEARED_AFTER_PERSISTENCE")
        self.assertFalse(r[5]["alert_active"])

    def test_naive_alert_flaps_earlier(self):
        self.assertEqual(tuple(r["naive_alert"] for r in self.receipts()),(False,False,True,True,False,False))

    def test_B4_overstatement(self):
        r=self.receipts()[3]
        self.assertAlmostEqual(r["independence_assumed_reliability"]-r["observed_dual_reliability"],0.07906909090909091,places=12)

    def test_B2_and_B5_are_compatible(self):
        r=self.receipts()
        self.assertEqual(r[1]["raw_status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(r[4]["raw_status"],"INDEPENDENCE_COMPATIBLE")

    def test_replay_is_exact(self):
        a=m.run_sequence()
        b=m.run_sequence()
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_receipt_hashes_are_replay_exact(self):
        a=m.run_sequence()
        b=m.run_sequence()
        self.assertEqual([x["receipt_sha256"] for x in a],[x["receipt_sha256"] for x in b])

    def test_compatible_is_not_called_proven(self):
        for r in self.receipts():
            self.assertNotIn("PROVEN",r["raw_status"])

if __name__=="__main__":
    unittest.main()
