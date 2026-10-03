import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah34.py"
spec=importlib.util.spec_from_file_location("ah34",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH34Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def rows(self):
        p=self.panels()
        return [m.evaluate(p,x) for x in m.all_profiles()]

    def test_243_profiles(self):
        self.assertEqual(len(m.all_profiles()),243)

    def test_privacy_counts(self):
        rows=self.rows()
        self.assertEqual(sum(r["residual_privacy_bits"]>1e-12 for r in rows),106)
        self.assertEqual(sum(abs(r["residual_privacy_bits"])<1e-12 for r in rows),137)

    def test_free_recent_triage_upgrade(self):
        p=self.panels()
        base=m.evaluate(p,(m.COMMON_ONLY,)*5)
        free=m.evaluate(p,(m.COMMON_ONLY,m.TRIAGE,m.COMMON_ONLY,m.COMMON_ONLY,m.TRIAGE))
        self.assertEqual(free["richness"],2)
        self.assertAlmostEqual(free["residual_privacy_bits"],base["residual_privacy_bits"],places=12)

    def test_no_single_upgrade_collapses_privacy(self):
        p=self.panels()
        base=[m.COMMON_ONLY]*5
        for i in range(5):
            for mode in (m.TRIAGE,m.FULL_STATUS):
                x=base.copy(); x[i]=mode
                self.assertGreater(m.evaluate(p,tuple(x))["residual_privacy_bits"],0.0)

    def test_minimum_collapse_richness(self):
        rows=self.rows()
        zero=[r for r in rows if abs(r["residual_privacy_bits"])<1e-12]
        self.assertEqual(min(r["richness"] for r in zero),3)

    def test_two_minimum_collapse_profiles(self):
        rows=self.rows()
        zero=[r for r in rows if abs(r["residual_privacy_bits"])<1e-12]
        z=sorted(
            (r["profile"] for r in zero if r["richness"]==3)
        )
        self.assertEqual(z,sorted([
            [m.COMMON_ONLY,m.COMMON_ONLY,m.FULL_STATUS,m.TRIAGE,m.COMMON_ONLY],
            [m.TRIAGE,m.COMMON_ONLY,m.FULL_STATUS,m.COMMON_ONLY,m.COMMON_ONLY],
        ]))

    def test_max_safe_richness(self):
        safe=[r for r in self.rows() if r["residual_privacy_bits"]>1e-12]
        self.assertEqual(max(r["richness"] for r in safe),7)

    def test_unique_score7_safe_profile(self):
        safe=[r for r in self.rows() if r["residual_privacy_bits"]>1e-12]
        x=[r for r in safe if r["richness"]==7]
        self.assertEqual(len(x),1)
        self.assertEqual(x[0]["profile"],[
            m.FULL_STATUS,m.TRIAGE,m.TRIAGE,m.FULL_STATUS,m.TRIAGE
        ])
        self.assertAlmostEqual(x[0]["residual_privacy_bits"],0.2,places=12)

    def test_all_score8_plus_collapse(self):
        for r in self.rows():
            if r["richness"]>=8:
                self.assertAlmostEqual(r["residual_privacy_bits"],0.0,places=12)

    def test_pareto_coordinates(self):
        fr=m.pareto(self.rows())
        got=[(r["richness"],round(r["residual_privacy_bits"],12)) for r in fr]
        self.assertEqual(got,[
            (2,round(1.160964047443681,12)),
            (3,0.8),
            (4,round(0.6754887502163468,12)),
            (4,round(0.6754887502163468,12)),
            (6,0.4),
            (6,0.4),
            (7,0.2),
            (10,0.0),
        ])

    def test_budget_0_4(self):
        feasible,best=m.optimize_floor(self.rows(),0.4)
        self.assertEqual(len(feasible),71)
        self.assertEqual(len(best),2)
        self.assertTrue(all(r["richness"]==6 for r in best))

    def test_budget_0_4_profiles(self):
        _,best=m.optimize_floor(self.rows(),0.4)
        self.assertEqual([r["profile"] for r in best],[
            [m.COMMON_ONLY,m.FULL_STATUS,m.FULL_STATUS,m.COMMON_ONLY,m.FULL_STATUS],
            [m.FULL_STATUS,m.TRIAGE,m.COMMON_ONLY,m.FULL_STATUS,m.TRIAGE],
        ])

    def test_budget_0_8(self):
        feasible,best=m.optimize_floor(self.rows(),0.8)
        self.assertEqual(len(feasible),8)
        self.assertEqual(len(best),1)
        self.assertEqual(best[0]["richness"],3)
        self.assertEqual(best[0]["profile"],[
            m.COMMON_ONLY,m.TRIAGE,m.TRIAGE,m.COMMON_ONLY,m.TRIAGE
        ])

    def test_spectrum(self):
        rows=self.rows()
        vals={}
        for r in rows:
            k=round(r["residual_privacy_bits"],12)
            vals[k]=vals.get(k,0)+1
        self.assertEqual(vals,{
            round(1.160964047443681,12):4,
            0.8:4,
            round(0.6754887502163468,12):17,
            0.4:46,
            0.2:35,
            0.0:137,
        })

    def test_receipt_replay_exact(self):
        p=self.panels()
        self.assertEqual(m.canonical(m.make_receipt(p)),m.canonical(m.make_receipt(p)))

if __name__=="__main__":
    unittest.main()
