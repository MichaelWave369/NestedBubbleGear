import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah44.py"
spec=importlib.util.spec_from_file_location("ah44",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH44Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_six_controls(self):
        self.assertEqual(len(self.result()["controls"]),6)

    def test_ttl_only_false_window_one(self):
        self.assertEqual(self.result()["summaries"]["TTL_ONLY"]["false_advertisement_epochs"],1)

    def test_immediate_event_zero_window(self):
        self.assertEqual(self.result()["summaries"]["TRUSTED_IMMEDIATE"]["false_advertisement_epochs"],0)

    def test_immediate_revokes_pending_revalidation(self):
        x=self.result()["controls"]["TRUSTED_IMMEDIATE"][2]
        self.assertEqual(x["certificate_status"],"INDEPENDENCE_REVOKED_PENDING_REVALIDATION")
        self.assertFalse(x["advertise_independent_quorum"])

    def test_immediate_does_not_claim_shared_yet(self):
        x=self.result()["controls"]["TRUSTED_IMMEDIATE"][2]
        self.assertNotEqual(x["certificate_status"],"SHARED_CONTROL_OBSERVED")

    def test_delayed_event_one_epoch_window(self):
        r=self.result()
        self.assertEqual(r["summaries"]["TRUSTED_DELAYED_1"]["false_advertisement_epochs"],1)
        self.assertEqual(r["summaries"]["TRUSTED_DELAYED_1"]["revocation_latency_epochs"],1)

    def test_missing_event_matches_ttl_only(self):
        r=self.result()["summaries"]
        self.assertEqual(r["MISSING_EVENT"]["false_advertisement_epochs"],r["TTL_ONLY"]["false_advertisement_epochs"])

    def test_false_positive_conservative_refusal(self):
        r=self.result()
        self.assertEqual(r["summaries"]["FALSE_POSITIVE_TRUSTED"]["unnecessary_refusal_epochs"],2)
        self.assertEqual(r["controls"]["FALSE_POSITIVE_TRUSTED"][4]["certificate_status"],"CERTIFIED_FRESH")

    def test_untrusted_event_refused(self):
        x=self.result()["controls"]["UNTRUSTED_IMMEDIATE"][2]
        self.assertEqual(x["event_action"],"REFUSE_UNTRUSTED_CHANGE_EVENT")
        self.assertTrue(x["advertise_independent_quorum"])

    def test_untrusted_falls_back_to_expiry(self):
        x=self.result()["controls"]["UNTRUSTED_IMMEDIATE"][3]
        self.assertEqual(x["certificate_status"],"CERTIFICATE_STALE")

    def test_shared_actual_thresholds(self):
        x=self.result()["controls"]["TTL_ONLY"][2]
        self.assertEqual(x["actual_verification_root_threshold"],1)
        self.assertEqual(x["actual_declassification_root_threshold"],2)

    def test_independent_actual_thresholds(self):
        x=self.result()["controls"]["FALSE_POSITIVE_TRUSTED"][2]
        self.assertEqual(x["actual_verification_root_threshold"],2)
        self.assertEqual(x["actual_declassification_root_threshold"],3)

    def test_revalidation_discovers_shared(self):
        x=self.result()["controls"]["TRUSTED_IMMEDIATE"][4]
        self.assertEqual(x["certificate_status"],"SHARED_CONTROL_OBSERVED")
        self.assertEqual(x["revalidation_action"],"REVALIDATION_DISCOVERED_SHARED_CONTROL")

    def test_arc_moves_to_meta_qualification(self):
        self.assertEqual(
            self.result()["arc_status"],
            "TEMPORAL_CERTIFICATION_ARC_COMPLETE_MOVE_TO_META_QUALIFICATION"
        )

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()
