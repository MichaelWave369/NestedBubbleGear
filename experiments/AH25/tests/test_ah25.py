import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah25.py"
spec=importlib.util.spec_from_file_location("ah25",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH25Tests(unittest.TestCase):
    def report(self,name):
        s=m.stats(m.DATASETS[name])
        return s,m.classify(s)

    def test_independent_status(self):
        _,status=self.report("MATCHED_INDEPENDENT")
        self.assertEqual(status,"INDEPENDENCE_COMPATIBLE")

    def test_common_cause_status(self):
        _,status=self.report("MATCHED_COMMON_CAUSE")
        self.assertEqual(status,"COMMON_MODE_EVIDENCE")

    def test_anti_dependence_status(self):
        _,status=self.report("MATCHED_ANTI_DEPENDENCE")
        self.assertEqual(status,"DEPENDENCE_OTHER_DIRECTION")

    def test_small_sample_refuses(self):
        s,status=self.report("SMALL_AMBIGUOUS")
        self.assertLess(s["N"],m.N_MIN)
        self.assertEqual(status,"INSUFFICIENT_EVIDENCE")

    def test_three_large_marginals_match(self):
        reports=[m.stats(m.DATASETS[n]) for n in ("MATCHED_INDEPENDENT","MATCHED_COMMON_CAUSE","MATCHED_ANTI_DEPENDENCE")]
        for s in reports:
            self.assertAlmostEqual(s["p1"],0.24,places=12)
            self.assertAlmostEqual(s["p3"],0.24,places=12)

    def test_joint_rates_separate_hidden_structure(self):
        reports=[m.stats(m.DATASETS[n]) for n in ("MATCHED_INDEPENDENT","MATCHED_COMMON_CAUSE","MATCHED_ANTI_DEPENDENCE")]
        self.assertEqual(len({s["p11"] for s in reports}),3)

    def test_common_cause_statistics(self):
        s=m.stats(m.DATASETS["MATCHED_COMMON_CAUSE"])
        self.assertAlmostEqual(s["delta"],0.1444,places=12)
        self.assertAlmostEqual(s["mutual_information_bits"],0.42610481405706996,places=12)
        self.assertAlmostEqual(s["chi2"],6267.361111111111,places=9)

    def test_anti_dependence_statistics(self):
        s=m.stats(m.DATASETS["MATCHED_ANTI_DEPENDENCE"])
        self.assertAlmostEqual(s["delta"],-0.0576,places=12)
        self.assertAlmostEqual(s["mutual_information_bits"],0.11123502277384265,places=12)

    def test_independent_statistics(self):
        s=m.stats(m.DATASETS["MATCHED_INDEPENDENT"])
        self.assertAlmostEqual(s["delta"],0.0,places=12)
        self.assertAlmostEqual(s["chi2"],0.0,places=12)
        self.assertAlmostEqual(s["chi2_p_value"],1.0,places=12)

    def test_observed_reliability_recovers_AH24_controls(self):
        a=m.stats(m.DATASETS["MATCHED_INDEPENDENT"])
        b=m.stats(m.DATASETS["MATCHED_COMMON_CAUSE"])
        self.assertAlmostEqual(m.observed_dual_reliability(a),0.84816,places=12)
        self.assertAlmostEqual(m.observed_dual_reliability(b),0.7182,places=12)

    def test_independence_assumption_same_for_matched_marginals(self):
        vals=[]
        for n in ("MATCHED_INDEPENDENT","MATCHED_COMMON_CAUSE","MATCHED_ANTI_DEPENDENCE"):
            vals.append(m.independence_assumed_reliability(m.stats(m.DATASETS[n])))
        self.assertTrue(all(abs(v-0.84816)<1e-12 for v in vals))

    def test_common_cause_overstatement(self):
        s=m.stats(m.DATASETS["MATCHED_COMMON_CAUSE"])
        self.assertAlmostEqual(m.overstatement(s),0.12996,places=12)

    def test_anti_dependence_understatement(self):
        s=m.stats(m.DATASETS["MATCHED_ANTI_DEPENDENCE"])
        self.assertAlmostEqual(m.overstatement(s),-0.05184,places=12)

    def test_classifier_does_not_call_negative_dependence_common_mode(self):
        s=m.stats(m.DATASETS["MATCHED_ANTI_DEPENDENCE"])
        self.assertNotEqual(m.classify(s),"COMMON_MODE_EVIDENCE")

    def test_independence_compatible_is_not_named_proven(self):
        _,status=self.report("MATCHED_INDEPENDENT")
        self.assertEqual(status,"INDEPENDENCE_COMPATIBLE")
        self.assertNotIn("PROVEN",status)

if __name__=="__main__":
    unittest.main()
