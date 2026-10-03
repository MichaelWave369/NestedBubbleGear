import importlib.util, sys
from pathlib import Path
import unittest
P=Path(__file__).resolve().parents[1]/'src'/'ah22.py'
spec=importlib.util.spec_from_file_location('ah22',P); m=importlib.util.module_from_spec(spec); sys.modules[spec.name]=m; spec.loader.exec_module(m)
class AH22Tests(unittest.TestCase):
    def cases(self): return [m.make_case(un,U,vn,V,k) for un,U in m.BASE.items() for vn,V in m.BASE.items() for k in m.K_VALUES]
    def test_48_histories(self): self.assertEqual(len(self.cases()),48)
    def test_expected_frontiers(self):
        cs=self.cases()
        for name,cfg in m.CONTEXTS.items():
            _,_,c=m.legal_candidates(cs,cfg); self.assertEqual(tuple(m.point(x) for x in m.frontier(c)),cfg['expected_frontier'],msg=name)
    def test_frontier_points_are_nondominated(self):
        cs=self.cases()
        for name,cfg in m.CONTEXTS.items():
            _,_,c=m.legal_candidates(cs,cfg); f=m.frontier(c)
            for x in f: self.assertFalse(any(m.dominates(y,x) for y in c if y is not x),msg=name)
    def test_nonfrontier_points_are_dominated(self):
        cs=self.cases()
        for name,cfg in m.CONTEXTS.items():
            _,_,c=m.legal_candidates(cs,cfg); f=m.frontier(c)
            for x in c:
                if x not in f: self.assertTrue(any(m.dominates(y,x) for y in c if y is not x),msg=name)
    def test_alarm_soft_has_three_frontier_points(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_SOFT_COST']); self.assertEqual(len(m.frontier(c)),3)
    def test_alarm_hard_deny_has_two_frontier_points(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_HARD_DENY']); self.assertEqual(len(m.frontier(c)),2)
    def test_alarm_soft_costs(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_SOFT_COST']); pts=tuple(m.point(x) for x in m.frontier(c)); self.assertEqual(pts,((0,1,0.9),(1,0,0.981),(5,0,0.99)))
    def test_alarm_hard_deny_excludes_singleton_E1(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_HARD_DENY']); self.assertTrue(all(('E1',) not in x['family'] for x in c))
    def test_alarm_threshold_costs_soft(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_SOFT_COST']); f=m.frontier(c); self.assertEqual(m.min_cost_for_reliability(f,0.98),1); self.assertEqual(m.min_cost_for_reliability(f,0.99),5)
    def test_alarm_threshold_costs_hard(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_HARD_DENY']); f=m.frontier(c); self.assertEqual(m.min_cost_for_reliability(f,0.98),1); self.assertIsNone(m.min_cost_for_reliability(f,0.99))
    def test_full_context_candidate_counts(self):
        cs=self.cases()
        for name in ('H2_FULL','GLOBAL_REAUTH','ROUTE_REAUTH'):
            _,_,c=m.legal_candidates(cs,m.CONTEXTS[name]); self.assertEqual(len(c),2,msg=name)
    def test_alarm_candidate_counts(self):
        cs=self.cases(); self.assertEqual(len(m.legal_candidates(cs,m.CONTEXTS['ALARM_SOFT_COST'])[2]),3); self.assertEqual(len(m.legal_candidates(cs,m.CONTEXTS['ALARM_HARD_DENY'])[2]),2)
    def test_all_candidates_upward_closed(self):
        cs=self.cases()
        for cfg in m.CONTEXTS.values():
            _,_,c=m.legal_candidates(cs,cfg); self.assertTrue(all(m.upward(x['family']) for x in c))
    def test_cost_and_deny_are_distinct_constraints(self):
        cs=self.cases(); _,_,soft=m.legal_candidates(cs,m.CONTEXTS['ALARM_SOFT_COST']); _,_,hard=m.legal_candidates(cs,m.CONTEXTS['ALARM_HARD_DENY']); self.assertTrue(any(('E1',) in x['family'] for x in soft)); self.assertTrue(all(('E1',) not in x['family'] for x in hard))
    def test_reliability_values(self):
        _,_,c=m.legal_candidates(self.cases(),m.CONTEXTS['ALARM_SOFT_COST']); rel=tuple(round(x['reliability'],3) for x in m.frontier(c)); self.assertEqual(rel,(0.9,0.981,0.99))
if __name__=='__main__': unittest.main()
