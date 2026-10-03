import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah11.py"
spec=importlib.util.spec_from_file_location("ah11",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH11Tests(unittest.TestCase):
    def cases(self):
        return [
            m.case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_labeled_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_gauge_family_preserves_cumulative_and_global(self):
        g=[c for c in self.cases() if c["U_name"]=="A" and c["V_name"]=="B"]
        self.assertEqual(len({repr(c["P2"]) for c in g}),1)
        self.assertEqual(len({repr(c["global_G"]) for c in g}),1)

    def test_residue_reconstructs_global(self):
        for c in self.cases():
            R=tuple(tuple(x for x in row) for row in c["residue_R"])
            G=tuple(tuple(x for x in row) for row in c["global_G"])
            self.assertEqual(m.mul(R,m.A),G)

    def test_expected_descriptor_class_counts(self):
        cs=self.cases()
        expected={"label":48,"raw":46,"prefix":46,"action":15,"residue":13,"cumulative":13,"H2":3,"H3":9,"trace":1}
        for key,n in expected.items():
            self.assertEqual(m.descriptor_report(cs,key)["classes"],n)

    def test_sufficient_descriptors(self):
        cs=self.cases()
        for key in ("label","raw","prefix","action","residue"):
            self.assertTrue(m.descriptor_report(cs,key)["sufficient"])

    def test_insufficient_descriptors(self):
        cs=self.cases()
        for key in ("cumulative","H2","H3","trace"):
            self.assertFalse(m.descriptor_report(cs,key)["sufficient"])

    def test_same_class_count_can_differ_in_sufficiency(self):
        cs=self.cases()
        r=m.descriptor_report(cs,"residue")
        p=m.descriptor_report(cs,"cumulative")
        self.assertEqual(r["classes"],p["classes"])
        self.assertTrue(r["sufficient"])
        self.assertFalse(p["sufficient"])

    def test_cumulative_counterexample(self):
        cs=self.cases()
        ia=next(c for c in cs if c["U_name"]=="I" and c["V_name"]=="A" and c["k"]==0)
        ai=next(c for c in cs if c["U_name"]=="A" and c["V_name"]=="I" and c["k"]==0)
        self.assertEqual(ia["P2"],ai["P2"])
        self.assertNotEqual(ia["global_G"],ai["global_G"])

    def test_entropy_targets(self):
        cs=self.cases()
        targets=[c["_G"] for c in cs]
        self.assertAlmostEqual(m.entropy(targets),3.625,places=12)
        self.assertAlmostEqual(m.descriptor_report(cs,"action")["entropy_bits"],3.875,places=12)
        self.assertAlmostEqual(m.descriptor_report(cs,"residue")["entropy_bits"],3.625,places=12)

    def test_residue_conditional_entropy_zero(self):
        self.assertAlmostEqual(m.descriptor_report(self.cases(),"residue")["conditional_global_entropy_bits"],0.0,places=12)

    def test_cumulative_retains_residual_uncertainty(self):
        self.assertAlmostEqual(m.descriptor_report(self.cases(),"cumulative")["conditional_global_entropy_bits"],0.25,places=12)

    def test_trace_pair_erases_all_connector_distinctions(self):
        r=m.descriptor_report(self.cases(),"trace")
        self.assertEqual(r["classes"],1)
        self.assertAlmostEqual(r["conditional_global_entropy_bits"],3.625,places=12)

if __name__=="__main__":
    unittest.main()
