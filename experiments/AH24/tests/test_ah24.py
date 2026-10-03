import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah24.py"
spec=importlib.util.spec_from_file_location("ah24",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH24Tests(unittest.TestCase):
    def regimes(self):
        out={name:m.independent_distribution(p) for name,p in m.INDEPENDENT_REGIMES.items()}
        out["EDGE_COMMON_CAUSE"]=m.correlated_edge_distribution()
        return out

    def test_all_expected_reliabilities(self):
        for name,dist in self.regimes().items():
            for p in m.POLICIES:
                self.assertAlmostEqual(m.reliability(dist,p),m.EXPECTED_RELIABILITY[name][p],places=12,msg=f"{name}:{p}")

    def test_all_expected_frontiers(self):
        for name,dist in self.regimes().items():
            rel={p:m.reliability(dist,p) for p in m.POLICIES}
            self.assertEqual(m.frontier(rel),m.EXPECTED_FRONTIER[name],msg=name)

    def test_E1_fragile_prefers_P23(self):
        d=self.regimes()["E1_FRAGILE"]
        self.assertGreater(m.reliability(d,"P23"),m.reliability(d,"P12"))

    def test_E3_fragile_prefers_P12(self):
        d=self.regimes()["E3_FRAGILE"]
        self.assertGreater(m.reliability(d,"P12"),m.reliability(d,"P23"))

    def test_frontier_membership_reverses(self):
        regs=self.regimes()
        f1=m.frontier({p:m.reliability(regs["E1_FRAGILE"],p) for p in m.POLICIES})
        f3=m.frontier({p:m.reliability(regs["E3_FRAGILE"],p) for p in m.POLICIES})
        self.assertEqual(f1,("P23","P_BOTH"))
        self.assertEqual(f3,("P12","P_BOTH"))

    def test_matched_marginals(self):
        regs=self.regimes()
        a=m.marginals(regs["EDGE_MATCHED_INDEP"])
        b=m.marginals(regs["EDGE_COMMON_CAUSE"])
        for x,y,z in zip(a,b,(0.24,0.10,0.24)):
            self.assertAlmostEqual(x,y,places=12)
            self.assertAlmostEqual(x,z,places=12)

    def test_single_path_reliability_unchanged_by_matched_correlation(self):
        regs=self.regimes()
        for p in ("P12","P23"):
            self.assertAlmostEqual(m.reliability(regs["EDGE_MATCHED_INDEP"],p),m.reliability(regs["EDGE_COMMON_CAUSE"],p),places=12)

    def test_dual_path_reliability_drops_under_correlation(self):
        regs=self.regimes()
        self.assertAlmostEqual(m.reliability(regs["EDGE_MATCHED_INDEP"],"P_BOTH"),0.84816,places=12)
        self.assertAlmostEqual(m.reliability(regs["EDGE_COMMON_CAUSE"],"P_BOTH"),0.7182,places=12)

    def test_redundancy_gain_penalty(self):
        regs=self.regimes()
        def gain(name):
            r={p:m.reliability(regs[name],p) for p in m.POLICIES}
            return r["P_BOTH"]-max(r["P12"],r["P23"])
        self.assertAlmostEqual(gain("EDGE_MATCHED_INDEP"),0.16416,places=12)
        self.assertAlmostEqual(gain("EDGE_COMMON_CAUSE"),0.0342,places=12)
        self.assertAlmostEqual(gain("EDGE_MATCHED_INDEP")-gain("EDGE_COMMON_CAUSE"),0.12996,places=12)

    def test_E2_fragile_limits_all_policies(self):
        d=self.regimes()["E2_FRAGILE"]
        self.assertAlmostEqual(m.reliability(d,"P12"),0.665,places=12)
        self.assertAlmostEqual(m.reliability(d,"P23"),0.665,places=12)
        self.assertAlmostEqual(m.reliability(d,"P_BOTH"),0.69825,places=12)

    def test_balanced_reproduces_AH20_values(self):
        d=self.regimes()["BALANCED"]
        self.assertAlmostEqual(m.reliability(d,"P12"),0.81,places=12)
        self.assertAlmostEqual(m.reliability(d,"P23"),0.81,places=12)
        self.assertAlmostEqual(m.reliability(d,"P_BOTH"),0.891,places=12)

    def test_correlated_distribution_normalizes(self):
        self.assertAlmostEqual(sum(m.correlated_edge_distribution().values()),1.0,places=12)

    def test_PBOTH_best_in_every_regime(self):
        for name,d in self.regimes().items():
            rb=m.reliability(d,"P_BOTH")
            self.assertGreaterEqual(rb,max(m.reliability(d,"P12"),m.reliability(d,"P23"))-1e-12,msg=name)

    def test_robust_worst_reliability(self):
        regs=self.regimes()
        worst={p:min(m.reliability(d,p) for d in regs.values()) for p in m.POLICIES}
        self.assertAlmostEqual(worst["P12"],0.63,places=12)
        self.assertAlmostEqual(worst["P23"],0.63,places=12)
        self.assertAlmostEqual(worst["P_BOTH"],0.69825,places=12)

    def test_robust_regret(self):
        regs=self.regimes()
        for p,expected in (("P12",0.2565),("P23",0.2565),("P_BOTH",0.0)):
            g=max(m.reliability(d,"P_BOTH")-m.reliability(d,p) for d in regs.values())
            self.assertAlmostEqual(g,expected,places=12)

if __name__=="__main__":
    unittest.main()
