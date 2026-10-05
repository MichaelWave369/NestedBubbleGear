import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt14.py"
spec=importlib.util.spec_from_file_location("nbgt14",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)


class NBGT14Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base,cls.bundle,cls.registry,cls.records,cls.ledger,cls.receipts,cls.by_id,cls.branches=m.frozen_context()
        cls.atlas,cls.table=m.build_equivalence_atlas(
            bundle=cls.bundle,
            reviewer_registry=cls.registry,
            policy_records=cls.records,
            branches=cls.branches,
        )

    def pair(self,a,b):
        return m.find_pair(self.atlas,a,b)

    def test_all_thirty_four_checks_pass(self):
        result=m.run_suite()[0]
        self.assertEqual((result["checks_passed"],result["checks_total"],result["verdict"]),(34,34,"PASS_NBGT14"))

    def test_nine_interventions(self):
        self.assertEqual(self.atlas["counts"]["interventions"],9)

    def test_thirty_six_pairs(self):
        self.assertEqual(self.atlas["counts"]["pairs"],36)

    def test_atlas_validates(self):
        self.assertTrue(m.validate_equivalence_atlas(self.atlas,self.table))

    def test_atlas_tamper_fails(self):
        bad=m.deepcopy(self.atlas); bad["counts"]["pairs"]=35
        with self.assertRaises(ValueError):
            m.validate_equivalence_atlas(bad,self.table)

    def test_pair_receipt_validates(self):
        p=self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")
        self.assertTrue(m.validate_pair_receipt(p,self.table))

    def test_pair_receipt_tamper_fails(self):
        p=m.deepcopy(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11"))
        p["classification"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_pair_receipt(p,self.table)

    def test_pair_refuses_same_intervention(self):
        with self.assertRaises(ValueError):
            m.pair_receipt("I_REMOVE_DEACTIVATE","I_REMOVE_DEACTIVATE",self.table)

    def test_pair_refuses_unknown(self):
        with self.assertRaises(ValueError):
            m.pair_receipt("I_REMOVE_DEACTIVATE","UNKNOWN",self.table)

    def test_deactivation_pair_target_equivalent(self):
        self.assertTrue(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["target_equivalent"])

    def test_deactivation_pair_temporally_distinct(self):
        self.assertFalse(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["temporal_equivalent"])

    def test_deactivation_pair_classification(self):
        self.assertEqual(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["classification"],"KEYHOLE_EQUIVALENT_TEMPORALLY_DISTINCT")

    def test_deactivation_pair_has_residue(self):
        self.assertGreater(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["residue_count"],0)

    def test_deactivation_separator_singleton(self):
        self.assertEqual(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["minimal_separator_cardinality"],1)

    def test_deactivation_separator_exists(self):
        self.assertIsNotNone(self.pair("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11")["first_separating_keyhole"])

    def test_normal2_pair_target_equivalent(self):
        self.assertTrue(self.pair("I_REMOVE_REGISTER_NORMAL2","I_DELAY_REGISTER_NORMAL2_11")["target_equivalent"])

    def test_normal2_pair_temporally_distinct(self):
        self.assertFalse(self.pair("I_REMOVE_REGISTER_NORMAL2","I_DELAY_REGISTER_NORMAL2_11")["temporal_equivalent"])

    def test_normal2_pair_separator_singleton(self):
        self.assertEqual(self.pair("I_REMOVE_REGISTER_NORMAL2","I_DELAY_REGISTER_NORMAL2_11")["minimal_separator_cardinality"],1)

    def test_ledger_controls_target_equivalent(self):
        self.assertTrue(self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")["target_equivalent"])

    def test_ledger_controls_temporally_equivalent(self):
        self.assertTrue(self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")["temporal_equivalent"])

    def test_ledger_controls_classification(self):
        self.assertEqual(self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")["classification"],"TEMPORALLY_EQUIVALENT_IN_QUERY_FAMILY")

    def test_ledger_controls_have_zero_residue(self):
        self.assertEqual(self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")["residue_count"],0)

    def test_ledger_controls_have_no_separator(self):
        p=self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")
        self.assertIsNone(p["first_separating_keyhole"])
        self.assertEqual(p["minimal_separator_cardinality"],0)

    def test_ledger_controls_different_heads(self):
        p=self.pair("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1")
        self.assertNotEqual(p["left_branch_ledger_head"],p["right_branch_ledger_head"])

    def test_alter_vs_payload_target_equivalent(self):
        self.assertTrue(self.pair("I_ALTER_DEACTIVATE_VALID10","I_ALTER_DEACTIVATE_PAYLOAD_ONLY")["target_equivalent"])

    def test_alter_vs_payload_temporally_distinct(self):
        self.assertFalse(self.pair("I_ALTER_DEACTIVATE_VALID10","I_ALTER_DEACTIVATE_PAYLOAD_ONLY")["temporal_equivalent"])

    def test_target_equivalence_classes_cover_all(self):
        ids=[iid for row in self.atlas["target_equivalence_classes"] for iid in row["intervention_ids"]]
        self.assertEqual(sorted(ids),sorted(self.table))

    def test_temporal_equivalence_classes_cover_all(self):
        ids=[iid for row in self.atlas["temporal_equivalence_classes"] for iid in row["intervention_ids"]]
        self.assertEqual(sorted(ids),sorted(self.table))

    def test_multi_temporal_class_exists(self):
        self.assertTrue(any(len(row["intervention_ids"])>1 for row in self.atlas["temporal_equivalence_classes"]))

    def test_all_pair_ids_canonical(self):
        self.assertTrue(all(p["left_intervention_id"]<p["right_intervention_id"] for p in self.atlas["pair_receipts"]))

    def test_all_pair_receipts_have_boundary(self):
        self.assertTrue(all(p["truth_claim"]==m.BOUNDARY for p in self.atlas["pair_receipts"]))

    def test_all_pair_receipts_refuse_causal_identity(self):
        self.assertTrue(all(p["causal_claim"]=="NONE_EQUIVALENCE_CLASS_IS_NOT_CAUSAL_IDENTITY" for p in self.atlas["pair_receipts"]))

    def test_all_separator_cardinalities_are_zero_or_one(self):
        self.assertTrue(all(p["minimal_separator_cardinality"] in (0,1) for p in self.atlas["pair_receipts"]))

    def test_all_residue_hashes_are_sha256(self):
        self.assertTrue(all(len(p["governance_residue_hash"])==64 for p in self.atlas["pair_receipts"]))

    def test_source_status_stays_alleged(self):
        self.assertEqual(self.base["source_status"],"ALLEGED")

    def test_observed_ledger_unchanged(self):
        before=m.canonical(self.ledger)
        _=m.build_equivalence_atlas(bundle=self.bundle,reviewer_registry=self.registry,policy_records=self.records,branches=self.branches)
        self.assertEqual(before,m.canonical(self.ledger))

    def test_atlas_replay_deterministic(self):
        a=m.build_equivalence_atlas(bundle=self.bundle,reviewer_registry=self.registry,policy_records=self.records,branches=self.branches)[0]
        b=m.build_equivalence_atlas(bundle=self.bundle,reviewer_registry=self.registry,policy_records=self.records,branches=self.branches)[0]
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_pair_replay_deterministic(self):
        a=m.pair_receipt("I_REMOVE_DEACTIVATE","I_DELAY_DEACTIVATE_11",self.table)
        b=m.pair_receipt("I_DELAY_DEACTIVATE_11","I_REMOVE_DEACTIVATE",self.table)
        self.assertEqual(m.canonical(a),m.canonical(b))


if __name__=="__main__":
    unittest.main()
