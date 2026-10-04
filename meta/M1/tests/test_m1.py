import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"m1_reproduce.py"
spec=importlib.util.spec_from_file_location("m1",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class M1Tests(unittest.TestCase):
    def result(self): return m.run_reproduction()

    def test_no_historical_imports(self):
        t=P.read_text()
        self.assertFalse(any(x in t for x in ("experiments.AH","src.ah20","src.ah35","src.ah42","src.ah44")))

    def test_ah20(self):
        x=self.result()["AH20"]["H2_FULL"]
        self.assertEqual(x["capability_cuts"],[["E2"],["E1","E3"]])
        self.assertAlmostEqual(x["capability_reliability_p0_1"],0.891,places=12)

    def test_ah35_counts(self):
        x=self.result()["AH35"]
        self.assertEqual((x["valid_profiles"],x["dangerous_profiles"],x["safe_profiles"]),(243,137,106))

    def test_ah35_cut(self):
        x=self.result()["AH35"]
        self.assertEqual(x["minimum_cuts"],[["H_L:T","U_L:T"]])
        self.assertEqual(x["target_cut_max_richness"],6)

    def test_ah42_certified(self):
        x=self.result()["AH42"]["S1_CERTIFIED_INDEPENDENT"]
        self.assertEqual((x["status"],x["verify_threshold"],x["declassify_threshold"]),("CERTIFIED_INDEPENDENT",2,3))

    def test_ah42_hidden_shared(self):
        x=self.result()["AH42"]["S4_HIDDEN_SHARED_UNVERIFIED"]
        self.assertEqual(x["status"],"INDEPENDENCE_UNVERIFIED")
        self.assertFalse(x["advertise"])
        self.assertEqual((x["verify_threshold"],x["declassify_threshold"]),(1,2))

    def test_ah44_immediate(self):
        x=self.result()["AH44"]["TRUSTED_IMMEDIATE"]
        self.assertEqual((x["false_advertisement_epochs"],x["revocation_latency_epochs"]),(0,0))

    def test_ah44_delayed(self):
        x=self.result()["AH44"]["TRUSTED_DELAYED_1"]
        self.assertEqual((x["false_advertisement_epochs"],x["revocation_latency_epochs"]),(1,1))

    def test_ah44_false_positive(self):
        self.assertEqual(self.result()["AH44"]["FALSE_POSITIVE_TRUSTED"]["unnecessary_refusal_epochs"],2)

    def test_replay(self):
        self.assertEqual(m.canonical(m.run_reproduction()),m.canonical(m.run_reproduction()))

if __name__=="__main__":
    unittest.main()
