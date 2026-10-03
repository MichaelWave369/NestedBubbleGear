import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah33.py"
spec=importlib.util.spec_from_file_location("ah33",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH33Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def test_10_panels(self):
        self.assertEqual(len(self.panels()),10)

    def test_243_designs(self):
        self.assertEqual(len(m.all_designs()),243)

    def test_negative_dependence_controls(self):
        p=self.panels()
        self.assertEqual(p["H_ANTI_ALL"]["lifetime"],"DEPENDENCE_OTHER_DIRECTION")
        self.assertEqual(p["H_ANTI_ALL"]["recent"],"DEPENDENCE_OTHER_DIRECTION")
        self.assertEqual(p["H_ANTI_ALL"]["adaptive"],"DEPENDENCE_OTHER_DIRECTION")

    def test_nested_partition_sizes(self):
        states=(
            "COMMON_MODE_EVIDENCE",
            "INSUFFICIENT_EVIDENCE",
            "INDEPENDENCE_COMPATIBLE",
            "DEPENDENCE_OTHER_DIRECTION",
        )
        self.assertEqual(len({m.transform(s,m.COMMON_ONLY) for s in states}),2)
        self.assertEqual(len({m.transform(s,m.TRIAGE) for s in states}),3)
        self.assertEqual(len({m.transform(s,m.FULL_STATUS) for s in states}),4)

    def test_target_entropy(self):
        p=self.panels()
        self.assertAlmostEqual(
            m.entropy([m.target_multi(x) for x in p.values()]),
            3.1219280948873624,
            places=12
        )

    def test_common_profile_counts(self):
        best,rows=m.synthesize_profile(self.panels(),m.COMMON_ONLY)
        self.assertEqual(len(rows),243)
        self.assertEqual(sum(r["coalition_safe"] for r in rows),106)
        self.assertEqual(tuple(best["modes"]),(m.COMMON_ONLY,)*5)

    def test_common_profile_frontier(self):
        p=self.panels()
        best,_=m.synthesize_profile(p,m.COMMON_ONLY)
        self.assertAlmostEqual(m.profile_task_entropy(p,m.COMMON_ONLY),1.9609640474436811,places=12)
        self.assertAlmostEqual(best["residual_entropy_bits"],1.160964047443681,places=12)

    def test_triage_profile_counts(self):
        best,rows=m.synthesize_profile(self.panels(),m.TRIAGE)
        self.assertEqual(len(rows),32)
        self.assertEqual(sum(r["coalition_safe"] for r in rows),4)
        self.assertEqual(tuple(best["modes"]),(m.TRIAGE,)*5)

    def test_triage_profile_frontier(self):
        p=self.panels()
        best,_=m.synthesize_profile(p,m.TRIAGE)
        self.assertAlmostEqual(m.profile_task_entropy(p,m.TRIAGE),2.721928094887362,places=12)
        self.assertAlmostEqual(best["residual_entropy_bits"],0.4,places=12)

    def test_full_profile_has_no_safe_design(self):
        best,rows=m.synthesize_profile(self.panels(),m.FULL_STATUS)
        self.assertEqual(len(rows),1)
        self.assertEqual(sum(r["coalition_safe"] for r in rows),0)
        self.assertAlmostEqual(best["residual_entropy_bits"],0.0,places=12)

    def test_information_accounting_all_profiles(self):
        p=self.panels()
        H=m.entropy([m.target_multi(x) for x in p.values()])
        for profile in m.MODES:
            best,_=m.synthesize_profile(p,profile)
            self.assertAlmostEqual(
                m.profile_task_entropy(p,profile)+best["residual_entropy_bits"],
                H,
                places=12,
            )

    def test_frontier_monotone(self):
        p=self.panels()
        task=[]; privacy=[]
        for profile in m.MODES:
            best,_=m.synthesize_profile(p,profile)
            task.append(m.profile_task_entropy(p,profile))
            privacy.append(best["residual_entropy_bits"])
        self.assertTrue(task[0]<task[1]<task[2])
        self.assertTrue(privacy[0]>privacy[1]>privacy[2])

    def test_triage_safe_structure(self):
        p=self.panels()
        _,rows=m.synthesize_profile(p,m.TRIAGE)
        safe=[r for r in rows if r["coalition_safe"]]
        self.assertEqual(len(safe),4)
        for r in safe:
            self.assertEqual(r["modes"][1],m.TRIAGE)
            self.assertEqual(r["modes"][2],m.TRIAGE)
            self.assertEqual(r["modes"][4],m.TRIAGE)

    def test_full_task_vector_determines_target(self):
        p=self.panels()
        task=[m.task_vector(x,m.FULL_STATUS) for x in p.values()]
        target=[m.target_multi(x) for x in p.values()]
        self.assertAlmostEqual(m.conditional_entropy(target,task),0.0,places=12)

    def test_receipt_replay_exact(self):
        p=self.panels()
        self.assertEqual(m.canonical(m.make_receipt(p)),m.canonical(m.make_receipt(p)))

if __name__=="__main__":
    unittest.main()
