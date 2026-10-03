import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah14.py"
spec=importlib.util.spec_from_file_location("ah14",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH14Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_15_old_action_classes(self):
        self.assertEqual(len(set(m.values(self.cases(),"action"))),15)

    def test_all_four_downgrades_are_functions_of_old_memory(self):
        cs=self.cases()
        for cfg in m.ROLES.values():
            d=m.downgrade_map(cs,cfg["descriptor"])
            self.assertEqual(len(d),15)

    def test_downgrade_matches_direct_global_memory(self):
        cs=self.cases()
        d=m.downgrade_map(cs,"residue")
        self.assertEqual([d[c["action"]] for c in cs],m.values(cs,"residue"))

    def test_downgrade_matches_direct_H2_memory(self):
        cs=self.cases()
        d=m.downgrade_map(cs,"H2")
        self.assertEqual([d[c["action"]] for c in cs],m.values(cs,"H2"))

    def test_downgrade_matches_direct_H3_memory(self):
        cs=self.cases()
        d=m.downgrade_map(cs,"H3")
        self.assertEqual([d[c["action"]] for c in cs],m.values(cs,"H3"))

    def test_downgrade_matches_direct_P2_memory(self):
        cs=self.cases()
        d=m.downgrade_map(cs,"P2")
        self.assertEqual([d[c["action"]] for c in cs],m.values(cs,"P2"))

    def test_authorized_answers_survive(self):
        cs=self.cases()
        for cfg in m.ROLES.values():
            d=m.downgrade_map(cs,cfg["descriptor"])
            new=[d[c["action"]] for c in cs]
            auth=[m.query_tuple(c,cfg["authorized"]) for c in cs]
            self.assertAlmostEqual(m.conditional_entropy(auth,new),0.0,places=12)

    def test_revoked_answers_become_uncertain(self):
        cs=self.cases()
        for role,cfg in m.ROLES.items():
            d=m.downgrade_map(cs,cfg["descriptor"])
            new=[d[c["action"]] for c in cs]
            revoked=tuple(k for k in m.QUERY_ORDER if k not in cfg["authorized"])
            rv=[m.query_tuple(c,revoked) for c in cs]
            self.assertAlmostEqual(
                m.conditional_entropy(rv,new),
                cfg["revoked_entropy"],
                places=12,
                msg=role
            )

    def test_old_memory_answers_revoked_queries(self):
        cs=self.cases()
        old=m.values(cs,"action")
        for cfg in m.ROLES.values():
            revoked=tuple(k for k in m.QUERY_ORDER if k not in cfg["authorized"])
            rv=[m.query_tuple(c,revoked) for c in cs]
            self.assertAlmostEqual(m.conditional_entropy(rv,old),0.0,places=12)

    def test_old_hash_is_unique_over_frozen_old_classes(self):
        old_classes=set(m.values(self.cases(),"action"))
        hashes={m.old_receipt(x) for x in old_classes}
        self.assertEqual(len(hashes),15)

    def test_new_receipt_adds_no_information_beyond_new_memory(self):
        cs=self.cases()
        for role,cfg in m.ROLES.items():
            d=m.downgrade_map(cs,cfg["descriptor"])
            new=[d[c["action"]] for c in cs]
            receipts=[
                m.new_receipt(role,cfg["descriptor"],d[c["action"]])["receipt_hash"]
                for c in cs
            ]
            revoked=tuple(k for k in m.QUERY_ORDER if k not in cfg["authorized"])
            rv=[m.query_tuple(c,revoked) for c in cs]
            self.assertAlmostEqual(
                m.conditional_entropy(rv,list(zip(new,receipts))),
                m.conditional_entropy(rv,new),
                places=12
            )

    def test_old_receipt_defeats_downgrade_in_enumerable_domain(self):
        cs=self.cases()
        old_classes=set(m.values(cs,"action"))
        old_hash={x:m.old_receipt(x) for x in old_classes}
        for role,cfg in m.ROLES.items():
            d=m.downgrade_map(cs,cfg["descriptor"])
            new=[d[c["action"]] for c in cs]
            receipts=[old_hash[c["action"]] for c in cs]
            revoked=tuple(k for k in m.QUERY_ORDER if k not in cfg["authorized"])
            rv=[m.query_tuple(c,revoked) for c in cs]
            self.assertAlmostEqual(
                m.conditional_entropy(rv,list(zip(new,receipts))),
                0.0,
                places=12,
                msg=role
            )

    def test_receipts_are_replay_exact(self):
        cs=self.cases()
        for role,cfg in m.ROLES.items():
            d=m.downgrade_map(cs,cfg["descriptor"])
            a=[m.canonical(m.new_receipt(role,cfg["descriptor"],d[c["action"]])) for c in cs]
            b=[m.canonical(m.new_receipt(role,cfg["descriptor"],d[c["action"]])) for c in cs]
            self.assertEqual(a,b)

    def test_retention_reduces_for_every_role(self):
        cs=self.cases()
        old_h=m.entropy(m.values(cs,"action"))
        for cfg in m.ROLES.values():
            new_h=m.entropy(m.values(cs,cfg["descriptor"]))
            self.assertLess(new_h,old_h)

if __name__=="__main__":
    unittest.main()
