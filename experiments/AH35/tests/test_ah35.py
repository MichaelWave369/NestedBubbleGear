import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah35.py"
spec=importlib.util.spec_from_file_location("ah35",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH35Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def test_243_valid_upgrade_sets(self):
        self.assertEqual(len(m.valid_upgrade_sets()),243)
        self.assertEqual(len(set(m.valid_upgrade_sets())),243)

    def test_137_dangerous(self):
        p=self.panels()
        self.assertEqual(sum(m.is_dangerous(p,x) for x in m.valid_upgrade_sets()),137)

    def test_dangerous_upward_closed(self):
        p=self.panels()
        valid=m.valid_upgrade_sets()
        bad=[x for x in valid if m.is_dangerous(p,x)]
        for x in bad:
            for y in valid:
                if set(x).issubset(set(y)):
                    self.assertTrue(m.is_dangerous(p,y),msg=(x,y))

    def test_10_minimal_dangerous_sets(self):
        self.assertEqual(len(m.minimal_dangerous_sets(self.panels())),10)

    def test_minimum_path_size_three(self):
        mins=m.minimal_dangerous_sets(self.panels())
        self.assertEqual(min(map(len,mins)),3)
        self.assertEqual(sum(len(x)==3 for x in mins),2)

    def test_mandatory_core_empty(self):
        mins=m.minimal_dangerous_sets(self.panels())
        core=set(mins[0])
        for x in mins[1:]:
            core &= set(x)
        self.assertEqual(core,set())

    def test_12_minimal_cuts(self):
        mins=m.minimal_dangerous_sets(self.panels())
        self.assertEqual(len(m.inclusion_minimal_hitting_sets(mins)),12)

    def test_unique_minimum_cut(self):
        cuts=m.inclusion_minimal_hitting_sets(m.minimal_dangerous_sets(self.panels()))
        self.assertEqual([c for c in cuts if len(c)==2],[("H_L:T","U_L:T")])

    def test_minimum_cut_operational_stats(self):
        x=m.cut_stats(self.panels(),("H_L:T","U_L:T"))
        self.assertTrue(x["all_safe"])
        self.assertEqual(x["permitted_profiles"],27)
        self.assertEqual(x["max_richness"],6)
        self.assertAlmostEqual(x["min_residual_privacy_bits"],0.4,places=12)

    def test_scalar_guaranteed_safe_cap_two(self):
        p=self.panels()
        rows=[m.evaluate(p,x) for x in m.all_profiles()]
        self.assertTrue(all(r["residual_privacy_bits"]>1e-12 for r in rows if r["richness"]<=2))
        self.assertTrue(any(abs(r["residual_privacy_bits"])<1e-12 for r in rows if r["richness"]==3))

    def test_structure_beats_scalar_cap(self):
        x=m.cut_stats(self.panels(),("H_L:T","U_L:T"))
        self.assertEqual(x["max_richness"],6)
        self.assertGreater(x["max_richness"],2)

    def test_utility_maximal_minimal_cut(self):
        p=self.panels()
        cuts=m.inclusion_minimal_hitting_sets(m.minimal_dangerous_sets(p))
        rows=[m.cut_stats(p,c) for c in cuts]
        maxr=max(x["max_richness"] for x in rows)
        best=[x for x in rows if x["max_richness"]==maxr]
        self.assertEqual(maxr,7)
        self.assertEqual(len(best),1)
        self.assertEqual(best[0]["cut"],["O_R:F","A_A:F","U_R:F"])
        self.assertAlmostEqual(best[0]["min_residual_privacy_bits"],0.2,places=12)

    def test_policy_frontier_coordinates(self):
        p=self.panels()
        mins=m.minimal_dangerous_sets(p)
        fr=m.policy_pareto([m.cut_stats(p,c) for c in m.all_hitting_sets(mins)])
        got=[(x["cost"],x["max_richness"],round(x["min_residual_privacy_bits"],12)) for x in fr]
        self.assertEqual(got,[
            (2,6,0.4),
            (3,7,0.2),
            (3,4,round(0.6754887502163468,12)),
            (5,3,0.8),
            (5,2,round(1.160964047443681,12)),
        ])

    def test_every_minimal_cut_blocks_all_danger(self):
        p=self.panels()
        cuts=m.inclusion_minimal_hitting_sets(m.minimal_dangerous_sets(p))
        self.assertTrue(all(m.cut_stats(p,c)["all_safe"] for c in cuts))

    def test_replay_exact(self):
        p=self.panels()
        a={"mins":m.minimal_dangerous_sets(p),"cuts":m.inclusion_minimal_hitting_sets(m.minimal_dangerous_sets(p))}
        b={"mins":m.minimal_dangerous_sets(p),"cuts":m.inclusion_minimal_hitting_sets(m.minimal_dangerous_sets(p))}
        self.assertEqual(m.canonical(a),m.canonical(b))

if __name__=="__main__":
    unittest.main()
