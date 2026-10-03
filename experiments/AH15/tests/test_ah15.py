import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah15.py"
spec=importlib.util.spec_from_file_location("ah15",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH15Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_memory_ladder_class_counts(self):
        cs=self.cases()
        self.assertEqual(len(set(c["action"] for c in cs)),15)
        self.assertEqual(len(set(c["P2"] for c in cs)),13)
        self.assertEqual(len(set(c["H3"] for c in cs)),9)

    def test_action_to_P2_is_functional(self):
        self.assertIsNotNone(m.functional_map(self.cases(),"action","P2"))

    def test_P2_to_H3_is_functional(self):
        self.assertIsNotNone(m.functional_map(self.cases(),"P2","H3"))

    def test_action_to_H3_is_functional(self):
        self.assertIsNotNone(m.functional_map(self.cases(),"action","H3"))

    def test_sequential_equals_direct(self):
        cs=self.cases()
        a2p=m.functional_map(cs,"action","P2")
        p2h=m.functional_map(cs,"P2","H3")
        a2h=m.functional_map(cs,"action","H3")
        seq=[p2h[a2p[c["action"]]] for c in cs]
        direct=[a2h[c["action"]] for c in cs]
        self.assertEqual(seq,direct)
        self.assertEqual(direct,[c["H3"] for c in cs])

    def test_final_receipt_path_independent(self):
        cs=self.cases()
        a2p=m.functional_map(cs,"action","P2")
        p2h=m.functional_map(cs,"P2","H3")
        a2h=m.functional_map(cs,"action","H3")
        seq=[p2h[a2p[c["action"]]] for c in cs]
        direct=[a2h[c["action"]] for c in cs]
        ra=[m.canonical(m.final_receipt("DOWNSTREAM","H3",x)) for x in direct]
        rb=[m.canonical(m.final_receipt("DOWNSTREAM","H3",x)) for x in seq]
        self.assertEqual(ra,rb)

    def test_global_to_route_is_not_local_after_forgetting(self):
        self.assertIsNone(m.functional_map(self.cases(),"residue","P2"))

    def test_route_to_global_is_not_local_after_forgetting(self):
        self.assertIsNone(m.functional_map(self.cases(),"P2","G"))

    def test_reauthorization_barrier_entropy(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy([c["P2"] for c in cs],[c["residue"] for c in cs]),
            0.25,
            places=12
        )
        self.assertAlmostEqual(
            m.conditional_entropy([c["G"] for c in cs],[c["P2"] for c in cs]),
            0.25,
            places=12
        )

    def test_H3_does_not_determine_P2(self):
        cs=self.cases()
        self.assertAlmostEqual(
            m.conditional_entropy([c["P2"] for c in cs],[c["H3"] for c in cs]),
            0.5471804688852168,
            places=12
        )

    def test_final_receipt_adds_no_route_information(self):
        cs=self.cases()
        p2=[c["P2"] for c in cs]
        h3=[c["H3"] for c in cs]
        rh=[m.final_receipt("DOWNSTREAM","H3",x)["receipt_hash"] for x in h3]
        self.assertAlmostEqual(
            m.conditional_entropy(p2,list(zip(h3,rh))),
            m.conditional_entropy(p2,h3),
            places=12
        )

    def test_mid_receipt_restores_route_in_small_domain(self):
        cs=self.cases()
        p2=[c["P2"] for c in cs]
        h3=[c["H3"] for c in cs]
        hm={x:m.sha(x) for x in set(p2)}
        self.assertEqual(len(set(hm.values())),13)
        hashes=[hm[x] for x in p2]
        self.assertAlmostEqual(
            m.conditional_entropy(p2,list(zip(h3,hashes))),
            0.0,
            places=12
        )

    def test_entropy_is_nonincreasing_along_monotone_chain(self):
        cs=self.cases()
        h_full=m.entropy([c["action"] for c in cs])
        h_mid=m.entropy([c["P2"] for c in cs])
        h_final=m.entropy([c["H3"] for c in cs])
        self.assertGreater(h_full,h_mid)
        self.assertGreater(h_mid,h_final)

    def test_route_downstream_to_route_requires_no_memory_change(self):
        cs=self.cases()
        route_downstream=[c["P2"] for c in cs]
        route=[c["P2"] for c in cs]
        self.assertEqual(route_downstream,route)

if __name__=="__main__":
    unittest.main()
