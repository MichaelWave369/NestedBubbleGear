import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"m2_generate.py"
spec=importlib.util.spec_from_file_location("m2_generate",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class M2Tests(unittest.TestCase):
    def test_case_seed_deterministic(self):
        self.assertEqual(m.case_seed("P1_SUCCESS_FAILURE_DUALITY",7),m.case_seed("P1_SUCCESS_FAILURE_DUALITY",7))

    def test_p1_known_duality(self):
        elems=("E1","E2","E3")
        success=(("E1","E2"),("E2","E3"))
        self.assertEqual(m.minimal_hitting_sets(elems,success),(("E2",),("E1","E3")))
        self.assertEqual(m.direct_minimal_failure_sets(elems,success),(("E2",),("E1","E3")))

    def test_fusion_never_adds_roots_simple(self):
        before={"P0":"R0","P1":"R1","P2":"R2"}
        rng=m.random.Random(1)
        after=m.fuse_map(before,rng)
        self.assertLessEqual(len(set(after.values())),len(set(before.values())))

    def test_incomplete_certification_refuses(self):
        status,adv=m.certify({"A":"R1","B":None,"C":"R3"})
        self.assertEqual(status,"INDEPENDENCE_UNVERIFIED")
        self.assertFalse(adv)

    def test_exact_reconstruct_coarse_implies_fine_example(self):
        y=[0,0,1,1]
        fine=["a","b","c","d"]
        coarse=["x","x","y","y"]
        self.assertTrue(m.exact_reconstruct(y,coarse))
        self.assertTrue(m.exact_reconstruct(y,fine))

    def test_refinement_entropy_direction_example(self):
        y=[0,0,1,1]
        coarse=[0,0,0,0]
        refined=[(0,0),(0,0),(0,1),(0,1)]
        self.assertLessEqual(m.conditional_entropy(y,refined),m.conditional_entropy(y,coarse))

    def test_suite_has_six_properties(self):
        self.assertEqual(len(m.PROPERTIES),6)

    def test_suite_has_1500_cases(self):
        r,_,_=m.run_suite()
        self.assertEqual(r["total_cases"],1500)

    def test_suite_zero_counterexamples(self):
        r,ce,_=m.run_suite()
        self.assertEqual(r["counterexample_count"],0)
        self.assertEqual(ce,[])

    def test_replay_exact(self):
        a,ce1,cr1=m.run_suite()
        b,ce2,cr2=m.run_suite()
        self.assertEqual(m.canonical(a),m.canonical(b))
        self.assertEqual(m.canonical(ce1),m.canonical(ce2))
        self.assertEqual(m.canonical(cr1),m.canonical(cr2))

if __name__=="__main__":
    unittest.main()
