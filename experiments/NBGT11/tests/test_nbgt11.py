import importlib.util
import sys
from pathlib import Path
import unittest

P=Path(__file__).resolve().parents[1]/"src"/"nbgt11.py"
spec=importlib.util.spec_from_file_location("nbgt11",P)
m=importlib.util.module_from_spec(spec)
sys.modules[spec.name]=m
spec.loader.exec_module(m)


class NBGT11Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def test_all_twenty_eight_checks_pass(self):
        r=m.run_suite()[0]
        self.assertEqual((r["checks_passed"],r["checks_total"],r["verdict"]),(28,28,"PASS_NBGT11"))

    def test_policy_ledger_valid(self):
        *_,ledger=self.fixture()
        self.assertEqual(m.validate_policy_ledger(ledger),ledger[-1]["event_hash"])

    def test_policy_ledger_tamper_fails(self):
        *_,ledger=self.fixture()
        bad=m.deepcopy(ledger); bad[0]["valid_time"]=99
        with self.assertRaises(ValueError):
            m.validate_policy_ledger(bad)

    def test_temporal_policy_tamper_fails(self):
        *_,records,_=self.fixture()
        bad=m.deepcopy(records[0]); bad["priority"]=999
        with self.assertRaises(ValueError):
            m.validate_temporal_policy(bad)

    def test_k5_selects_normal_v1(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=5,valid_time=5)
        self.assertEqual(k["selected_policy_version_id"],"NORMAL@1.0")

    def test_k7_selects_emergency(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=7,valid_time=7)
        self.assertEqual(k["selected_policy_version_id"],"EMERGENCY@1.0")

    def test_k7_cannot_see_future_known_normal_v2(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=7,valid_time=7)
        self.assertNotIn("NORMAL@2.0",k["visible_policy_version_ids"])

    def test_k8_can_see_normal_v2(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=8,valid_time=7)
        self.assertIn("NORMAL@2.0",k["visible_policy_version_ids"])

    def test_emergency_has_priority_at_k8(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=8,valid_time=7)
        self.assertEqual(k["selected_policy_version_id"],"EMERGENCY@1.0")

    def test_k10_selects_normal_v2(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=10,valid_time=10)
        self.assertEqual(k["selected_policy_version_id"],"NORMAL@2.0")

    def test_historical_valid7_at_known10_still_emergency(self):
        _,_,_,records,ledger=self.fixture()
        k=m.governance_keyhole(records,ledger,known_cutoff=10,valid_time=7)
        self.assertEqual(k["selected_policy_version_id"],"EMERGENCY@1.0")

    def test_normal_v1_superseded_at_k10(self):
        _,_,_,records,ledger=self.fixture()
        self.assertEqual(m.policy_status_at("NORMAL@1.0",records,ledger,known_cutoff=10,valid_time=10),"SUPERSEDED")

    def test_normal_v2_not_yet_known_at_k7(self):
        _,_,_,records,ledger=self.fixture()
        self.assertEqual(m.policy_status_at("NORMAL@2.0",records,ledger,known_cutoff=7,valid_time=7),"NOT_YET_KNOWN")

    def test_emergency_active_at_k7(self):
        _,_,_,records,ledger=self.fixture()
        self.assertEqual(m.emergency_state("EMERGENCY@1.0",ledger,known_cutoff=7,valid_time=7),"ACTIVE")

    def test_emergency_inactive_at_k10(self):
        _,_,_,records,ledger=self.fixture()
        self.assertEqual(m.emergency_state("EMERGENCY@1.0",ledger,known_cutoff=10,valid_time=10),"INACTIVE")

    def test_k5_resolution_rejected(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=5,valid_time=5)
        self.assertEqual(r["t10_resolution_receipt"]["governance_outcome"],"REJECTED")

    def test_k10_resolution_abstain_conflict(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["t10_resolution_receipt"]["governance_outcome"],"ABSTAIN_CONFLICT")

    def test_resolution_pins_policy_version(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual((r["policy_version_id"],r["t10_resolution_receipt"]["policy_version"]),("NORMAL@2.0","2.0"))

    def test_resolution_truth_boundary_explicit(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(r["truth_claim"],"NONE_TEMPORAL_POLICY_OUTCOME_IS_OBJECTIVE_TRUTH")

    def test_keyhole_comparison_detects_policy_change(self):
        _,_,_,records,ledger=self.fixture()
        c=m.keyhole_comparison(records,ledger,{"known_cutoff":5,"valid_time":5},{"known_cutoff":10,"valid_time":10})
        self.assertTrue(c["selected_policy_changed"])

    def test_keyhole_comparison_detects_ledger_change(self):
        _,_,_,records,ledger=self.fixture()
        c=m.keyhole_comparison(records,ledger,{"known_cutoff":5,"valid_time":5},{"known_cutoff":10,"valid_time":10})
        self.assertTrue(c["ledger_head_changed"])

    def test_receipt_replay_exact(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        self.assertEqual(m.canonical(m.replay_keyhole_receipt(r,bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger)),m.canonical(r))

    def test_receipt_tamper_fails(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        r["valid_time"]=99
        with self.assertRaises(ValueError):
            m.replay_keyhole_receipt(r,bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger)

    def test_old_receipt_does_not_change_after_later_events(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=5,valid_time=5)
        before=m.canonical(r)
        m.governance_keyhole(records,ledger,known_cutoff=10,valid_time=10)
        self.assertEqual(before,m.canonical(r))

    def test_governance_bundle_valid(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        g=m.build_governance_bundle(bundle_id="G",input_t9_manifest=bundle["manifest"],reviewer_registry=registry,policy_records=records,events=ledger,resolution_receipts=[r])
        self.assertTrue(m.validate_governance_bundle(g))

    def test_governance_bundle_manifest_tamper_fails(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        g=m.build_governance_bundle(bundle_id="G",input_t9_manifest=bundle["manifest"],reviewer_registry=registry,policy_records=records,events=ledger,resolution_receipts=[r])
        g["manifest"]["bundle_id"]="TAMPER"
        with self.assertRaises(ValueError):
            m.validate_governance_bundle(g)

    def test_governance_bundle_payload_tamper_fails(self):
        _,bundle,registry,records,ledger=self.fixture()
        r=m.resolve_keyhole(bundle=bundle,reviewer_registry=registry,policy_records=records,events=ledger,capture_id="CAP_OPPOSE",known_cutoff=10,valid_time=10)
        g=m.build_governance_bundle(bundle_id="G",input_t9_manifest=bundle["manifest"],reviewer_registry=registry,policy_records=records,events=ledger,resolution_receipts=[r])
        g["payload"]["policy_records"][0]["priority"]=999
        with self.assertRaises(ValueError):
            m.validate_governance_bundle(g)

    def test_source_status_remains_alleged(self):
        claim,*_=self.fixture()
        self.assertEqual(claim["source_status"],"ALLEGED")

    def test_keyhole_replay_deterministic(self):
        _,_,_,records,ledger=self.fixture()
        a=m.governance_keyhole(records,ledger,known_cutoff=10,valid_time=10)
        b=m.governance_keyhole(records,ledger,known_cutoff=10,valid_time=10)
        self.assertEqual(m.canonical(a),m.canonical(b))

    def test_ledger_head_at_k5_differs_from_k10(self):
        *_,ledger=self.fixture()
        self.assertNotEqual(m.ledger_head_at(ledger,5),m.ledger_head_at(ledger,10))


if __name__=="__main__":
    unittest.main()
