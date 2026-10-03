import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah9.py"
spec=importlib.util.spec_from_file_location("ah9",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH9Tests(unittest.TestCase):
    def test_generator_determinants(self):
        for X in (m.A,m.B,m.S):
            self.assertEqual(m.det(X),1)

    def test_frozen_connector_count(self):
        self.assertEqual(len(m.CONNECTORS),12)

    def test_local_loops_recover_A_and_B(self):
        for name,T in m.CONNECTORS.items():
            r=m.evaluate_connector(name,T)
            self.assertEqual(r["H_left"],m.matrix_list(m.A))
            self.assertEqual(r["H_right"],m.matrix_list(m.B))

    def test_direct_outer_equals_transported_composition(self):
        for name,T in m.CONNECTORS.items():
            r=m.evaluate_connector(name,T)
            self.assertEqual(r["outer_direct"],r["outer_transport"])

    def test_naive_rule_exactly_matches_commuting_condition(self):
        for name,T in m.CONNECTORS.items():
            r=m.evaluate_connector(name,T)
            self.assertEqual(r["outer_direct"]==r["outer_naive"],r["commutes_with_B"])

    def test_classification_counts(self):
        rs=[m.evaluate_connector(n,T) for n,T in m.CONNECTORS.items()]
        self.assertEqual(sum(r["commutes_with_B"] for r in rs),4)
        self.assertEqual(sum(not r["commutes_with_B"] for r in rs),8)

    def test_primary_BA_witness(self):
        r=m.evaluate_connector("BA",m.CONNECTORS["BA"])
        self.assertEqual(r["outer_direct"],[[3,2],[4,3]])
        self.assertEqual(r["outer_naive"],[[1,1],[1,2]])
        self.assertEqual((r["trace_outer"],r["trace_naive"]),(6,3))

    def test_S_transport_can_change_global_triviality(self):
        r=m.evaluate_connector("S",m.CONNECTORS["S"])
        self.assertEqual(r["outer_direct"],[[1,0],[0,1]])
        self.assertNotEqual(r["outer_naive"],[[1,0],[0,1]])

    def test_defect_identity(self):
        for name,T in m.CONNECTORS.items():
            r=m.evaluate_connector(name,T)
            self.assertTrue(r["checks"]["defect_identity"])

    def test_basepoint_conjugacy_invariants(self):
        for name,T in m.CONNECTORS.items():
            r=m.evaluate_connector(name,T)
            self.assertTrue(r["checks"]["basepoint_trace_invariant"])
            self.assertTrue(r["checks"]["basepoint_det_invariant"])

if __name__=="__main__":
    unittest.main()
