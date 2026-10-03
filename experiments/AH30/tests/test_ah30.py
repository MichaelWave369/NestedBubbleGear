import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah30.py"
spec=importlib.util.spec_from_file_location("ah30",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH30Tests(unittest.TestCase):
    def test_tri_direct_vs_effective(self):
        self.assertNotIn(m.M,m.ROLE_DIRECT["TRI_HORIZON_ANALYST"])
        self.assertIn(m.M,m.closure(m.ROLE_DIRECT["TRI_HORIZON_ANALYST"]))

    def test_auditor_does_not_derive_multi(self):
        self.assertNotIn(m.M,m.closure(m.ROLE_DIRECT["AUDITOR"]))

    def test_multi_alone_exposes_singles(self):
        self.assertEqual(m.closure((m.M,)),(m.L,m.R,m.A,m.M))

    def test_closure_extensive(self):
        for s in m.all_subsets(m.CONTRACTS):
            self.assertTrue(set(s).issubset(set(m.closure(s))))

    def test_closure_idempotent(self):
        for s in m.all_subsets(m.CONTRACTS):
            self.assertEqual(m.closure(m.closure(s)),m.closure(s))

    def test_closure_monotone(self):
        subs=m.all_subsets(m.CONTRACTS)
        for s in subs:
            for t in subs:
                if set(s).issubset(set(t)):
                    self.assertTrue(set(m.closure(s)).issubset(set(m.closure(t))))

    def test_any_single_removal_breaks_multi(self):
        for keep in ((m.R,m.A),(m.L,m.A),(m.L,m.R)):
            self.assertNotIn(m.M,m.closure(keep))

    def test_hardening_unique_solution_under_requirements(self):
        selected,candidates=m.synthesize_hardening((m.L,m.R,m.A),(m.L,m.R),m.M)
        self.assertEqual(selected["keep"],(m.L,m.R))
        self.assertEqual(selected["removed"],(m.A,))
        self.assertEqual(selected["remove_count"],1)
        self.assertEqual(sum(1 for c in candidates if c["remove_count"]==1),1)

    def test_hardening_preserves_required(self):
        selected,_=m.synthesize_hardening((m.L,m.R,m.A),(m.L,m.R),m.M)
        self.assertTrue({m.L,m.R}.issubset(set(selected["keep"])))

    def test_hardening_makes_deny_derivation_safe(self):
        self.assertEqual(m.deny_audit((m.L,m.R,m.A),m.M),"INTERFACE_ONLY_DENY")
        self.assertEqual(m.deny_audit((m.L,m.R),m.M),"DERIVATION_SAFE_DENY")

    def test_entropy_full_is_zero(self):
        self.assertAlmostEqual(m.residual_entropy(m.build_panels(),(m.L,m.R,m.A)),0.0,places=12)

    def test_entropy_LR_positive_exact(self):
        self.assertAlmostEqual(m.residual_entropy(m.build_panels(),(m.L,m.R)),0.39355535745192405,places=12)

    def test_all_one_removal_entropies_positive(self):
        p=m.build_panels()
        for keep in ((m.L,m.R),(m.L,m.A),(m.R,m.A)):
            self.assertGreater(m.residual_entropy(p,keep),0.0)

    def test_receipt_records_effective_change(self):
        r=m.make_receipt(m.build_panels())
        self.assertIn(m.M,r["baseline_effective_authority"])
        self.assertNotIn(m.M,r["selected_hardened_effective_authority"])
        self.assertEqual(r["removed_releases"],[m.A])

    def test_receipt_replay_exact(self):
        p=m.build_panels()
        self.assertEqual(m.canonical(m.make_receipt(p)),m.canonical(m.make_receipt(p)))

if __name__=="__main__":
    unittest.main()
