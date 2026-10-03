import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"ah32.py"
spec=importlib.util.spec_from_file_location("ah32",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class AH32Tests(unittest.TestCase):
    def panels(self):
        return m.build_panels()

    def test_32_designs(self):
        self.assertEqual(len(m.all_designs()),32)

    def test_all_designs_preserve_frozen_tasks(self):
        p=self.panels()
        for modes in m.all_designs():
            self.assertTrue(m.evaluate_design(p,modes)["task_exact"],msg=modes)

    def test_raw_baseline_reconstructs_multi(self):
        r=m.evaluate_design(self.panels(),(m.RAW,)*5)
        self.assertAlmostEqual(r["residual_entropy_bits"],0.0,places=12)
        self.assertFalse(r["coalition_safe"])

    def test_exactly_8_safe_designs(self):
        p=self.panels()
        rows=[m.evaluate_design(p,x) for x in m.all_designs()]
        self.assertEqual(sum(r["coalition_safe"] for r in rows),8)

    def test_safe_iff_both_lifetime_carriers_coarsened(self):
        p=self.panels()
        for modes in m.all_designs():
            safe=m.evaluate_design(p,modes)["coalition_safe"]
            self.assertEqual(safe,modes[0]==m.RISK and modes[3]==m.RISK,msg=modes)

    def test_unique_minimum_safe_design(self):
        selected,rows=m.synthesize(self.panels())
        self.assertEqual(tuple(selected["modes"]),(m.RISK,m.RAW,m.RAW,m.RISK,m.RAW))
        self.assertEqual(selected["transformation_count"],2)
        self.assertEqual(sum(r["coalition_safe"] and r["transformation_count"]==2 for r in rows),1)

    def test_no_single_transform_is_safe(self):
        p=self.panels()
        for modes in m.all_designs():
            row=m.evaluate_design(p,modes)
            if row["transformation_count"]<=1:
                self.assertFalse(row["coalition_safe"])

    def test_selected_residual_entropy(self):
        selected,_=m.synthesize(self.panels())
        self.assertAlmostEqual(selected["residual_entropy_bits"],0.2857142857142857,places=12)

    def test_selected_has_five_descriptor_classes(self):
        selected,_=m.synthesize(self.panels())
        self.assertEqual(selected["pooled_descriptor_classes"],5)

    def test_C_F_witness(self):
        p=self.panels()
        modes=(m.RISK,m.RAW,m.RAW,m.RISK,m.RAW)
        self.assertEqual(m.grand_release(p["C"],modes),m.grand_release(p["F"],modes))
        self.assertNotEqual(m.target_multi(p["C"]),m.target_multi(p["F"]))

    def test_historian_task_sufficient(self):
        p=self.panels()
        modes=(m.RISK,m.RAW,m.RAW,m.RISK,m.RAW)
        tasks=[m.task_value("HISTORIAN",x) for x in p.values()]
        rel=[m.actor_release("HISTORIAN",x,modes) for x in p.values()]
        self.assertAlmostEqual(m.conditional_entropy(tasks,rel),0.0,places=12)

    def test_auditor_task_sufficient(self):
        p=self.panels()
        modes=(m.RISK,m.RAW,m.RAW,m.RISK,m.RAW)
        tasks=[m.task_value("AUDITOR",x) for x in p.values()]
        rel=[m.actor_release("AUDITOR",x,modes) for x in p.values()]
        self.assertAlmostEqual(m.conditional_entropy(tasks,rel),0.0,places=12)

    def test_lifetime_information_reduction(self):
        p=self.panels()
        life=[x["lifetime"] for x in p.values()]
        task=[m.common_bit(x) for x in life]
        self.assertAlmostEqual(m.entropy(life)-m.entropy(task),0.5156629249195443,places=12)

    def test_all_safe_designs_same_residual(self):
        p=self.panels()
        vals=[]
        for modes in m.all_designs():
            row=m.evaluate_design(p,modes)
            if row["coalition_safe"]:
                vals.append(row["residual_entropy_bits"])
        self.assertTrue(all(abs(v-0.2857142857142857)<1e-12 for v in vals))

    def test_receipt_replay_exact(self):
        p=self.panels()
        self.assertEqual(m.canonical(m.make_receipt(p)),m.canonical(m.make_receipt(p)))

if __name__=="__main__":
    unittest.main()
