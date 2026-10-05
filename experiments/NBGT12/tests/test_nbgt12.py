import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt12.py"
spec=importlib.util.spec_from_file_location("nbgt12",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)


class NBGT12Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def branches(self):
        claim,bundle,registry,records,ledger,remove_fork,delay_fork,alter_fork=self.fixture()
        return (
            claim,bundle,registry,records,ledger,
            remove_fork,m.apply_counterfactual_branch(ledger,remove_fork),
            delay_fork,m.apply_counterfactual_branch(ledger,delay_fork),
            alter_fork,m.apply_counterfactual_branch(ledger,alter_fork),
        )

    def test_all_thirty_two_checks_pass(self):
        r=m.run_suite()[0]
        self.assertEqual((r["checks_passed"],r["checks_total"],r["verdict"]),(32,32,"PASS_NBGT12"))

    def test_observed_ledger_unchanged_by_branch(self):
        *_,ledger,remove_fork,_,_=self.fixture()
        before=m.canonical(ledger)
        m.apply_counterfactual_branch(ledger,remove_fork)
        self.assertEqual(before,m.canonical(ledger))

    def test_remove_fork_validates(self):
        *_,ledger,remove_fork,_,_=self.fixture()
        self.assertTrue(m.validate_fork_receipt(remove_fork,ledger))

    def test_delay_fork_validates(self):
        *_,ledger,_,delay_fork,_=self.fixture()
        self.assertTrue(m.validate_fork_receipt(delay_fork,ledger))

    def test_alter_fork_validates(self):
        *_,ledger,_,_,alter_fork=self.fixture()
        self.assertTrue(m.validate_fork_receipt(alter_fork,ledger))

    def test_fork_tamper_fails(self):
        *_,ledger,remove_fork,_,_=self.fixture()
        bad=m.deepcopy(remove_fork); bad["reason"]="tampered"
        with self.assertRaises(ValueError):
            m.validate_fork_receipt(bad,ledger)

    def test_unknown_target_refused(self):
        *_,ledger,_,_,_=self.fixture()
        with self.assertRaises(ValueError):
            m.make_fork_receipt(branch_id="X",observed_ledger=ledger,operation="REMOVE_EVENT",target_event_id="NOPE",reason="x")

    def test_remove_patch_refused(self):
        *_,ledger,_,_,_=self.fixture()
        with self.assertRaises(ValueError):
            m.make_fork_receipt(branch_id="X",observed_ledger=ledger,operation="REMOVE_EVENT",target_event_id="EV_DEACTIVATE_EMERGENCY",patch={"valid_time":10},reason="x")

    def test_delay_cannot_move_earlier(self):
        *_,ledger,_,_,_=self.fixture()
        with self.assertRaises(ValueError):
            m.make_fork_receipt(branch_id="X",observed_ledger=ledger,operation="DELAY_EVENT",target_event_id="EV_DEACTIVATE_EMERGENCY",patch={"known_time":8},reason="x")

    def test_identity_patch_refused(self):
        *_,ledger,_,_,_=self.fixture()
        with self.assertRaises(ValueError):
            m.make_fork_receipt(branch_id="X",observed_ledger=ledger,operation="ALTER_EVENT",target_event_id="EV_DEACTIVATE_EMERGENCY",patch={"event_type":"REGISTER_POLICY"},reason="x")

    def test_remove_branch_has_five_events(self):
        *_,remove_fork,remove_branch,_,_,_,_=self.branches()
        self.assertEqual(len(remove_branch["branch_ledger"]),5)

    def test_delay_branch_has_six_events(self):
        *_,delay_fork,delay_branch,_,_=self.branches()
        self.assertEqual(len(delay_branch["branch_ledger"]),6)

    def test_alter_branch_has_six_events(self):
        *_,alter_fork,alter_branch=self.branches()
        self.assertEqual(len(alter_branch["branch_ledger"]),6)

    def test_branch_hash_validates(self):
        *_,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        self.assertTrue(m.validate_counterfactual_branch(remove_branch,ledger,remove_fork))

    def test_branch_tamper_fails(self):
        *_,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        bad=m.deepcopy(remove_branch); bad["branch_id"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_counterfactual_branch(bad,ledger,remove_fork)

    def test_observed_k10_is_abstain_conflict(self):
        _,bundle,registry,records,ledger,*_=self.fixture()
        r=m.resolve_observed(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["t10_resolution_receipt"]["governance_outcome"],"ABSTAIN_CONFLICT")

    def test_remove_k10_is_rejected(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"],"REJECTED")

    def test_remove_k10_selects_emergency(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["counterfactual_t11_receipt"]["policy_version_id"],"EMERGENCY@1.0")

    def test_delay_k10_is_rejected(self):
        _,bundle,registry,records,ledger,_,_,delay_fork,delay_branch,_,_=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=delay_branch,fork_receipt=delay_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"],"REJECTED")

    def test_alter_k9_is_rejected(self):
        _,bundle,registry,records,ledger,_,_,_,_,alter_fork,alter_branch=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=alter_branch,fork_receipt=alter_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=9,valid_time=9)
        self.assertEqual(r["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"],"REJECTED")

    def test_counterfactual_truth_boundary_explicit(self):
        *_,remove_fork,remove_branch,_,_,_,_=self.branches()
        self.assertEqual(remove_fork["truth_claim"],m.COUNTERFACTUAL_TRUTH_BOUNDARY)
        self.assertEqual(remove_branch["truth_claim"],m.COUNTERFACTUAL_TRUTH_BOUNDARY)

    def test_first_remove_divergence_is_k9_t9(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        d=m.divergence_summary(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork)
        self.assertEqual((d["first_outcome_divergence"]["known_cutoff"],d["first_outcome_divergence"]["valid_time"]),(9,9))

    def test_divergence_names_target_event(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        d=m.divergence_summary(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork)
        self.assertEqual(d["altered_event_id"],"EV_DEACTIVATE_EMERGENCY")

    def test_comparison_marks_outcome_change(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        row=m.compare_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork,known_cutoff=10,valid_time=10)
        self.assertTrue(row["outcome_changed"])

    def test_comparison_marks_policy_change(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        row=m.compare_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork,known_cutoff=10,valid_time=10)
        self.assertTrue(row["policy_changed"])

    def test_counterfactual_receipt_replays_exact(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        replay=m.replay_counterfactual_receipt(r,bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger)
        self.assertEqual(m.canonical(r),m.canonical(replay))

    def test_counterfactual_receipt_tamper_fails(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        r=m.resolve_counterfactual(bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        r["valid_time"]=9
        with self.assertRaises(ValueError):
            m.replay_counterfactual_receipt(r,bundle=bundle,reviewer_registry=registry,policy_records=records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=ledger)

    def test_bundle_validates(self):
        payload,art=m.run_suite()
        self.assertTrue(m.validate_counterfactual_bundle(art["counterfactual_bundle"]))

    def test_bundle_manifest_tamper_fails(self):
        _,art=m.run_suite()
        bad=m.deepcopy(art["counterfactual_bundle"]); bad["manifest"]["bundle_id"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_counterfactual_bundle(bad)

    def test_bundle_payload_tamper_fails(self):
        _,art=m.run_suite()
        bad=m.deepcopy(art["counterfactual_bundle"]); bad["payload"]["truth_claim"]="OBSERVED"
        with self.assertRaises(ValueError):
            m.validate_counterfactual_bundle(bad)

    def test_portable_roundtrip_exact(self):
        _,art=m.run_suite()
        b=art["counterfactual_bundle"]
        self.assertEqual(m.canonical(m.portable_import(m.portable_export(b))),m.canonical(b))

    def test_branch_replay_deterministic(self):
        *_,ledger,remove_fork,_,_=self.fixture()
        a=m.apply_counterfactual_branch(ledger,remove_fork)
        b=m.apply_counterfactual_branch(ledger,remove_fork)
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_divergence_replay_deterministic(self):
        _,bundle,registry,records,ledger,remove_fork,remove_branch,_,_,_,_=self.branches()
        a=m.divergence_summary(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork)
        b=m.divergence_summary(bundle=bundle,reviewer_registry=registry,policy_records=records,observed_ledger=ledger,branch=remove_branch,fork_receipt=remove_fork)
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_source_status_stays_alleged(self):
        claim,*_=self.fixture()
        self.assertEqual(claim["source_status"],"ALLEGED")


if __name__=="__main__":
    unittest.main()
