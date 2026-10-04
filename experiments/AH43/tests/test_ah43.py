import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah43.py"
spec=importlib.util.spec_from_file_location("ah43",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH43Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_ttl_two(self):
        self.assertEqual(self.result()["ttl_epochs"],2)

    def test_stable_status_sequence(self):
        s=self.result()["stable_timeline"]
        self.assertEqual([x["certificate_status"] for x in s],[
            "CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFICATE_STALE","CERTIFIED_FRESH"
        ])

    def test_stable_revalidation_restores(self):
        s=self.result()["stable_timeline"]
        self.assertFalse(s[3]["advertise_independent_quorum"])
        self.assertTrue(s[4]["advertise_independent_quorum"])
        self.assertEqual(s[4]["action"],"REVALIDATED_INDEPENDENT")

    def test_hidden_fusion_inside_fresh_window(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[2]["certificate_status"],"CERTIFIED_FRESH")
        self.assertEqual(f[2]["ground_truth_consistency"],"FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED")

    def test_hidden_fusion_actual_thresholds_change_immediately(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[2]["actual_verification_root_threshold"],1)
        self.assertEqual(f[2]["actual_declassification_root_threshold"],2)

    def test_old_advertised_thresholds_remain_until_expiry(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[2]["advertised_verification_threshold"],2)
        self.assertEqual(f[2]["advertised_declassification_threshold"],3)

    def test_expiry_refuses_old_claim(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[3]["certificate_status"],"CERTIFICATE_STALE")
        self.assertFalse(f[3]["advertise_independent_quorum"])
        self.assertIsNone(f[3]["advertised_declassification_threshold"])

    def test_revalidation_discovers_shared_control(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[4]["certificate_status"],"SHARED_CONTROL_OBSERVED")
        self.assertEqual(f[4]["action"],"REVALIDATION_DISCOVERED_SHARED_CONTROL")
        self.assertFalse(f[4]["advertise_independent_quorum"])

    def test_stale_not_contradicted(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertEqual(f[3]["certificate_status"],"CERTIFICATE_STALE")
        self.assertEqual(f[4]["certificate_status"],"SHARED_CONTROL_OBSERVED")

    def test_exactly_one_false_advertisement_epoch(self):
        f=self.result()["hidden_fusion_timeline"]
        bad=[x for x in f if x["advertise_independent_quorum"] and
             x["ground_truth_consistency"]=="FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED"]
        self.assertEqual([x["event_id"] for x in bad],["F2"])

    def test_ttl_sensitivity(self):
        self.assertEqual(
            self.result()["ttl_sensitivity_false_advertisement_epochs"],
            {"0":0,"1":0,"2":1,"3":2}
        )

    def test_independent_reliability(self):
        s=self.result()["stable_timeline"]
        self.assertTrue(all(abs(x["verification_reliability_p0_1"]-0.972)<1e-12 for x in s))
        self.assertTrue(all(abs(x["declassification_reliability_p0_1"]-0.729)<1e-12 for x in s))

    def test_shared_reliability_after_fusion(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertTrue(all(abs(x["verification_reliability_p0_1"]-0.9)<1e-12 for x in f[2:]))
        self.assertTrue(all(abs(x["declassification_reliability_p0_1"]-0.81)<1e-12 for x in f[2:]))

    def test_stale_has_no_effective_verified_threshold(self):
        f=self.result()["hidden_fusion_timeline"]
        self.assertIsNone(f[3]["effective_verified_verification_threshold"])
        self.assertIsNone(f[3]["effective_verified_declassification_threshold"])

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()
