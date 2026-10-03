import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah19.py"
spec=importlib.util.spec_from_file_location("ah19",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH19Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories_and_8_coalitions(self):
        self.assertEqual(len(self.cases()),48)
        self.assertEqual(len(m.COALITIONS),8)

    def test_frozen_access_families_exact(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            r=m.access_report(cs,cfg)
            self.assertEqual(r["capable"],cfg["expected_access"],msg=name)

    def test_minimal_families_exact(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            r=m.access_report(cs,cfg)
            self.assertEqual(r["minimal"],cfg["expected_minimal"],msg=name)

    def test_mandatory_cores_exact(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            r=m.access_report(cs,cfg)
            self.assertEqual(r["core"],cfg["expected_core"],msg=name)

    def test_all_capability_families_are_upward_closed(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            self.assertTrue(m.upward_closed(m.access_report(cs,cfg)["capable"]),msg=name)

    def test_all_policy_families_are_upward_closed(self):
        for name,cfg in m.TASKS.items():
            self.assertTrue(m.upward_closed(m.policy_family(cfg["policy_minimal"])),msg=name)

    def test_policy_is_strict_subset_of_capability(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            cap=set(m.access_report(cs,cfg)["capable"])
            pol=set(m.policy_family(cfg["policy_minimal"]))
            self.assertTrue(pol < cap,msg=name)

    def test_full_tasks_share_same_access_structure(self):
        cs=self.cases()
        a=m.access_report(cs,m.TASKS["H2_FULL"])["capable"]
        b=m.access_report(cs,m.TASKS["GLOBAL_REAUTH"])["capable"]
        c=m.access_report(cs,m.TASKS["ROUTE_REAUTH"])["capable"]
        self.assertEqual(a,b)
        self.assertEqual(a,c)

    def test_alarm_access_structure_is_different(self):
        cs=self.cases()
        full=m.access_report(cs,m.TASKS["H2_FULL"])["capable"]
        alarm=m.access_report(cs,m.TASKS["C_CLASS_ALARM"])["capable"]
        self.assertNotEqual(full,alarm)

    def test_E2_is_mandatory_for_full_tasks(self):
        cs=self.cases()
        for task in ("H2_FULL","GLOBAL_REAUTH","ROUTE_REAUTH"):
            self.assertEqual(m.access_report(cs,m.TASKS[task])["core"],("E2",))

    def test_alarm_has_no_mandatory_keyhole(self):
        self.assertEqual(
            m.access_report(self.cases(),m.TASKS["C_CLASS_ALARM"])["core"],
            ()
        )

    def test_alarm_minimal_coalitions_are_E1_or_E3(self):
        r=m.access_report(self.cases(),m.TASKS["C_CLASS_ALARM"])
        self.assertEqual(r["minimal"],(("E1",),("E3",)))

    def test_full_minimal_coalitions_are_two_specific_pairs(self):
        r=m.access_report(self.cases(),m.TASKS["H2_FULL"])
        self.assertEqual(r["minimal"],(("E1","E2"),("E2","E3")))

    def test_every_minimal_coalition_has_only_insufficient_strict_subsets(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            r=m.access_report(cs,cfg)
            for coalition in r["minimal"]:
                for d in m.COALITIONS:
                    if set(d) < set(coalition):
                        self.assertGreater(r["entropies"][d],0,msg=f"{name}:{coalition}:{d}")

    def test_policy_denies_at_least_one_capable_coalition_per_task(self):
        cs=self.cases()
        for name,cfg in m.TASKS.items():
            cap=set(m.access_report(cs,cfg)["capable"])
            pol=set(m.policy_family(cfg["policy_minimal"]))
            self.assertGreater(len(cap-pol),0,msg=name)

if __name__=="__main__":
    unittest.main()
