import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/'src'/'ah21.py'
spec=importlib.util.spec_from_file_location('ah21',P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH21Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_every_task_has_valid_hardening_candidate(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,_,valid,_=m.synthesize(cs,cfg)
            self.assertGreater(len(valid),0,msg=name)

    def test_every_optimum_adds_exactly_one_coalition(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,_,_,opt=m.synthesize(cs,cfg)
            self.assertEqual(opt['added_count'],1,msg=name)

    def test_full_task_added_coalitions(self):
        cs=self.cases()
        expected={
            'H2_FULL':(('E2','E3'),),
            'GLOBAL_REAUTH':(('E2','E3'),),
            'ROUTE_REAUTH':(('E1','E2'),),
        }
        for task,added in expected.items():
            _,_,_,opt=m.synthesize(cs,m.TASKS[task])
            self.assertEqual(opt['added'],added,msg=task)

    def test_full_task_hardening_recovers_capability_family(self):
        cs=self.cases()
        for task in ('H2_FULL','GLOBAL_REAUTH','ROUTE_REAUTH'):
            cap,_,_,opt=m.synthesize(cs,m.TASKS[task])
            self.assertEqual(opt['family'],cap,msg=task)

    def test_alarm_adds_pair_not_denied_singleton(self):
        cs=self.cases()
        cap,_,_,opt=m.synthesize(cs,m.TASKS['C_CLASS_ALARM'])
        self.assertEqual(opt['added'],(('E1','E2'),))
        self.assertNotIn(('E1',),opt['family'])
        self.assertTrue(set(opt['family']) < set(cap))

    def test_alarm_minimal_success_after_hardening(self):
        _,_,_,opt=m.synthesize(self.cases(),m.TASKS['C_CLASS_ALARM'])
        self.assertEqual(m.minimal_success(opt['family']),(('E3',),('E1','E2')))

    def test_alarm_has_no_singleton_cut_after_hardening(self):
        _,_,_,opt=m.synthesize(self.cases(),m.TASKS['C_CLASS_ALARM'])
        self.assertEqual(m.singleton_cuts(opt['family']),())

    def test_full_hardened_cut_sets_match_capability(self):
        cs=self.cases()
        for task in ('H2_FULL','GLOBAL_REAUTH','ROUTE_REAUTH'):
            cap,_,_,opt=m.synthesize(cs,m.TASKS[task])
            self.assertEqual(m.minimal_cuts(opt['family']),m.minimal_cuts(cap),msg=task)

    def test_hardened_policy_is_upward_closed(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,_,_,opt=m.synthesize(cs,cfg)
            self.assertTrue(m.is_upward_closed(opt['family']),msg=name)

    def test_explicit_denies_are_preserved(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,_,_,opt=m.synthesize(cs,cfg)
            for deny in cfg['explicit_denies']:
                self.assertNotIn(deny,opt['family'],msg=name)

    def test_hardening_strictly_improves_reliability_at_p01(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,base,_,opt=m.synthesize(cs,cfg)
            rb=m.poly_eval(m.reliability_coeffs(base),0.1)
            rh=m.poly_eval(m.reliability_coeffs(opt['family']),0.1)
            self.assertGreater(rh,rb,msg=name)

    def test_full_task_reliability_recovery_is_one(self):
        cs=self.cases()
        for task in ('H2_FULL','GLOBAL_REAUTH','ROUTE_REAUTH'):
            cap,base,_,opt=m.synthesize(cs,m.TASKS[task])
            self.assertAlmostEqual(m.recovery_ratio(base,opt['family'],cap,0.1),1.0,places=12)

    def test_alarm_reliability_values(self):
        cs=self.cases()
        cap,base,_,opt=m.synthesize(cs,m.TASKS['C_CLASS_ALARM'])
        hard=opt['family']
        self.assertEqual(m.reliability_coeffs(hard),(1,0,-2,1))
        self.assertAlmostEqual(m.poly_eval(m.reliability_coeffs(base),0.1),0.9,places=12)
        self.assertAlmostEqual(m.poly_eval(m.reliability_coeffs(hard),0.1),0.981,places=12)
        self.assertAlmostEqual(m.poly_eval(m.reliability_coeffs(cap),0.1),0.99,places=12)

    def test_alarm_recovery_ratio(self):
        cs=self.cases()
        cap,base,_,opt=m.synthesize(cs,m.TASKS['C_CLASS_ALARM'])
        self.assertAlmostEqual(m.recovery_ratio(base,opt['family'],cap,0.1),0.9,places=12)
        self.assertAlmostEqual(m.recovery_ratio(base,opt['family'],cap,0.5),0.5,places=12)

    def test_optimizer_proves_minimum_add_count(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            _,_,valid,opt=m.synthesize(cs,cfg)
            self.assertTrue(all(v['added_count']>=opt['added_count'] for v in valid),msg=name)

if __name__=='__main__':
    unittest.main()
