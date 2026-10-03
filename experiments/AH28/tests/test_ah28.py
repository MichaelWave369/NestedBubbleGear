import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah28.py"
spec=importlib.util.spec_from_file_location("ah28",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH28Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def test_recent_risk_panel(self):
        p=self.panels()["A_RECENT_RISK"]
        self.assertEqual(m.arbitration(p),"RECENT_RISK_ONLY")

    def test_three_way_split_keeps_recent_risk(self):
        p=self.panels()["B_THREE_WAY_SPLIT"]
        self.assertEqual(p["views"]["adaptive"]["status"],"INSUFFICIENT_EVIDENCE")
        self.assertEqual(m.arbitration(p),"RECENT_RISK_ONLY")

    def test_consistent_compatible(self):
        self.assertEqual(m.arbitration(self.panels()["C_CONSISTENT_COMPATIBLE"]),"CONSISTENT")

    def test_lifetime_risk_only(self):
        p=self.panels()["D_LIFETIME_RISK"]
        self.assertEqual(p["views"]["lifetime"]["status"],"COMMON_MODE_EVIDENCE")
        self.assertEqual(p["views"]["recent2"]["status"],"INDEPENDENCE_COMPATIBLE")
        self.assertEqual(m.arbitration(p),"LIFETIME_RISK_ONLY")

    def test_consistent_risk(self):
        self.assertEqual(m.arbitration(self.panels()["E_CONSISTENT_RISK"]),"CONSISTENT")

    def test_order_witness_same_lifetime(self):
        p=self.panels()
        self.assertEqual(p["F_ORDER_A"]["views"]["lifetime"]["table"],p["G_ORDER_B"]["views"]["lifetime"]["table"])

    def test_order_witness_governance_differs(self):
        p=self.panels()
        self.assertEqual(m.arbitration(p["F_ORDER_A"]),"HORIZON_CONFLICT")
        self.assertEqual(m.arbitration(p["G_ORDER_B"]),"RECENT_RISK_ONLY")

    def test_missing_horizon_refused(self):
        r=m.query(self.panels(),"A_RECENT_RISK",None)
        self.assertEqual(r["refusal"],"REFUSE_UNDERSPECIFIED_HORIZON")

    def test_unknown_contract_refused(self):
        r=m.query(self.panels(),"A_RECENT_RISK","Q_BAD")
        self.assertEqual(r["refusal"],"REFUSE_UNKNOWN_QUERY_CONTRACT")

    def test_recent_contract_is_scoped(self):
        r=m.query(self.panels(),"A_RECENT_RISK","Q_RECENT")
        self.assertEqual(r["horizon"],"RECENT_2")
        self.assertEqual(r["evidence_status"],"COMMON_MODE_EVIDENCE")
        self.assertEqual(r["scoped_signal"],"RISK_SIGNAL")

    def test_lifetime_contract_is_scoped(self):
        r=m.query(self.panels(),"A_RECENT_RISK","Q_LIFETIME")
        self.assertEqual(r["horizon"],"LIFETIME")
        self.assertEqual(r["evidence_status"],"INSUFFICIENT_EVIDENCE")

    def test_multi_preserves_conflict(self):
        r=m.query(self.panels(),"F_ORDER_A","Q_MULTI")
        self.assertEqual(r["arbitration"],"HORIZON_CONFLICT")
        self.assertNotIn("evidence_status",r)
        self.assertIn("states",r)

    def test_no_safe_semantics(self):
        panels=self.panels()
        out=[m.query(panels,pid,c) for pid in panels for c in m.CONTRACTS]
        self.assertNotIn("SAFE",__import__("json").dumps(out,sort_keys=True))

    def test_accepted_receipts_have_horizon(self):
        panels=self.panels()
        for pid in panels:
            for c in m.CONTRACTS:
                self.assertIn("horizon",m.query(panels,pid,c))

    def test_replay_exact(self):
        panels=self.panels()
        a=[m.query(panels,pid,c) for pid in panels for c in m.CONTRACTS]
        b=[m.query(panels,pid,c) for pid in panels for c in m.CONTRACTS]
        self.assertEqual(m.canonical(a),m.canonical(b))

if __name__=="__main__":
    unittest.main()
