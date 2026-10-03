import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah17.py"
spec=importlib.util.spec_from_file_location("ah17",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH17Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_each_share_has_two_classes(self):
        cs=self.cases()
        self.assertEqual(len(set(m.values(cs,"E1"))),2)
        self.assertEqual(len(set(m.values(cs,"E2"))),2)

    def test_joint_shares_have_three_classes(self):
        cs=self.cases()
        self.assertEqual(len(set(zip(m.values(cs,"E1"),m.values(cs,"E2")))),3)

    def test_joint_shares_reconstruct_H2(self):
        cs=self.cases()
        fmap=m.functional_map(cs,("E1","E2"),"H2")
        self.assertIsNotNone(fmap)
        self.assertEqual(len(fmap),3)

    def test_joint_entropy_equals_H2_entropy(self):
        cs=self.cases()
        pair=list(zip(m.values(cs,"E1"),m.values(cs,"E2")))
        self.assertAlmostEqual(m.entropy(pair),1.5,places=12)
        self.assertAlmostEqual(m.entropy(m.values(cs,"H2")),1.5,places=12)

    def test_route_to_global_requires_both_shares(self):
        cs=self.cases()
        local=m.values(cs,"P2")
        target=m.values(cs,"G")
        e1=m.values(cs,"E1")
        e2=m.values(cs,"E2")
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e1))),0.125,places=12)
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e2))),0.125,places=12)
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e1,e2))),0.0,places=12)

    def test_downstream_to_route_requires_both_shares(self):
        cs=self.cases()
        local=m.values(cs,"H3")
        target=m.values(cs,"P2")
        e1=m.values(cs,"E1")
        e2=m.values(cs,"E2")
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e1))),0.25,places=12)
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e2))),0.25,places=12)
        self.assertAlmostEqual(m.conditional_entropy(target,list(zip(local,e1,e2))),0.0,places=12)

    def test_neither_share_is_sufficient_in_any_grant(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            local=m.values(cs,cfg["local"])
            target=m.values(cs,cfg["target"])
            for share in ("E1","E2"):
                self.assertGreater(
                    m.conditional_entropy(target,list(zip(local,m.values(cs,share)))),
                    0,
                    msg=f"{gid}:{share}"
                )

    def test_joint_share_release_is_functional(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertIsNotNone(
                m.functional_map(cs,(cfg["local"],"E1","E2"),cfg["release"]),
                msg=gid
            )

    def test_release_answers_target(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertAlmostEqual(
                m.conditional_entropy(m.values(cs,cfg["target"]),m.values(cs,cfg["release"])),
                0.0,
                places=12
            )

    def test_release_has_zero_excess_leakage(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertAlmostEqual(
                m.excess_leakage(cs,cfg["target_role"],cfg["release"]),
                0.0,
                places=12
            )

    def test_receipt_adds_no_information_beyond_release(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            release=m.values(cs,cfg["release"])
            receipts=[
                m.grant_receipt(gid,cfg["target_role"],cfg["release"],v)["receipt_hash"]
                for v in release
            ]
            auth=m.TARGET_ROLE_QUERIES[cfg["target_role"]]
            unauth=tuple(k for k in m.QUERY_ORDER if k not in auth)
            y=[m.qtuple(c,unauth) for c in cs]
            self.assertAlmostEqual(
                m.conditional_entropy(y,list(zip(release,receipts))),
                m.conditional_entropy(y,release),
                places=12
            )

    def test_share_entropies(self):
        cs=self.cases()
        self.assertAlmostEqual(m.entropy(m.values(cs,"E1")),0.8112781244591328,places=12)
        self.assertAlmostEqual(m.entropy(m.values(cs,"E2")),0.8112781244591328,places=12)

if __name__=="__main__":
    unittest.main()
