import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah10.py"
spec=importlib.util.spec_from_file_location("ah10",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH10Tests(unittest.TestCase):
    def cases(self):
        return [
            m.evaluate(n1,T1,n2,T2)
            for n1,T1 in m.CONNECTORS.items()
            for n2,T2 in m.CONNECTORS.items()
        ]

    def test_local_generators_det_one(self):
        for X in (m.A,m.B,m.C,m.S):
            self.assertEqual(m.det(X),1)

    def test_connector_grid_has_16_cases(self):
        self.assertEqual(len(self.cases()),16)

    def test_local_loops_are_exact(self):
        for r in self.cases():
            self.assertEqual(r["H1"],m.matrix_list(m.A))
            self.assertEqual(r["H2"],m.matrix_list(m.B))
            self.assertEqual(r["H3"],m.matrix_list(m.C))

    def test_direct_equals_transported_all_cases(self):
        for r in self.cases():
            self.assertEqual(r["outer_direct"],r["outer_transport"])

    def test_left_grouping_all_cases(self):
        for r in self.cases():
            self.assertEqual(r["left_group"],r["outer_direct"])

    def test_right_grouping_all_cases(self):
        for r in self.cases():
            self.assertEqual(r["right_group"],r["outer_direct"])

    def test_parenthesizations_agree(self):
        for r in self.cases():
            self.assertEqual(r["left_group"],r["right_group"])

    def test_wrong_reconstruction_counts(self):
        rs=self.cases()
        self.assertEqual(sum(r["naive_equal"] for r in rs),1)
        self.assertEqual(sum(r["omit2_equal"] for r in rs),4)
        self.assertEqual(sum(r["omit1_equal"] for r in rs),4)

    def test_primary_A_B_witness(self):
        r=m.evaluate("A",m.A,"B",m.B)
        self.assertEqual(r["outer_direct"],[[5,3],[3,2]])
        self.assertEqual(r["naive"],[[3,4],[2,3]])
        self.assertEqual((r["trace_outer"],r["trace_naive"]),(7,6))

    def test_B_S_exact_cancellation_requires_full_history(self):
        r=m.evaluate("B",m.B,"S",m.S)
        self.assertEqual(r["outer_direct"],[[1,0],[0,1]])
        self.assertNotEqual(r["naive"],[[1,0],[0,1]])
        self.assertNotEqual(r["omit2"],[[1,0],[0,1]])
        self.assertNotEqual(r["omit1"],[[1,0],[0,1]])

    def test_basepoint_conjugacy_invariants(self):
        for r in self.cases():
            self.assertTrue(r["checks"]["basepoint_trace_invariant"])
            self.assertTrue(r["checks"]["basepoint_det_invariant"])

if __name__=="__main__":
    unittest.main()
