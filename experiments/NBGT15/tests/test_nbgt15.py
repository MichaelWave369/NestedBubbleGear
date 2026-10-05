import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt15.py"
spec=importlib.util.spec_from_file_location("nbgt15",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)


class NBGT15Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context=m.frozen_context()
        cls.static_joint=m.synthesize_static_observer(
            context=cls.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        cls.static_policy_pair=m.synthesize_static_observer(
            context=cls.context,
            family_ids=m.RESTRICTED_WITNESS_IDS,
            channel="POLICY",
        )
        cls.static_outcome_pair=m.synthesize_static_observer(
            context=cls.context,
            family_ids=m.RESTRICTED_WITNESS_IDS,
            channel="OUTCOME",
        )
        cls.static_full9=m.synthesize_static_observer(
            context=cls.context,
            family_ids=m.FULL_FAMILY_IDS,
            channel="JOINT",
        )
        cls.adaptive8=m.synthesize_adaptive_observer(
            context=cls.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        cls.adaptive9=m.synthesize_adaptive_observer(
            context=cls.context,
            family_ids=m.FULL_FAMILY_IDS,
            channel="JOINT",
        )

    def test_run_suite_passes(self):
        result=m.run_suite()[0]
        self.assertEqual(result["verdict"],"PASS_NBGT15")
        self.assertEqual(result["checks_passed"],result["checks_total"])

    def test_three_channels(self):
        self.assertEqual(m.CHANNELS,("POLICY","OUTCOME","JOINT"))

    def test_144_admissible_keyholes(self):
        self.assertEqual(len(m.admissible_keyholes()),144)

    def test_observer_cost_is_deterministic(self):
        self.assertEqual(m.observer_cost(3,7),10)

    def test_keyhole_id(self):
        self.assertEqual(m.keyhole_id(11,9),"k11_t9")

    def test_invalid_channel_refused(self):
        with self.assertRaises(ValueError):
            m.validate_channel("MAGIC")

    def test_empty_family_refused(self):
        with self.assertRaises(ValueError):
            m.canonical_family([],self.context)

    def test_duplicate_family_refused(self):
        with self.assertRaises(ValueError):
            m.canonical_family(["I_REMOVE_DEACTIVATE","I_REMOVE_DEACTIVATE"],self.context)

    def test_unknown_intervention_refused(self):
        with self.assertRaises(ValueError):
            m.canonical_family(["UNKNOWN"],self.context)

    def test_full_family_has_nine(self):
        self.assertEqual(len(m.FULL_FAMILY_IDS),9)

    def test_distinguishable_family_has_eight(self):
        self.assertEqual(len(m.DISTINGUISHABLE_EIGHT_IDS),8)

    def test_static_joint_passes(self):
        self.assertEqual(self.static_joint["status"],"PASS")

    def test_static_joint_positive_cardinality(self):
        self.assertGreater(self.static_joint["minimal_cardinality"],0)

    def test_static_joint_selected_count_matches(self):
        self.assertEqual(len(self.static_joint["selected_keyholes"]),self.static_joint["minimal_cardinality"])

    def test_static_joint_no_unseparable_pairs(self):
        self.assertEqual(self.static_joint["unseparable_pairs"],[])

    def test_static_joint_receipt_validates(self):
        self.assertTrue(m.validate_static_receipt(self.static_joint,self.context))

    def test_static_joint_tamper_fails(self):
        bad=m.deepcopy(self.static_joint)
        bad["total_observer_cost"]+=1
        with self.assertRaises(ValueError):
            m.validate_static_receipt(bad,self.context)

    def test_policy_pair_passes(self):
        self.assertEqual(self.static_policy_pair["status"],"PASS")

    def test_policy_pair_requires_one_keyhole(self):
        self.assertEqual(self.static_policy_pair["minimal_cardinality"],1)

    def test_policy_pair_receipt_validates(self):
        self.assertTrue(m.validate_static_receipt(self.static_policy_pair,self.context))

    def test_outcome_pair_refuses(self):
        self.assertEqual(self.static_outcome_pair["status"],"REFUSE_UNSEPARABLE")

    def test_outcome_pair_reports_exact_pair(self):
        self.assertEqual(
            self.static_outcome_pair["unseparable_pairs"],
            [list(sorted(m.RESTRICTED_WITNESS_IDS))],
        )

    def test_outcome_pair_selects_nothing(self):
        self.assertEqual(self.static_outcome_pair["selected_keyholes"],[])

    def test_outcome_pair_receipt_validates(self):
        self.assertTrue(m.validate_static_receipt(self.static_outcome_pair,self.context))

    def test_full9_joint_refuses(self):
        self.assertEqual(self.static_full9["status"],"REFUSE_UNSEPARABLE")

    def test_full9_contains_known_equivalent_pair(self):
        pairs={tuple(row) for row in self.static_full9["unseparable_pairs"]}
        self.assertIn(
            tuple(sorted(("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1"))),
            pairs,
        )

    def test_full9_selects_nothing(self):
        self.assertEqual(self.static_full9["selected_keyholes"],[])

    def test_full9_receipt_validates(self):
        self.assertTrue(m.validate_static_receipt(self.static_full9,self.context))

    def test_partition_is_complete(self):
        part=m.partition_family(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            keyhole={"keyhole_id":"k10_t10","known_cutoff":10,"valid_time":10,"observer_cost":20},
            channel="JOINT",
        )
        ids=sorted(i for group in part for i in group["intervention_ids"])
        self.assertEqual(ids,sorted(m.DISTINGUISHABLE_EIGHT_IDS))

    def test_split_score_nonnegative(self):
        part=m.partition_family(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            keyhole={"keyhole_id":"k10_t10","known_cutoff":10,"valid_time":10,"observer_cost":20},
            channel="JOINT",
        )
        self.assertGreaterEqual(m.split_score(part),0)

    def test_choose_next_keyhole_returns_receipt(self):
        row=m.choose_next_keyhole(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        self.assertIsNotNone(row)
        self.assertIn("query_selection_hash",row)

    def test_query_selection_receipt_validates(self):
        row=m.choose_next_keyhole(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        self.assertTrue(m.validate_query_selection_receipt(row,self.context))

    def test_query_selection_tamper_fails(self):
        row=m.choose_next_keyhole(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        row=m.deepcopy(row)
        row["split_score"]+=1
        with self.assertRaises(ValueError):
            m.validate_query_selection_receipt(row,self.context)

    def test_adaptive8_passes(self):
        self.assertEqual(self.adaptive8["status"],"PASS")

    def test_adaptive8_resolves_all_eight(self):
        self.assertEqual(self.adaptive8["stats"]["resolved_leaf_count"],8)
        self.assertEqual(self.adaptive8["stats"]["unresolved_leaf_count"],0)

    def test_adaptive8_has_positive_depth(self):
        self.assertGreater(self.adaptive8["stats"]["worst_case_depth"],0)

    def test_adaptive8_query_receipts_match_nodes(self):
        self.assertEqual(
            len(self.adaptive8["query_selection_receipts"]),
            self.adaptive8["stats"]["query_node_count"],
        )

    def test_adaptive8_receipt_validates(self):
        self.assertTrue(m.validate_adaptive_receipt(self.adaptive8,self.context))

    def test_adaptive8_tamper_fails(self):
        bad=m.deepcopy(self.adaptive8)
        bad["status"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_adaptive_receipt(bad,self.context)

    def test_adaptive9_refuses(self):
        self.assertEqual(self.adaptive9["status"],"REFUSE_UNSEPARABLE")

    def test_adaptive9_has_unresolved_leaf(self):
        self.assertGreaterEqual(self.adaptive9["stats"]["unresolved_leaf_count"],1)

    def test_adaptive9_preserves_known_equivalent_pair(self):
        leaves=m._unresolved_leaf_sets(self.adaptive9["tree"])
        want=set(("I_ALTER_DEACTIVATE_PAYLOAD_ONLY","I_REMOVE_SUPERSEDE_NORMAL1"))
        self.assertTrue(any(row==want for row in leaves))

    def test_adaptive9_receipt_validates(self):
        self.assertTrue(m.validate_adaptive_receipt(self.adaptive9,self.context))

    def test_static_adaptive_comparison_hashes(self):
        row=m.compare_static_adaptive(self.static_joint,self.adaptive8)
        self.assertEqual(len(row["comparison_hash"]),64)

    def test_static_replay_deterministic(self):
        replay=m.synthesize_static_observer(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        self.assertEqual(m.canonical(replay),m.canonical(self.static_joint))

    def test_adaptive_replay_deterministic(self):
        replay=m.synthesize_adaptive_observer(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        self.assertEqual(m.canonical(replay),m.canonical(self.adaptive8))

    def test_source_status_remains_alleged(self):
        self.assertEqual(self.context["base_claim"]["source_status"],"ALLEGED")

    def test_observed_ledger_unchanged(self):
        before=m.canonical(self.context["observed_ledger"])
        _=m.synthesize_adaptive_observer(
            context=self.context,
            family_ids=m.DISTINGUISHABLE_EIGHT_IDS,
            channel="JOINT",
        )
        self.assertEqual(before,m.canonical(self.context["observed_ledger"]))


if __name__=="__main__":
    unittest.main()
