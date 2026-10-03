import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah16.py"
spec=importlib.util.spec_from_file_location("ah16",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH16Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_escrow_action_has_15_classes(self):
        cs=self.cases()
        self.assertEqual(len(set(m.values(cs,"action"))),15)

    def test_all_local_grant_barriers_are_positive(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            h=m.conditional_entropy(m.values(cs,cfg["target_query"]),m.values(cs,cfg["local"]))
            self.assertGreater(h,0,msg=gid)

    def test_full_escrow_resolves_every_grant(self):
        cs=self.cases()
        escrow=m.values(cs,"action")
        for gid,cfg in m.GRANTS.items():
            target=m.values(cs,cfg["target_query"])
            local=m.values(cs,cfg["local"])
            self.assertAlmostEqual(
                m.conditional_entropy(target,list(zip(local,escrow))),
                0.0,
                places=12,
                msg=gid
            )

    def test_release_is_function_of_escrow(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertIsNotNone(
                m.functional_map(cs,"action",cfg["release"]),
                msg=gid
            )

    def test_release_answers_newly_authorized_query(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertAlmostEqual(
                m.conditional_entropy(
                    m.values(cs,cfg["target_query"]),
                    m.values(cs,cfg["release"])
                ),
                0.0,
                places=12,
                msg=gid
            )

    def test_minimal_release_has_zero_excess_leakage(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertAlmostEqual(
                m.excess_leakage(cs,cfg["target_role"],cfg["release"]),
                0.0,
                places=12,
                msg=gid
            )

    def test_full_escrow_overretains_for_target_roles(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            self.assertAlmostEqual(
                m.excess_leakage(cs,cfg["target_role"],"action"),
                0.25,
                places=12,
                msg=gid
            )

    def test_grant_receipt_adds_no_information_beyond_release(self):
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

    def test_escrow_commitment_defeats_selective_release_in_small_domain(self):
        cs=self.cases()
        escrow=m.values(cs,"action")
        hm={x:m.sha(x) for x in set(escrow)}
        self.assertEqual(len(set(hm.values())),15)
        hashes=[hm[x] for x in escrow]
        for gid,cfg in m.GRANTS.items():
            release=m.values(cs,cfg["release"])
            auth=m.TARGET_ROLE_QUERIES[cfg["target_role"]]
            unauth=tuple(k for k in m.QUERY_ORDER if k not in auth)
            y=[m.qtuple(c,unauth) for c in cs]
            self.assertAlmostEqual(
                m.conditional_entropy(y,list(zip(release,hashes))),
                0.0,
                places=12,
                msg=gid
            )

    def test_degraded_H3_escrow_cannot_restore_route(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy(m.values(cs,"P2"),m.values(cs,"H3")),
            0.5471804688852168,
            places=12
        )

    def test_degraded_residue_escrow_cannot_restore_route(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy(m.values(cs,"P2"),m.values(cs,"residue")),
            0.25,
            places=12
        )

    def test_degraded_P2_escrow_cannot_restore_global(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy(m.values(cs,"G"),m.values(cs,"P2")),
            0.25,
            places=12
        )

    def test_grant_receipts_are_replay_exact(self):
        cs=self.cases()
        for gid,cfg in m.GRANTS.items():
            release=m.values(cs,cfg["release"])
            a=[m.canonical(m.grant_receipt(gid,cfg["target_role"],cfg["release"],v)) for v in release]
            b=[m.canonical(m.grant_receipt(gid,cfg["target_role"],cfg["release"],v)) for v in release]
            self.assertEqual(a,b)

    def test_escrow_entropy_is_3p875_bits(self):
        self.assertAlmostEqual(
            m.entropy(m.values(self.cases(),"action")),
            3.875,
            places=12
        )

if __name__=="__main__":
    unittest.main()
