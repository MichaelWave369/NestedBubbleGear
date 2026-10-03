import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah29.py"
spec=importlib.util.spec_from_file_location("ah29",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH29Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def test_authority_matrix(self):
        self.assertEqual(m.ROLE_AUTHORITY["HISTORIAN"],("Q_LIFETIME",))
        self.assertEqual(m.ROLE_AUTHORITY["OPERATOR"],("Q_RECENT",))
        self.assertEqual(m.ROLE_AUTHORITY["AUDITOR"],("Q_LIFETIME","Q_RECENT"))
        self.assertNotIn("Q_MULTI",m.ROLE_AUTHORITY["TRI_HORIZON_ANALYST"])
        self.assertIn("Q_MULTI",m.ROLE_AUTHORITY["ROOT_GOVERNOR"])

    def test_capability_does_not_imply_authority(self):
        p=self.panels()
        self.assertEqual(m.substrate_release(p["A_RECENT_RISK"],"Q_RECENT")["evidence_status"],"COMMON_MODE_EVIDENCE")
        self.assertEqual(m.role_query(p,"HISTORIAN","A_RECENT_RISK","Q_RECENT")["refusal"],"REFUSE_UNAUTHORIZED_HORIZON")

    def test_historian_release_invariance(self):
        p=self.panels()
        a=m.role_query(p,"HISTORIAN","F_ORDER_A","Q_LIFETIME")["release"]
        b=m.role_query(p,"HISTORIAN","G_ORDER_B","Q_LIFETIME")["release"]
        self.assertEqual(a,b)
        self.assertNotEqual(p["F_ORDER_A"]["views"]["recent2"]["status"],p["G_ORDER_B"]["views"]["recent2"]["status"])

    def test_operator_release_invariance(self):
        p=self.panels()
        a=m.role_query(p,"OPERATOR","C_CONSISTENT_COMPATIBLE","Q_RECENT")["release"]
        b=m.role_query(p,"OPERATOR","D_LIFETIME_RISK","Q_RECENT")["release"]
        self.assertEqual(a,b)
        self.assertNotEqual(p["C_CONSISTENT_COMPATIBLE"]["views"]["lifetime"]["status"],p["D_LIFETIME_RISK"]["views"]["lifetime"]["status"])

    def test_adaptive_release_invariance(self):
        p=self.panels()
        a=m.role_query(p,"ADAPTIVE_CONTROLLER","C_CONSISTENT_COMPATIBLE","Q_ADAPTIVE")["release"]
        b=m.role_query(p,"ADAPTIVE_CONTROLLER","F_ORDER_A","Q_ADAPTIVE")["release"]
        self.assertEqual(a,b)

    def test_auditor_pair_does_not_determine_adaptive(self):
        p=self.panels()
        self.assertEqual(m.role_projection(p["A_RECENT_RISK"],"AUDITOR"),m.role_projection(p["B_THREE_WAY_SPLIT"],"AUDITOR"))
        self.assertNotEqual(p["A_RECENT_RISK"]["views"]["adaptive"]["status"],p["B_THREE_WAY_SPLIT"]["views"]["adaptive"]["status"])

    def test_tri_Q_MULTI_is_denied(self):
        p=self.panels()
        for pid in p:
            self.assertEqual(m.role_query(p,"TRI_HORIZON_ANALYST",pid,"Q_MULTI")["refusal"],"REFUSE_UNAUTHORIZED_HORIZON")

    def test_tri_can_derive_multi_anyway(self):
        p=self.panels()
        for pid,panel in p.items():
            derived=m.derive_multi_from_singles(p,"TRI_HORIZON_ANALYST",pid)
            direct=m.substrate_release(panel,"Q_MULTI")
            for key in ("horizon","states","signals","arbitration"):
                self.assertEqual(derived[key],direct[key],msg=f"{pid}:{key}")

    def test_auditor_has_positive_multi_uncertainty(self):
        p=list(self.panels().values())
        target=[m.multi_target(x) for x in p]
        desc=[(x["views"]["lifetime"]["status"],x["views"]["recent2"]["status"]) for x in p]
        self.assertAlmostEqual(m.conditional_entropy(target,desc),0.39355535745192405,places=12)

    def test_tri_has_zero_multi_uncertainty(self):
        p=list(self.panels().values())
        target=[m.multi_target(x) for x in p]
        desc=[(x["views"]["lifetime"]["status"],x["views"]["recent2"]["status"],x["views"]["adaptive"]["status"]) for x in p]
        self.assertAlmostEqual(m.conditional_entropy(target,desc),0.0,places=12)

    def test_historian_recent_residual_entropy(self):
        p=list(self.panels().values())
        life=[x["views"]["lifetime"]["status"] for x in p]
        recent=[x["views"]["recent2"]["status"] for x in p]
        self.assertAlmostEqual(m.conditional_entropy(recent,life),0.7493017854052187,places=12)

    def test_operator_lifetime_residual_entropy(self):
        p=list(self.panels().values())
        life=[x["views"]["lifetime"]["status"] for x in p]
        recent=[x["views"]["recent2"]["status"] for x in p]
        self.assertAlmostEqual(m.conditional_entropy(life,recent),1.1428571428571428,places=12)

    def test_root_still_requires_horizon(self):
        r=m.role_query(self.panels(),"ROOT_GOVERNOR","A_RECENT_RISK",None)
        self.assertEqual(r["refusal"],"REFUSE_UNDERSPECIFIED_HORIZON")

    def test_denied_receipt_contains_no_release(self):
        r=m.role_query(self.panels(),"HISTORIAN","A_RECENT_RISK","Q_RECENT")
        self.assertNotIn("release",r)
        self.assertNotIn("evidence_status",r)
        self.assertNotIn("states",r)

    def test_replay_exact(self):
        p=self.panels()
        a=[m.role_query(p,"ROOT_GOVERNOR",pid,"Q_MULTI") for pid in p]
        b=[m.role_query(p,"ROOT_GOVERNOR",pid,"Q_MULTI") for pid in p]
        self.assertEqual(m.canonical(a),m.canonical(b))

if __name__=="__main__":
    unittest.main()
