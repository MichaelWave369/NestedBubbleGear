import importlib.util, sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"m3_mutate.py"
spec=importlib.util.spec_from_file_location("m3_mutate",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class M3Tests(unittest.TestCase):
    def result(self):
        return m.run_mutation_suite()

    def test_exactly_twelve_mutants(self):
        self.assertEqual(self.result()["mutants_total"],12)

    def test_all_mutants_killed(self):
        r=self.result()
        self.assertEqual(r["mutants_killed"],12)
        self.assertEqual(r["mutants_survived"],0)
        self.assertEqual(r["mutation_score"],1.0)

    def test_ids_unique_and_exact(self):
        ids=[x["mutant_id"] for x in self.result()["records"]]
        self.assertEqual(ids,[f"M{i:02d}" for i in range(1,13)])
        self.assertEqual(len(set(ids)),12)

    def test_every_kill_has_witness(self):
        self.assertTrue(all(x["killed"] and x["witness"] is not None for x in self.result()["records"]))

    def test_cut_mutants_killed(self):
        d={x["mutant_id"]:x for x in self.result()["records"]}
        self.assertTrue(d["M01"]["killed"])
        self.assertTrue(d["M02"]["killed"])

    def test_certification_mutants_killed(self):
        d={x["mutant_id"]:x for x in self.result()["records"]}
        self.assertTrue(d["M05"]["killed"])
        self.assertTrue(d["M06"]["killed"])

    def test_event_mutants_killed(self):
        d={x["mutant_id"]:x for x in self.result()["records"]}
        self.assertTrue(d["M07"]["killed"])
        self.assertTrue(d["M08"]["killed"])

    def test_information_mutants_killed(self):
        d={x["mutant_id"]:x for x in self.result()["records"]}
        self.assertTrue(d["M09"]["killed"])
        self.assertTrue(d["M10"]["killed"])

    def test_governance_mutants_killed(self):
        d={x["mutant_id"]:x for x in self.result()["records"]}
        self.assertTrue(d["M11"]["killed"])
        self.assertTrue(d["M12"]["killed"])

    def test_replay_exact(self):
        self.assertEqual(m.canonical(m.run_mutation_suite()),m.canonical(m.run_mutation_suite()))

if __name__=="__main__":
    unittest.main()
