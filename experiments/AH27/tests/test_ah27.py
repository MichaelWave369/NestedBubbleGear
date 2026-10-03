import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah27.py"
spec=importlib.util.spec_from_file_location("ah27",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH27Tests(unittest.TestCase):
    def primary(self):
        return m.run_primary()

    def test_lifetime_status_sequence(self):
        self.assertEqual(tuple(r["views"]["lifetime"]["status"] for r in self.primary()),m.EXPECTED_LIFETIME)

    def test_recent_status_sequence(self):
        self.assertEqual(tuple(r["views"]["recent2"]["status"] for r in self.primary()),m.EXPECTED_RECENT)

    def test_discounted_status_sequence(self):
        self.assertEqual(tuple(r["views"]["discounted"]["status"] for r in self.primary()),m.EXPECTED_DISCOUNTED)

    def test_all_views_keep_same_marginals(self):
        for r in self.primary():
            for v in ("lifetime","recent2","discounted"):
                self.assertAlmostEqual(r["views"][v]["stats"]["p1"],0.24,places=12)
                self.assertAlmostEqual(r["views"][v]["stats"]["p3"],0.24,places=12)

    def test_recent_reliability_trace(self):
        vals=tuple(r["views"]["recent2"]["reliability"] for r in self.primary())
        for a,b in zip(vals,m.EXPECTED_RECENT_RELIABILITY):
            self.assertAlmostEqual(a,b,places=12)

    def test_lifetime_reliability_trace(self):
        vals=tuple(r["views"]["lifetime"]["reliability"] for r in self.primary())
        for a,b in zip(vals,m.EXPECTED_LIFETIME_RELIABILITY):
            self.assertAlmostEqual(a,b,places=12)

    def test_R2_horizon_disagreement(self):
        r=self.primary()[1]
        self.assertEqual(r["views"]["lifetime"]["status"],"INSUFFICIENT_EVIDENCE")
        self.assertEqual(r["views"]["recent2"]["status"],"COMMON_MODE_EVIDENCE")
        self.assertEqual(r["views"]["discounted"]["status"],"COMMON_MODE_EVIDENCE")

    def test_R4_three_way_split(self):
        r=self.primary()[3]
        self.assertEqual(r["views"]["lifetime"]["status"],"INSUFFICIENT_EVIDENCE")
        self.assertEqual(r["views"]["recent2"]["status"],"COMMON_MODE_EVIDENCE")
        self.assertEqual(r["views"]["discounted"]["status"],"INSUFFICIENT_EVIDENCE")

    def test_R5_recent_and_discounted_clear(self):
        r=self.primary()[4]
        self.assertEqual(r["views"]["recent2"]["status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(r["views"]["discounted"]["status"],"INDEPENDENCE_COMPATIBLE")

    def test_order_witness_same_lifetime_table(self):
        A=m.final_views((m.C_BATCH,m.C_BATCH,m.I_BATCH,m.I_BATCH))
        B=m.final_views((m.I_BATCH,m.I_BATCH,m.C_BATCH,m.C_BATCH))
        self.assertEqual(A["lifetime"]["table"],B["lifetime"]["table"])

    def test_order_witness_recent_status_differs(self):
        A=m.final_views((m.C_BATCH,m.C_BATCH,m.I_BATCH,m.I_BATCH))
        B=m.final_views((m.I_BATCH,m.I_BATCH,m.C_BATCH,m.C_BATCH))
        self.assertEqual(A["recent2"]["status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(B["recent2"]["status"],"COMMON_MODE_EVIDENCE")

    def test_order_witness_discounted_status_differs(self):
        A=m.final_views((m.C_BATCH,m.C_BATCH,m.I_BATCH,m.I_BATCH))
        B=m.final_views((m.I_BATCH,m.I_BATCH,m.C_BATCH,m.C_BATCH))
        self.assertEqual(A["discounted"]["status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(B["discounted"]["status"],"COMMON_MODE_EVIDENCE")

    def test_order_witness_lifetime_status_same(self):
        A=m.final_views((m.C_BATCH,m.C_BATCH,m.I_BATCH,m.I_BATCH))
        B=m.final_views((m.I_BATCH,m.I_BATCH,m.C_BATCH,m.C_BATCH))
        self.assertEqual(A["lifetime"]["status"],"INSUFFICIENT_EVIDENCE")
        self.assertEqual(B["lifetime"]["status"],"INSUFFICIENT_EVIDENCE")

    def test_discount_lambda_is_one_tenth(self):
        self.assertEqual(m.LAMBDA.numerator,1)
        self.assertEqual(m.LAMBDA.denominator,10)

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_primary()),m.canonical(m.run_primary()))

if __name__=="__main__":
    unittest.main()
