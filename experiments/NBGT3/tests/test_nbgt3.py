import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt3.py"
spec=importlib.util.spec_from_file_location("nbgt3",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)

class NBGT3Tests(unittest.TestCase):
    def fixture(self): return m.frozen_fixture()
    def result(self): return m.run_suite()

    def test_all_fourteen_checks_pass(self):
        r=self.result()
        self.assertEqual((r["checks_passed"],r["checks_total"],r["verdict"]),(14,14,"PASS_NBGT3"))

    def test_source_requires_explicit_independence_group(self):
        s={"source_id":"X","lineage_id":"L","locator":"synthetic://x","provenance":"TEST"}
        with self.assertRaises(ValueError): m.validate_source(s)

    def test_duplicate_copy_does_not_add_independence(self):
        r=self.result()["receipts"]["disputed_k1"]
        self.assertEqual(r["summary"]["independent_support_count"],1)
        self.assertEqual(r["summary"]["duplicate_evidence_ids"],["E1_SUPPORT_COPY"])

    def test_different_locator_does_not_create_independence(self):
        c,_,sources,evidence,decisions=self.fixture()
        r=m.reconcile(c,sources,evidence,decisions,world_cutoff=4,knowledge_cutoff=1)
        locators={x["source"]["locator"] for x in r["evidence_ledger"] if x["stance"]=="SUPPORT"}
        self.assertEqual(len(locators),2)
        self.assertEqual(r["summary"]["independent_support_count"],1)

    def test_support_and_opposition_coexist_as_disputed(self):
        r=self.result()["receipts"]["disputed_k2"]
        self.assertEqual(r["summary"]["status"],"DISPUTED")
        self.assertEqual((r["summary"]["independent_support_count"],r["summary"]["independent_oppose_count"]),(1,1))

    def test_majority_does_not_force_resolution(self):
        r=self.result()["receipts"]["disputed_k4"]
        self.assertEqual(r["summary"]["status"],"DISPUTED")
        self.assertEqual((r["summary"]["independent_support_count"],r["summary"]["independent_oppose_count"]),(2,1))

    def test_late_evidence_hidden_before_known_time(self):
        ids=[x["evidence_id"] for x in self.result()["receipts"]["disputed_k2"]["evidence_ledger"]]
        self.assertNotIn("E3_LATE_SUPPORT",ids)

    def test_late_evidence_visible_after_known_time(self):
        ids=[x["evidence_id"] for x in self.result()["receipts"]["disputed_k4"]["evidence_ledger"]]
        self.assertIn("E3_LATE_SUPPORT",ids)

    def test_provenance_is_preserved(self):
        r=self.result()["receipts"]["disputed_k4"]
        self.assertTrue(all(x["provenance"] and x["source"]["provenance"] for x in r["evidence_ledger"]))

    def test_summary_is_derived_view_not_replacement(self):
        r=self.result()["receipts"]["disputed_k4"]
        self.assertEqual((len(r["evidence_ledger"]),r["summary"]["evidence_record_count"]),(5,5))

    def test_opposition_alone_is_not_refutation(self):
        r=self.result()["receipts"]["refutable_k2"]
        self.assertEqual(r["summary"]["independent_oppose_count"],2)
        self.assertEqual(r["summary"]["status"],"DISPUTED")

    def test_explicit_refutation_decision_can_qualify(self):
        r=self.result()["receipts"]["refutable_k4"]
        self.assertTrue(r["summary"]["explicit_refutation_present"])
        self.assertEqual(r["summary"]["status"],"REFUTED")

    def test_counterfactual_source_removal_is_separate(self):
        a=self.result()["receipts"]["disputed_k4"]
        b=self.result()["receipts"]["counterfactual_without_S2"]
        self.assertEqual((a["mode"],a["summary"]["status"]),("OBSERVED","DISPUTED"))
        self.assertEqual((b["mode"],b["summary"]["status"]),("COUNTERFACTUAL","CORROBORATED"))

    def test_replay_and_order_are_exact(self):
        c,_,sources,evidence,decisions=self.fixture()
        a=m.reconcile(c,sources,evidence,decisions,world_cutoff=4,knowledge_cutoff=4)
        b=m.reconcile(c,list(reversed(sources)),list(reversed(evidence)),list(reversed(decisions)),world_cutoff=4,knowledge_cutoff=4)
        self.assertEqual(m.canonical(a),m.canonical(b))

if __name__=="__main__":
    unittest.main()
