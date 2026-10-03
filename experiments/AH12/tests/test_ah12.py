import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah12.py"
spec=importlib.util.spec_from_file_location("ah12",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH12Tests(unittest.TestCase):
    def cases(self):
        return [
            m.make_case(un,U,vn,V,k)
            for un,U in m.BASE.items()
            for vn,V in m.BASE.items()
            for k in m.K_VALUES
        ]

    def test_48_histories(self):
        self.assertEqual(len(self.cases()),48)

    def test_global_task_prefers_residue_candidate(self):
        r=m.report(self.cases(),"G","residue")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["descriptor_classes"],13)

    def test_H2_task_prefers_H2_candidate(self):
        r=m.report(self.cases(),"H2","H2")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["descriptor_classes"],3)

    def test_H3_task_prefers_H3_candidate(self):
        r=m.report(self.cases(),"H3","H3")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["descriptor_classes"],9)

    def test_P2_task_prefers_cumulative_candidate(self):
        r=m.report(self.cases(),"P2","cumulative")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["descriptor_classes"],13)

    def test_broad_task_prefers_action_candidate(self):
        r=m.report(self.cases(),"ALL","action")
        self.assertTrue(r["sufficient"])
        self.assertEqual(r["descriptor_classes"],15)

    def test_AH11_residue_fails_H2_task(self):
        r=m.report(self.cases(),"H2","residue")
        self.assertFalse(r["sufficient"])
        self.assertAlmostEqual(r["conditional_entropy_bits"],0.25,places=12)

    def test_AH11_residue_fails_P2_task(self):
        r=m.report(self.cases(),"P2","residue")
        self.assertFalse(r["sufficient"])
        self.assertAlmostEqual(r["conditional_entropy_bits"],0.25,places=12)

    def test_cumulative_fails_global_task(self):
        r=m.report(self.cases(),"G","cumulative")
        self.assertFalse(r["sufficient"])
        self.assertAlmostEqual(r["conditional_entropy_bits"],0.25,places=12)

    def test_same_residue_can_hide_other_query_answers(self):
        cs=self.cases()
        a=next(c for c in cs if c["label"]==("I","A",-1))
        b=next(c for c in cs if c["label"]==("S","S",-1))
        self.assertEqual(a["R"],b["R"])
        self.assertEqual(a["G"],b["G"])
        self.assertNotEqual(a["H2"],b["H2"])
        self.assertNotEqual(a["P2"],b["P2"])

    def test_same_cumulative_can_hide_global_answer(self):
        cs=self.cases()
        a=next(c for c in cs if c["label"]==("I","A",0))
        b=next(c for c in cs if c["label"]==("A","I",0))
        self.assertEqual(a["P2"],b["P2"])
        self.assertNotEqual(a["G"],b["G"])

    def test_broad_query_refines_global_memory(self):
        g=m.report(self.cases(),"G","residue")
        broad=m.report(self.cases(),"ALL","action")
        self.assertEqual(g["descriptor_classes"],13)
        self.assertEqual(broad["descriptor_classes"],15)
        self.assertGreater(broad["descriptor_entropy_bits"],g["descriptor_entropy_bits"])

    def test_action_answers_all_singleton_tasks(self):
        for task in ("G","H2","H3","P2","ALL"):
            self.assertTrue(m.report(self.cases(),task,"action")["sufficient"])

if __name__=="__main__":
    unittest.main()
