import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah18.py"
spec=importlib.util.spec_from_file_location("ah18",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH18Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_all_singletons_have_two_classes(self):
        cs=self.cases()
        for s in m.SHARES:
            self.assertEqual(len(set(m.values(cs,s))),2)

    def test_all_singletons_are_H2_insufficient(self):
        cs=self.cases()
        h2=m.values(cs,"H2")
        for s in m.SHARES:
            self.assertGreater(m.conditional_entropy(h2,m.values(cs,s)),0)

    def test_E1_E2_recovers_H2(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy(m.values(cs,"H2"),m.coalition_values(cs,("E1","E2"))),
            0.0,
            places=12
        )

    def test_E2_E3_recovers_H2(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy(m.values(cs,"H2"),m.coalition_values(cs,("E2","E3"))),
            0.0,
            places=12
        )

    def test_E1_E3_is_redundant_and_insufficient(self):
        cs=self.cases()
        h=m.conditional_entropy(m.values(cs,"H2"),m.coalition_values(cs,("E1","E3")))
        self.assertAlmostEqual(h,0.6887218755408672,places=12)
        self.assertEqual(len(set(m.coalition_values(cs,("E1","E3")))),2)

    def test_E1_and_E3_induce_same_partition(self):
        cs=self.cases()
        self.assertIsNotNone(m.functional_map(cs,("E1",),"E3"))
        self.assertIsNotNone(m.functional_map(cs,("E3",),"E1"))

    def test_route_to_global_pair_matrix(self):
        cs=self.cases()
        local=m.values(cs,"P2")
        target=m.values(cs,"G")
        def h(pair):
            return m.conditional_entropy(target,[tuple([c["P2"]]+[c[s] for s in pair]) for c in cs])
        self.assertAlmostEqual(h(("E1","E2")),0.0,places=12)
        self.assertAlmostEqual(h(("E2","E3")),0.0,places=12)
        self.assertAlmostEqual(h(("E1","E3")),0.125,places=12)

    def test_downstream_to_route_pair_matrix(self):
        cs=self.cases()
        target=m.values(cs,"P2")
        def h(pair):
            return m.conditional_entropy(target,[tuple([c["H3"]]+[c[s] for s in pair]) for c in cs])
        self.assertAlmostEqual(h(("E1","E2")),0.0,places=12)
        self.assertAlmostEqual(h(("E2","E3")),0.0,places=12)
        self.assertAlmostEqual(h(("E1","E3")),0.25,places=12)

    def test_every_singleton_remains_insufficient_for_both_grants(self):
        cs=self.cases()
        for cfg in m.GRANTS.values():
            target=m.values(cs,cfg["target"])
            local=m.values(cs,cfg["local"])
            for s in m.SHARES:
                self.assertGreater(
                    m.conditional_entropy(target,list(zip(local,m.values(cs,s)))),
                    0
                )

    def test_authorized_pair_release_is_functional(self):
        cs=self.cases()
        for cfg in m.GRANTS.values():
            self.assertIsNotNone(
                m.functional_map(cs,(cfg["local"],)+cfg["authorized_pair"],cfg["release"])
            )

    def test_capable_but_denied_pair_is_mathematically_sufficient(self):
        cs=self.cases()
        for cfg in m.GRANTS.values():
            pair=cfg["capable_but_denied_pair"]
            target=m.values(cs,cfg["target"])
            desc=[tuple([c[cfg["local"]]]+[c[s] for s in pair]) for c in cs]
            self.assertAlmostEqual(m.conditional_entropy(target,desc),0.0,places=12)

    def test_release_has_zero_excess_leakage(self):
        cs=self.cases()
        for cfg in m.GRANTS.values():
            self.assertAlmostEqual(
                m.excess_leakage(cs,cfg["target_role"],cfg["release"]),
                0.0,
                places=12
            )

    def test_pair_entropies(self):
        cs=self.cases()
        self.assertAlmostEqual(m.entropy(m.coalition_values(cs,("E1","E2"))),1.5,places=12)
        self.assertAlmostEqual(m.entropy(m.coalition_values(cs,("E2","E3"))),1.5,places=12)
        self.assertAlmostEqual(m.entropy(m.coalition_values(cs,("E1","E3"))),0.8112781244591328,places=12)

if __name__=="__main__":
    unittest.main()
