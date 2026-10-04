import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah41.py"
spec=importlib.util.spec_from_file_location("ah41",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH41Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()

    def test_eight_physical_coalitions(self):
        self.assertEqual(len(m.physical_coalitions()),8)

    def test_independent_verification_threshold_two(self):
        self.assertEqual(self.result()["verification"]["independent_physical_threshold"],2)

    def test_fused_verification_threshold_one(self):
        self.assertEqual(self.result()["verification"]["fused_physical_threshold"],1)

    def test_independent_strict_declass_threshold_three(self):
        self.assertEqual(self.result()["strict_declassification"]["independent_physical_threshold"],3)

    def test_fused_strict_declass_threshold_two(self):
        self.assertEqual(self.result()["strict_declassification"]["fused_physical_threshold"],2)

    def test_weak_fused_declass_threshold_one(self):
        self.assertEqual(self.result()["weak_declassification_negative_control"]["fused_physical_threshold"],1)

    def test_fused_verification_single_point_failure(self):
        self.assertEqual(self.result()["verification"]["fused_failure_cuts"],[["PRINCIPAL_A"]])

    def test_independent_verification_failure_cuts_are_pairs(self):
        cuts=self.result()["verification"]["independent_failure_cuts"]
        self.assertEqual(len(cuts),3)
        self.assertTrue(all(len(x)==2 for x in cuts))

    def test_strict_declass_fused_failure_cuts(self):
        self.assertEqual(self.result()["strict_declassification"]["fused_failure_cuts"],
                         [["PRINCIPAL_A"],["PRINCIPAL_B"]])

    def test_verification_reliability(self):
        r=self.result()["verification"]
        self.assertAlmostEqual(r["independent_reliability_p0_1"],0.972,places=12)
        self.assertAlmostEqual(r["fused_reliability_p0_1"],0.9,places=12)

    def test_declass_reliability(self):
        r=self.result()["strict_declassification"]
        self.assertAlmostEqual(r["independent_reliability_p0_1"],0.729,places=12)
        self.assertAlmostEqual(r["fused_reliability_p0_1"],0.81,places=12)

    def test_mediated_verify_privacy(self):
        self.assertAlmostEqual(self.result()["verification"]["public_privacy_bits"],0.4,places=12)

    def test_declassification_privacy_zero(self):
        self.assertAlmostEqual(self.result()["strict_declassification"]["public_privacy_bits"],0.0,places=12)

    def test_malicious_upgrade_refused(self):
        r=self.result()["malicious_upgrade_attempt"]
        self.assertEqual(r["result"]["refusal"],"REFUSE_DECLASSIFICATION_QUORUM")
        self.assertNotIn("public_output",r["result"])

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()
