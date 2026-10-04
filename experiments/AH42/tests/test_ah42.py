import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah42.py"
spec=importlib.util.spec_from_file_location("ah42",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH42Tests(unittest.TestCase):
    def result(self):
        return m.run_experiment()["scenarios"]

    def test_four_scenarios(self):
        self.assertEqual(len(self.result()),4)

    def test_certified_independent(self):
        x=self.result()["S1_CERTIFIED_INDEPENDENT"]
        self.assertEqual(x["status"],"CERTIFIED_INDEPENDENT")
        self.assertTrue(x["advertise_independent_quorum"])
        self.assertEqual(x["verified_control_domain_count"],3)

    def test_shared_observed(self):
        x=self.result()["S2_SHARED_AB_OBSERVED"]
        self.assertEqual(x["status"],"SHARED_CONTROL_OBSERVED")
        self.assertFalse(x["advertise_independent_quorum"])
        self.assertEqual(x["verified_control_domain_count"],2)

    def test_shared_contradicts_declaration(self):
        x=self.result()["S2_SHARED_AB_OBSERVED"]
        self.assertEqual(
            x["contradiction_status"],
            "DECLARATION_CONTRADICTED_BY_SHARED_CONTROL_EVIDENCE"
        )

    def test_unverified_independent_refuses_claim(self):
        x=self.result()["S3_INDEPENDENT_BUT_UNVERIFIED"]
        self.assertEqual(x["status"],"INDEPENDENCE_UNVERIFIED")
        self.assertIsNone(x["advertised_independent_declassification_threshold"])

    def test_hidden_shared_refuses_claim(self):
        x=self.result()["S4_HIDDEN_SHARED_UNVERIFIED"]
        self.assertEqual(x["status"],"INDEPENDENCE_UNVERIFIED")
        self.assertIsNone(x["advertised_independent_declassification_threshold"])
        self.assertEqual(x["actual_declassification_root_threshold"],2)

    def test_actual_thresholds(self):
        r=self.result()
        self.assertEqual(
            (r["S1_CERTIFIED_INDEPENDENT"]["actual_verification_root_threshold"],
             r["S1_CERTIFIED_INDEPENDENT"]["actual_declassification_root_threshold"]),
            (2,3)
        )
        self.assertEqual(
            (r["S2_SHARED_AB_OBSERVED"]["actual_verification_root_threshold"],
             r["S2_SHARED_AB_OBSERVED"]["actual_declassification_root_threshold"]),
            (1,2)
        )

    def test_shared_verification_single_failure_cut(self):
        x=self.result()["S2_SHARED_AB_OBSERVED"]
        self.assertEqual(x["verification_failure_cuts"],[["ROOT_AB"]])

    def test_independent_verification_failure_pairs(self):
        x=self.result()["S1_CERTIFIED_INDEPENDENT"]
        self.assertEqual(len(x["verification_failure_cuts"]),3)
        self.assertTrue(all(len(c)==2 for c in x["verification_failure_cuts"]))

    def test_reliability_independent(self):
        x=self.result()["S1_CERTIFIED_INDEPENDENT"]
        self.assertAlmostEqual(x["verification_reliability_p0_1"],0.972,places=12)
        self.assertAlmostEqual(x["declassification_reliability_p0_1"],0.729,places=12)

    def test_reliability_shared(self):
        x=self.result()["S2_SHARED_AB_OBSERVED"]
        self.assertAlmostEqual(x["verification_reliability_p0_1"],0.9,places=12)
        self.assertAlmostEqual(x["declassification_reliability_p0_1"],0.81,places=12)

    def test_named_principals_do_not_fix_threshold(self):
        r=self.result()
        a=r["S1_CERTIFIED_INDEPENDENT"]
        b=r["S2_SHARED_AB_OBSERVED"]
        self.assertEqual(a["named_principal_count"],b["named_principal_count"])
        self.assertNotEqual(
            a["actual_declassification_root_threshold"],
            b["actual_declassification_root_threshold"]
        )

    def test_evidence_progression_never_false_certifies(self):
        p=m.shared_evidence_progression()
        self.assertEqual([x["status"] for x in p],[
            "INDEPENDENCE_UNVERIFIED",
            "INDEPENDENCE_UNVERIFIED",
            "SHARED_CONTROL_OBSERVED",
        ])

    def test_shared_effective_thresholds(self):
        x=self.result()["S2_SHARED_AB_OBSERVED"]
        self.assertEqual(x["effective_verified_root_threshold_VERIFY"],1)
        self.assertEqual(x["effective_verified_root_threshold_DECLASSIFY"],2)

    def test_incomplete_evidence_has_no_effective_threshold(self):
        x=self.result()["S4_HIDDEN_SHARED_UNVERIFIED"]
        self.assertIsNone(x["effective_verified_root_threshold_VERIFY"])
        self.assertIsNone(x["effective_verified_root_threshold_DECLASSIFY"])

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_experiment()),m.canonical(m.run_experiment()))

if __name__=="__main__":
    unittest.main()
