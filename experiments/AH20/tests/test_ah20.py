import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah20.py"
spec=importlib.util.spec_from_file_location("ah20",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH20Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories_and_8_failure_sets(self):
        self.assertEqual(len(self.cases()),48)
        self.assertEqual(len(m.COALITIONS),8)

    def test_full_capability_minimal_cuts(self):
        cs=self.cases()
        for task in ("H2_FULL","GLOBAL_REAUTH","ROUTE_REAUTH"):
            cap=m.capability_family(cs,m.TASKS[task])
            self.assertEqual(m.minimal_cuts(cap),(("E2",),("E1","E3")))

    def test_alarm_capability_minimal_cut(self):
        cs=self.cases()
        cap=m.capability_family(cs,m.TASKS["C_CLASS_ALARM"])
        self.assertEqual(m.minimal_cuts(cap),(("E1","E3"),))

    def test_policy_minimal_cuts(self):
        expected={
            "H2_FULL":(("E1",),("E2",)),
            "GLOBAL_REAUTH":(("E1",),("E2",)),
            "ROUTE_REAUTH":(("E2",),("E3",)),
            "C_CLASS_ALARM":(("E3",),),
        }
        for task,cuts in expected.items():
            pol=m.policy_family(m.TASKS[task]["policy_minimal"])
            self.assertEqual(m.minimal_cuts(pol),cuts,msg=task)

    def test_failure_families_are_upward_closed(self):
        cs=self.cases()
        for task,cfg in m.TASKS.items():
            self.assertTrue(m.upward_closed_failure(m.capability_family(cs,cfg)),msg=f"cap:{task}")
            self.assertTrue(m.upward_closed_failure(m.policy_family(cfg["policy_minimal"])),msg=f"pol:{task}")

    def test_cut_sets_equal_minimal_hitting_sets(self):
        cs=self.cases()
        for task,cfg in m.TASKS.items():
            for fam in (
                m.capability_family(cs,cfg),
                m.policy_family(cfg["policy_minimal"]),
            ):
                self.assertEqual(
                    m.minimal_cuts(fam),
                    m.minimal_hitting_sets(m.minimal_success(fam))
                )

    def test_full_capability_reliability_polynomial(self):
        cap=m.capability_family(self.cases(),m.TASKS["H2_FULL"])
        self.assertEqual(m.reliability_coeffs(cap),(1,-1,-1,1))

    def test_full_policy_reliability_polynomial(self):
        pol=m.policy_family(m.TASKS["H2_FULL"]["policy_minimal"])
        self.assertEqual(m.reliability_coeffs(pol),(1,-2,1,0))

    def test_alarm_reliability_polynomials(self):
        cs=self.cases()
        cap=m.capability_family(cs,m.TASKS["C_CLASS_ALARM"])
        pol=m.policy_family(m.TASKS["C_CLASS_ALARM"]["policy_minimal"])
        self.assertEqual(m.reliability_coeffs(cap),(1,0,-1,0))
        self.assertEqual(m.reliability_coeffs(pol),(1,-1,0,0))

    def test_full_reliability_spot_values(self):
        cs=self.cases()
        cap=m.reliability_coeffs(m.capability_family(cs,m.TASKS["H2_FULL"]))
        pol=m.reliability_coeffs(m.policy_family(m.TASKS["H2_FULL"]["policy_minimal"]))
        self.assertAlmostEqual(m.poly_eval(cap,0.1),0.891,places=12)
        self.assertAlmostEqual(m.poly_eval(pol,0.1),0.81,places=12)
        self.assertAlmostEqual(m.poly_eval(cap,0.5),0.375,places=12)
        self.assertAlmostEqual(m.poly_eval(pol,0.5),0.25,places=12)

    def test_alarm_reliability_spot_values(self):
        cs=self.cases()
        cap=m.reliability_coeffs(m.capability_family(cs,m.TASKS["C_CLASS_ALARM"]))
        pol=m.reliability_coeffs(m.policy_family(m.TASKS["C_CLASS_ALARM"]["policy_minimal"]))
        self.assertAlmostEqual(m.poly_eval(cap,0.1),0.99,places=12)
        self.assertAlmostEqual(m.poly_eval(pol,0.1),0.9,places=12)
        self.assertAlmostEqual(m.poly_eval(cap,0.5),0.75,places=12)
        self.assertAlmostEqual(m.poly_eval(pol,0.5),0.5,places=12)

    def test_policy_never_more_reliable_under_same_failure_model(self):
        cs=self.cases()
        for task,cfg in m.TASKS.items():
            cap=m.reliability_coeffs(m.capability_family(cs,cfg))
            pol=m.reliability_coeffs(m.policy_family(cfg["policy_minimal"]))
            for p in (0,0.1,0.25,0.5,0.75,1):
                self.assertLessEqual(m.poly_eval(pol,p),m.poly_eval(cap,p)+1e-12,msg=f"{task}:{p}")

    def test_policy_induced_singleton_vulnerabilities(self):
        cs=self.cases()
        expected={
            "H2_FULL":(("E1",),),
            "GLOBAL_REAUTH":(("E1",),),
            "ROUTE_REAUTH":(("E3",),),
            "C_CLASS_ALARM":(("E3",),),
        }
        for task,cfg in m.TASKS.items():
            cap_single=m.singleton_cuts(m.minimal_cuts(m.capability_family(cs,cfg)))
            pol_single=m.singleton_cuts(m.minimal_cuts(m.policy_family(cfg["policy_minimal"])))
            induced=tuple(x for x in pol_single if x not in cap_single)
            self.assertEqual(induced,expected[task],msg=task)

    def test_E2_is_capability_single_point_for_full_tasks(self):
        cs=self.cases()
        for task in ("H2_FULL","GLOBAL_REAUTH","ROUTE_REAUTH"):
            cap=m.capability_family(cs,m.TASKS[task])
            self.assertFalse(m.survives(("E2",),cap))
            self.assertTrue(m.survives(("E1",),cap))
            self.assertTrue(m.survives(("E3",),cap))

    def test_alarm_has_no_single_capability_failure(self):
        cap=m.capability_family(self.cases(),m.TASKS["C_CLASS_ALARM"])
        for s in m.SHARES:
            self.assertTrue(m.survives((s,),cap),msg=s)

if __name__=="__main__":
    unittest.main()
