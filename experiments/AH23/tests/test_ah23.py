import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah23.py"
spec=importlib.util.spec_from_file_location("ah23",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH23Tests(unittest.TestCase):
    def cases(self):
        return [m.make_case(un,U,vn,V,k) for un,U in m.BASE.items() for vn,V in m.BASE.items() for k in m.K_VALUES]

    def test_48_histories_and_scenarios(self):
        self.assertEqual(len(self.cases()),48)
        self.assertEqual(m.SCENARIOS,(0.05,0.10,0.15,0.20,0.25,0.30))

    def test_expected_robust_frontiers(self):
        cs=self.cases()
        for name,cfg in m.CONTEXTS.items():
            _,_,c=m.legal_candidates(cs,cfg)
            pts=tuple(m.robust_point(x) for x in m.frontier(c,m.robust_dominates))
            self.assertEqual(pts,cfg["expected_robust"],msg=name)

    def test_frontier_membership_stable_from_AH22(self):
        cs=self.cases()
        for name,cfg in m.CONTEXTS.items():
            _,_,c=m.legal_candidates(cs,cfg)
            old=m.frontier(c,m.ah22_dominates)
            rob=m.frontier(c,m.robust_dominates)
            self.assertEqual(tuple(x["family"] for x in old),tuple(x["family"] for x in rob),msg=name)

    def test_all_reliability_curves_nonincreasing(self):
        cs=self.cases()
        for cfg in m.CONTEXTS.values():
            _,_,c=m.legal_candidates(cs,cfg)
            for x in c:
                self.assertTrue(all(x["curve"][i]>=x["curve"][i+1]-1e-12 for i in range(len(m.SCENARIOS)-1)))

    def test_worst_case_is_p030(self):
        cs=self.cases()
        for cfg in m.CONTEXTS.values():
            _,_,c=m.legal_candidates(cs,cfg)
            for x in c:
                self.assertAlmostEqual(x["worst_reliability"],x["curve"][-1],places=12)

    def test_full_task_robust_values(self):
        cs=self.cases()
        expected={
            "H2_FULL":((0,1,0.49,0.147),(3,0,0.637,0.0)),
            "GLOBAL_REAUTH":((0,1,0.49,0.147),(5,0,0.637,0.0)),
            "ROUTE_REAUTH":((0,1,0.49,0.147),(2,0,0.637,0.0)),
        }
        for name,pts in expected.items():
            _,_,c=m.legal_candidates(cs,m.CONTEXTS[name])
            self.assertEqual(tuple(m.robust_point(x) for x in m.frontier(c,m.robust_dominates)),pts)

    def test_alarm_soft_robust_values(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_SOFT_COST"])
        pts=tuple(m.robust_point(x) for x in m.frontier(c,m.robust_dominates))
        self.assertEqual(pts,((0,1,0.7,0.21),(1,0,0.847,0.063),(5,0,0.91,0.0)))

    def test_alarm_hard_robust_values(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_HARD_DENY"])
        pts=tuple(m.robust_point(x) for x in m.frontier(c,m.robust_dominates))
        self.assertEqual(pts,((0,1,0.7,0.21),(1,0,0.847,0.063)))

    def test_soft_threshold_costs_reliability(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_SOFT_COST"])
        f=m.frontier(c,m.robust_dominates)
        self.assertEqual(m.min_cost(f,"worst_reliability",0.84,True),1)
        self.assertEqual(m.min_cost(f,"worst_reliability",0.90,True),5)

    def test_soft_threshold_costs_regret(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_SOFT_COST"])
        f=m.frontier(c,m.robust_dominates)
        self.assertEqual(m.min_cost(f,"max_regret",0.07,False),1)
        self.assertEqual(m.min_cost(f,"max_regret",0.01,False),5)

    def test_hard_threshold_costs_reliability(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_HARD_DENY"])
        f=m.frontier(c,m.robust_dominates)
        self.assertEqual(m.min_cost(f,"worst_reliability",0.84,True),1)
        self.assertIsNone(m.min_cost(f,"worst_reliability",0.90,True))

    def test_hard_threshold_costs_regret(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_HARD_DENY"])
        f=m.frontier(c,m.robust_dominates)
        self.assertEqual(m.min_cost(f,"max_regret",0.07,False),1)
        self.assertIsNone(m.min_cost(f,"max_regret",0.01,False))

    def test_robust_frontier_nondominated(self):
        cs=self.cases()
        for cfg in m.CONTEXTS.values():
            _,_,c=m.legal_candidates(cs,cfg)
            f=m.frontier(c,m.robust_dominates)
            for x in f:
                self.assertFalse(any(m.robust_dominates(y,x) for y in c if y is not x))

    def test_nonfrontier_is_robustly_dominated(self):
        cs=self.cases()
        for cfg in m.CONTEXTS.values():
            _,_,c=m.legal_candidates(cs,cfg)
            f=m.frontier(c,m.robust_dominates)
            for x in c:
                if x not in f:
                    self.assertTrue(any(m.robust_dominates(y,x) for y in c if y is not x))

    def test_soft_full_capability_has_zero_regret(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS["ALARM_SOFT_COST"])
        f=m.frontier(c,m.robust_dominates)
        self.assertAlmostEqual(f[-1]["max_regret"],0.0,places=12)

if __name__=="__main__":
    unittest.main()
