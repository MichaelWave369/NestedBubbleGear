import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah13.py"
spec=importlib.util.spec_from_file_location("ah13",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH13Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_capability_memory(self):
        cs=self.cases()
        action=m.descriptor_values(cs,"action")
        self.assertEqual(len(set(action)),15)
        self.assertAlmostEqual(m.entropy(action),3.875,places=12)

    def test_global_role(self):
        r=m.descriptor_report(self.cases(),("G",),"residue")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["classes"],13)

    def test_interface_role(self):
        r=m.descriptor_report(self.cases(),("H2",),"H2")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["classes"],3)

    def test_downstream_role(self):
        r=m.descriptor_report(self.cases(),("H3",),"H3")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["classes"],9)

    def test_route_role(self):
        r=m.descriptor_report(self.cases(),("P2",),"cumulative")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["classes"],13)

    def test_full_role(self):
        r=m.descriptor_report(self.cases(),m.QUERY_ORDER,"action")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["classes"],15)

    def test_restricted_roles_retain_less_than_full(self):
        cs=self.cases()
        full=m.entropy(m.descriptor_values(cs,"action"))
        for role in ("GLOBAL_OPERATOR","INTERFACE_INSPECTOR","DOWNSTREAM_INSPECTOR","ROUTE_AUDITOR"):
            cfg=m.ROLES[role]
            selected=m.entropy(m.descriptor_values(cs,cfg["descriptor"]))
            self.assertLess(selected,full)

    def test_selected_role_memories_have_zero_excess_leakage(self):
        cs=self.cases()
        for role in ("GLOBAL_OPERATOR","INTERFACE_INSPECTOR","DOWNSTREAM_INSPECTOR","ROUTE_AUDITOR"):
            cfg=m.ROLES[role]
            leak=m.leakage_report(cs,cfg["authorized"],cfg["descriptor"])
            self.assertAlmostEqual(leak["excess_bits"],0.0,places=12)

    def test_full_action_overretains_for_global_role(self):
        cs=self.cases()
        leak=m.leakage_report(cs,("G",),"action")
        self.assertAlmostEqual(leak["excess_bits"],0.25,places=12)

    def test_full_action_overretains_for_interface_role(self):
        cs=self.cases()
        leak=m.leakage_report(cs,("H2",),"action")
        self.assertAlmostEqual(leak["excess_bits"],2.375,places=12)

    def test_full_action_overretains_for_downstream_role(self):
        cs=self.cases()
        leak=m.leakage_report(cs,("H3",),"action")
        self.assertAlmostEqual(leak["excess_bits"],0.7971804688852169,places=12)

    def test_full_action_overretains_for_route_role(self):
        cs=self.cases()
        leak=m.leakage_report(cs,("P2",),"action")
        self.assertAlmostEqual(leak["excess_bits"],0.25,places=12)

    def test_capability_not_authority_witness(self):
        cs=self.cases()
        g=m.query_values(cs,("G",))
        h2=m.descriptor_values(cs,"H2")
        self.assertAlmostEqual(m.conditional_entropy(g,h2),2.375,places=12)

    def test_global_memory_does_not_preserve_all_other_answers(self):
        cs=self.cases()
        residue=m.descriptor_values(cs,"residue")
        h2=m.query_values(cs,("H2",))
        p2=m.query_values(cs,("P2",))
        self.assertAlmostEqual(m.conditional_entropy(h2,residue),0.25,places=12)
        self.assertAlmostEqual(m.conditional_entropy(p2,residue),0.25,places=12)

if __name__=="__main__":
    unittest.main()
