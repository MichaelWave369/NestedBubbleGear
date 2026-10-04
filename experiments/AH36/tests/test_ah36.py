import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah36.py"
spec=importlib.util.spec_from_file_location("ah36",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH36Tests(unittest.TestCase):
    def receipts(self):
        return m.run_sequence()

    def test_six_events(self):
        self.assertEqual(len(self.receipts()),6)

    def test_collapse_at_E3(self):
        r=self.receipts()
        self.assertGreater(r[2]["current_residual_privacy_bits"],0)
        self.assertAlmostEqual(r[3]["current_residual_privacy_bits"],0.0,places=12)

    def test_revocation_restores_authority_view(self):
        e4=self.receipts()[4]
        self.assertAlmostEqual(e4["authority_residual_privacy_bits"],0.4,places=12)

    def test_revocation_does_not_mutate_current_value(self):
        e4=self.receipts()[4]
        self.assertAlmostEqual(e4["current_residual_privacy_bits"],0.0,places=12)
        self.assertEqual(e4["alignment_status"],"REVOKED_BUT_STALE_DISCLOSURE_PRESENT")

    def test_revocation_emits_no_snapshot(self):
        e4=self.receipts()[4]
        self.assertFalse(e4["release_snapshot_emitted"])
        self.assertEqual(e4["ledger_snapshot_count"],4)

    def test_explicit_downgrade_restores_current_privacy(self):
        e5=self.receipts()[5]
        self.assertAlmostEqual(e5["current_residual_privacy_bits"],0.4,places=12)
        self.assertEqual(e5["alignment_status"],"AUTHORITY_AND_CURRENT_ALIGNED")

    def test_historical_ledger_stays_collapsed(self):
        r=self.receipts()
        for e in r[3:]:
            self.assertAlmostEqual(e["ledger_residual_privacy_bits"],0.0,places=12)

    def test_ledger_privacy_nonincreasing(self):
        vals=[x["ledger_residual_privacy_bits"] for x in self.receipts()]
        for a,b in zip(vals,vals[1:]):
            self.assertLessEqual(b,a+1e-12)

    def test_current_privacy_can_recover(self):
        vals=[x["current_residual_privacy_bits"] for x in self.receipts()]
        self.assertAlmostEqual(vals[3],0.0,places=12)
        self.assertAlmostEqual(vals[4],0.0,places=12)
        self.assertGreater(vals[5],0.0)

    def test_fresh_vs_historical_observer(self):
        p=m.build_panels()
        e5=self.receipts()[5]
        fresh=m.descriptor_stats(p,tuple(e5["current_profile"]))
        history=m.ledger_stats(p,[tuple(m.EVENTS[i]["current"]) for i in (0,1,2,3,5)])
        self.assertAlmostEqual(fresh["residual_privacy_bits"],0.4,places=12)
        self.assertAlmostEqual(history["residual_privacy_bits"],0.0,places=12)

    def test_history_projection_control(self):
        p=m.build_panels()
        final=tuple(self.receipts()[5]["current_profile"])
        projected=m.ledger_stats(p,[final])
        self.assertAlmostEqual(projected["residual_privacy_bits"],0.4,places=12)

    def test_E3_profile_is_minimal_collapse_path(self):
        self.assertEqual(self.receipts()[3]["current_profile"],[
            m.TRIAGE,m.COMMON_ONLY,m.FULL_STATUS,m.COMMON_ONLY,m.COMMON_ONLY
        ])

    def test_E5_profile_is_downgraded(self):
        self.assertEqual(self.receipts()[5]["current_profile"],[
            m.COMMON_ONLY,m.COMMON_ONLY,m.FULL_STATUS,m.COMMON_ONLY,m.COMMON_ONLY
        ])

    def test_descriptor_class_sequences(self):
        r=self.receipts()
        self.assertEqual(tuple(x["authority_descriptor_classes"] for x in r),(5,6,7,9,7,7))
        self.assertEqual(tuple(x["current_descriptor_classes"] for x in r),(5,6,7,9,9,7))
        self.assertEqual(tuple(x["ledger_descriptor_classes"] for x in r),(5,6,7,9,9,9))

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_sequence()),m.canonical(m.run_sequence()))

if __name__=="__main__":
    unittest.main()