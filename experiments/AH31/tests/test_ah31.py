import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah31.py"
spec=importlib.util.spec_from_file_location("ah31",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH31Tests(unittest.TestCase):
    def test_16_coalitions(self):
        self.assertEqual(len(m.actor_coalitions()),16)

    def test_all_singletons_safe(self):
        for a in m.ACTORS:
            self.assertFalse(m.dangerous((a,)),msg=a)

    def test_minimal_dangerous_exact(self):
        self.assertEqual(
            m.minimal_dangerous(m.actor_coalitions()),
            (
                ("ADAPTIVE_CONTROLLER","AUDITOR"),
                ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER"),
            )
        )

    def test_auditor_adaptive_collusion_derives_multi(self):
        self.assertTrue(m.dangerous(("ADAPTIVE_CONTROLLER","AUDITOR")))

    def test_historian_operator_adaptive_collusion_derives_multi(self):
        self.assertTrue(m.dangerous(("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER")))

    def test_historian_operator_without_adaptive_safe(self):
        self.assertFalse(m.dangerous(("HISTORIAN","OPERATOR")))

    def test_mandatory_core_is_adaptive(self):
        mins=m.minimal_dangerous(m.actor_coalitions())
        core=set(mins[0])
        for c in mins[1:]:
            core &= set(c)
        self.assertEqual(core,{"ADAPTIVE_CONTROLLER"})

    def test_minimal_cut_sets(self):
        mins=m.minimal_dangerous(m.actor_coalitions())
        self.assertEqual(
            m.minimal_hitting_sets(mins),
            (
                ("ADAPTIVE_CONTROLLER",),
                ("HISTORIAN","AUDITOR"),
                ("OPERATOR","AUDITOR"),
            )
        )

    def test_closure_entropy_equivalence_all_coalitions(self):
        p=m.build_panels()
        for c in m.actor_coalitions():
            derivable=m.M in m.closure(m.pooled_direct(c))
            zero=abs(m.coalition_entropy(p,c))<1e-12
            self.assertEqual(derivable,zero,msg=c)

    def test_entropy_controls(self):
        p=m.build_panels()
        self.assertAlmostEqual(m.coalition_entropy(p,("AUDITOR",)),0.39355535745192405,places=12)
        self.assertAlmostEqual(m.coalition_entropy(p,("HISTORIAN","ADAPTIVE_CONTROLLER")),0.2857142857142857,places=12)
        self.assertAlmostEqual(m.coalition_entropy(p,("OPERATOR","ADAPTIVE_CONTROLLER")),0.6792696431662097,places=12)

    def test_dangerous_family_is_upward_closed(self):
        cs=m.actor_coalitions()
        for c in cs:
            for d in cs:
                if m.dangerous(c) and set(c).issubset(set(d)):
                    self.assertTrue(m.dangerous(d),msg=(c,d))

    def test_32_release_configurations(self):
        self.assertEqual(len(m.all_release_configs()),32)

    def test_coverage_preserving_configs_all_grand_unsafe(self):
        cfgs=[c for c in m.all_release_configs() if m.coverage(c)]
        self.assertGreater(len(cfgs),0)
        self.assertTrue(all(not m.grand_coalition_safe(c) for c in cfgs))

    def test_removing_adaptive_breaks_grand_derivation_but_coverage(self):
        cfg=tuple(g for g in m.BASELINE_GRANTS if g[1]!=m.A)
        self.assertFalse(m.coverage(cfg))
        self.assertTrue(m.grand_coalition_safe(cfg))

    def test_replay_deterministic(self):
        p=m.build_panels()
        a=[(c,m.pooled_direct(c),m.closure(m.pooled_direct(c)),m.coalition_entropy(p,c)) for c in m.actor_coalitions()]
        b=[(c,m.pooled_direct(c),m.closure(m.pooled_direct(c)),m.coalition_entropy(p,c)) for c in m.actor_coalitions()]
        self.assertEqual(m.canonical(a),m.canonical(b))

if __name__=="__main__":
    unittest.main()
