import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt13.py"
spec=importlib.util.spec_from_file_location("nbgt13",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)


class NBGT13Tests(unittest.TestCase):
    def fixture(self):
        base,bundle,registry,records,ledger,*_=m.t12.frozen_fixture()
        receipts=m.make_intervention_receipts(ledger)
        return base,bundle,registry,records,ledger,receipts

    def atlas(self):
        base,bundle,registry,records,ledger,receipts=self.fixture()
        atlas=m.build_atlas(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        return base,bundle,registry,records,ledger,receipts,atlas

    def test_all_thirty_six_checks_pass(self):
        result=m.run_suite()[0]
        self.assertEqual((result["checks_passed"],result["checks_total"],result["verdict"]),(36,36,"PASS_NBGT13"))

    def test_nine_interventions(self):
        *_,receipts=self.fixture()
        self.assertEqual(len(receipts),9)

    def test_receipts_validate(self):
        *_,ledger,receipts=self.fixture()
        self.assertTrue(all(m.validate_intervention_receipt(r,ledger) for r in receipts))

    def test_receipt_tamper_fails(self):
        *_,ledger,receipts=self.fixture()
        bad=m.deepcopy(receipts[0]); bad["reason"]="tamper"
        with self.assertRaises(ValueError):
            m.validate_intervention_receipt(bad,ledger)

    def test_single_branch_validates(self):
        *_,ledger,receipts=self.fixture()
        branch=m.build_single_branch(ledger,receipts[0])
        self.assertTrue(m.validate_single_branch(branch,ledger,receipts[0]))

    def test_single_branch_tamper_fails(self):
        *_,ledger,receipts=self.fixture()
        branch=m.build_single_branch(ledger,receipts[0]); branch["branch_id"]="BAD"
        with self.assertRaises(ValueError):
            m.validate_single_branch(branch,ledger,receipts[0])

    def test_observed_ledger_immutable(self):
        *_,ledger,receipts=self.fixture()
        before=m.canonical(ledger)
        for receipt in receipts:
            m.build_single_branch(ledger,receipt)
        self.assertEqual(before,m.canonical(ledger))

    def test_atlas_validates(self):
        *_,ledger,receipts,atlas=self.atlas()
        self.assertTrue(m.validate_atlas(atlas,ledger))

    def test_atlas_tamper_fails(self):
        *_,ledger,receipts,atlas=self.atlas()
        bad=m.deepcopy(atlas); bad["rows"][0]["target_class"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_atlas(bad,ledger)

    def test_atlas_rows_canonical(self):
        *_,atlas=self.atlas()
        ids=[r["intervention_id"] for r in atlas["rows"]]
        self.assertEqual(ids,sorted(ids))

    def test_remove_deactivate_changes_target_outcome(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_REMOVE_DEACTIVATE")
        self.assertEqual(row["target_class"],"OUTCOME_CHANGING")
        self.assertEqual(row["counterfactual_outcome"],"REJECTED")

    def test_delay_deactivate_changes_target_outcome(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_DELAY_DEACTIVATE_11")
        self.assertEqual(row["target_class"],"OUTCOME_CHANGING")

    def test_remove_register_normal2_changes_target_outcome(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_REMOVE_REGISTER_NORMAL2")
        self.assertEqual(row["target_class"],"OUTCOME_CHANGING")

    def test_delay_register_normal2_changes_target_outcome(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_DELAY_REGISTER_NORMAL2_11")
        self.assertEqual(row["target_class"],"OUTCOME_CHANGING")

    def test_alter_valid10_target_inert(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_ALTER_DEACTIVATE_VALID10")
        self.assertEqual(row["target_class"],"TARGET_INERT")

    def test_alter_valid10_has_temporal_outcome_leverage(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_ALTER_DEACTIVATE_VALID10")
        self.assertEqual(row["temporal_class"],"TEMPORAL_OUTCOME_LEVERAGE")

    def test_alter_valid10_first_outcome_divergence_k9_t9(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_ALTER_DEACTIVATE_VALID10")
        self.assertEqual((row["first_outcome_divergence"]["known_cutoff"],row["first_outcome_divergence"]["valid_time"]),(9,9))

    def test_delay_activate_target_inert(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_DELAY_ACTIVATE_EMERGENCY_7")
        self.assertEqual(row["target_class"],"TARGET_INERT")

    def test_delay_activate_policy_leverage_only(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_DELAY_ACTIVATE_EMERGENCY_7")
        self.assertEqual(row["temporal_class"],"TEMPORAL_POLICY_LEVERAGE")
        self.assertIsNone(row["first_outcome_divergence"])

    def test_payload_negative_control_is_ledger_only(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_ALTER_DEACTIVATE_PAYLOAD_ONLY")
        self.assertEqual((row["target_class"],row["temporal_class"]),("TARGET_INERT","LEDGER_ONLY_INERT"))

    def test_payload_negative_control_changes_branch_hash(self):
        *_,ledger,receipts,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_ALTER_DEACTIVATE_PAYLOAD_ONLY")
        self.assertNotEqual(row["branch_ledger_head"],m.t11.validate_policy_ledger(ledger))

    def test_remove_supersede_is_ledger_only(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_REMOVE_SUPERSEDE_NORMAL1")
        self.assertEqual((row["target_class"],row["temporal_class"]),("TARGET_INERT","LEDGER_ONLY_INERT"))

    def test_first_policy_divergence_exists_for_delay_activate(self):
        *_,atlas=self.atlas()
        row=next(r for r in atlas["rows"] if r["intervention_id"]=="I_DELAY_ACTIVATE_EMERGENCY_7")
        self.assertIsNotNone(row["first_policy_divergence"])

    def test_rows_have_no_causal_attribution_marker(self):
        *_,atlas=self.atlas()
        self.assertTrue(all(r["causal_claim"]=="NONE_SENSITIVITY_IS_NOT_CAUSAL_ATTRIBUTION" for r in atlas["rows"]))

    def test_atlas_truth_boundary(self):
        *_,atlas=self.atlas()
        self.assertEqual(atlas["truth_claim"],m.BOUNDARY)

    def test_empty_intervention_set_refused(self):
        *_,ledger,receipts=self.fixture()
        with self.assertRaises(ValueError):
            m.apply_intervention_set(ledger,[])

    def test_duplicate_intervention_refused(self):
        *_,ledger,receipts=self.fixture()
        with self.assertRaises(ValueError):
            m.apply_intervention_set(ledger,[receipts[0],receipts[0]])

    def test_same_target_pair_refused(self):
        *_,ledger,receipts=self.fixture()
        same=[r for r in receipts if r["target_event_id"]=="EV_DEACTIVATE_EMERGENCY"][:2]
        with self.assertRaises(ValueError):
            m.apply_intervention_set(ledger,same)

    def test_multi_intervention_branch_validates(self):
        *_,ledger,receipts=self.fixture()
        combo=[
            next(r for r in receipts if r["intervention_id"]=="I_DELAY_ACTIVATE_EMERGENCY_7"),
            next(r for r in receipts if r["intervention_id"]=="I_REMOVE_SUPERSEDE_NORMAL1"),
        ]
        branch=m.apply_intervention_set(ledger,combo)
        self.assertTrue(m.validate_intervention_set_branch(branch,ledger))

    def test_multi_intervention_branch_tamper_fails(self):
        *_,ledger,receipts=self.fixture()
        combo=[
            next(r for r in receipts if r["intervention_id"]=="I_DELAY_ACTIVATE_EMERGENCY_7"),
            next(r for r in receipts if r["intervention_id"]=="I_REMOVE_SUPERSEDE_NORMAL1"),
        ]
        branch=m.apply_intervention_set(ledger,combo); branch["branch_kind"]="BAD"
        with self.assertRaises(ValueError):
            m.validate_intervention_set_branch(branch,ledger)

    def test_minimal_sets_cardinality_one(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        result=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        self.assertEqual(result["minimal_cardinality"],1)

    def test_minimal_sets_have_four_singletons(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        result=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        self.assertEqual(len(result["sets"]),4)

    def test_minimal_sets_expected_ids(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        result=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        got={row["intervention_ids"][0] for row in result["sets"]}
        want={"I_DELAY_DEACTIVATE_11","I_DELAY_REGISTER_NORMAL2_11","I_REMOVE_DEACTIVATE","I_REMOVE_REGISTER_NORMAL2"}
        self.assertEqual(got,want)

    def test_minimal_sets_causal_boundary(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        result=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        self.assertEqual(result["causal_claim"],"NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE")

    def test_unreachable_outcome_returns_none(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        result=m.minimal_intervention_sets(receipts=receipts,desired_outcome="ACCEPTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,max_size=1)
        self.assertIsNone(result["minimal_cardinality"])
        self.assertEqual(result["sets"],[])

    def test_source_status_stays_alleged(self):
        base,*_=self.fixture()
        self.assertEqual(base["source_status"],"ALLEGED")

    def test_atlas_replay_deterministic(self):
        _,bundle,registry,records,ledger,_=self.fixture()
        a=m.build_atlas(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        b=m.build_atlas(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_minimal_replay_deterministic(self):
        _,bundle,registry,records,ledger,receipts=self.fixture()
        a=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        b=m.minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger)
        self.assertEqual(m.canonical(a),m.canonical(b))


if __name__=="__main__":
    unittest.main()
