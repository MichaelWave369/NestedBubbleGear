import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt10.py"
spec = importlib.util.spec_from_file_location("nbgt10", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT10Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def resolve(self, policy_index=0, capture_id="CAP_OPPOSE", known_time=10):
        _, bundle, registry, policies = self.fixture()
        return m.resolve_conflict(
            bundle=bundle,
            capture_id=capture_id,
            reviewer_registry=registry,
            policy=policies[policy_index],
            known_time=known_time,
            expected_manifest_hash=bundle["manifest"]["manifest_hash"],
            expected_reviewer_registry_hash=registry["registry_sha256"],
        )

    def test_all_twenty_four_checks_pass(self):
        r = m.run_suite()[0]
        self.assertEqual((r["checks_passed"],r["checks_total"],r["verdict"]),(24,24,"PASS_NBGT10"))

    def test_reviewer_registry_validates(self):
        _,_,registry,_=self.fixture()
        self.assertTrue(m.validate_reviewer_registry(registry))

    def test_duplicate_reviewer_rejected(self):
        row={"reviewer_id":"R","role":"X","authority":1,"active":True}
        with self.assertRaises(ValueError):
            m.make_reviewer_registry([row,row])

    def test_negative_authority_rejected(self):
        row={"reviewer_id":"R","role":"X","authority":-1,"active":True}
        with self.assertRaises(ValueError):
            m.make_reviewer_registry([row])

    def test_policy_hash_validates(self):
        _,_,_,policies=self.fixture()
        self.assertTrue(m.validate_policy(policies[0],known_time=10))

    def test_stale_policy_rejected(self):
        p=m.make_policy(policy_id="P",policy_version="1",mode="WEIGHTED_THRESHOLD",eligible_roles={"R"},min_participants=1,accept_threshold=1,reject_threshold=1,weight_mode="UNIT",effective_from=1,effective_until=2,description="x")
        with self.assertRaises(ValueError):
            m.validate_policy(p,known_time=10)

    def test_policy_tamper_rejected(self):
        _,_,_,policies=self.fixture()
        bad=m.deepcopy(policies[0]); bad["accept_threshold"]=99
        with self.assertRaises(ValueError):
            m.validate_policy(bad,known_time=10)

    def test_weighted_policy_rejects(self):
        self.assertEqual(self.resolve(0)["governance_outcome"],"REJECTED")

    def test_weighted_scores(self):
        r=self.resolve(0)
        self.assertEqual((r["accept_score"],r["reject_score"]),(1,2))

    def test_unanimous_policy_abstains(self):
        self.assertEqual(self.resolve(1)["governance_outcome"],"ABSTAIN_CONFLICT")

    def test_researcher_quorum_insufficient(self):
        self.assertEqual(self.resolve(2)["governance_outcome"],"INSUFFICIENT_AUTHORITY")

    def test_single_researcher_accepts_support(self):
        self.assertEqual(self.resolve(3,"CAP_A_V1")["governance_outcome"],"ACCEPTED")

    def test_resolution_receipt_hash_present(self):
        self.assertEqual(len(self.resolve(0)["receipt_hash"]),64)

    def test_resolution_receipt_has_policy_identity(self):
        r=self.resolve(0)
        self.assertEqual((r["policy_id"],r["policy_version"]),("POLICY_WEIGHTED_AUTHORITY","1.0"))

    def test_resolution_receipt_has_two_input_decisions(self):
        self.assertEqual(len(self.resolve(0)["input_decision_hashes"]),2)

    def test_truth_boundary_explicit(self):
        self.assertEqual(self.resolve(0)["truth_claim"],"NONE_POLICY_OUTCOME_IS_NOT_OBJECTIVE_TRUTH")

    def test_bundle_manifest_expectation_mismatch_blocked(self):
        _,bundle,registry,policies=self.fixture()
        with self.assertRaises(ValueError):
            m.resolve_conflict(bundle=bundle,capture_id="CAP_OPPOSE",reviewer_registry=registry,policy=policies[0],known_time=10,expected_manifest_hash="0"*64,expected_reviewer_registry_hash=registry["registry_sha256"])

    def test_registry_expectation_mismatch_blocked(self):
        _,bundle,registry,policies=self.fixture()
        with self.assertRaises(ValueError):
            m.resolve_conflict(bundle=bundle,capture_id="CAP_OPPOSE",reviewer_registry=registry,policy=policies[0],known_time=10,expected_manifest_hash=bundle["manifest"]["manifest_hash"],expected_reviewer_registry_hash="f"*64)

    def test_historical_decisions_unchanged_by_resolution(self):
        _,bundle,registry,policies=self.fixture()
        before=m.canonical(bundle["payload"]["decisions"])
        self.resolve(0)
        self.assertEqual(before,m.canonical(bundle["payload"]["decisions"]))

    def test_policy_comparison_yields_three_outcomes(self):
        _,bundle,registry,policies=self.fixture()
        rows=m.policy_comparison(bundle=bundle,capture_id="CAP_OPPOSE",reviewer_registry=registry,policies=policies[:3],known_time=10)
        self.assertEqual({r["outcome"] for r in rows},{"REJECTED","ABSTAIN_CONFLICT","INSUFFICIENT_AUTHORITY"})

    def test_policy_comparison_uses_same_input_hashes(self):
        _,bundle,registry,policies=self.fixture()
        rows=m.policy_comparison(bundle=bundle,capture_id="CAP_OPPOSE",reviewer_registry=registry,policies=policies[:3],known_time=10)
        self.assertEqual(len({tuple(r["input_decision_hashes"]) for r in rows}),1)

    def test_t9_conflict_remains_preserved(self):
        _,bundle,_,_=self.fixture()
        self.assertEqual(m.t9.merged_review_state("CAP_OPPOSE",bundle["payload"]["decisions"]),"REVIEW_CONFLICT")

    def test_source_status_remains_alleged(self):
        claim,_,_,_=self.fixture()
        self.assertEqual(claim["source_status"],"ALLEGED")

    def test_receipt_replay_exact(self):
        _,bundle,registry,policies=self.fixture()
        receipt=self.resolve(0)
        pmap={(p["policy_id"],p["policy_version"]):p for p in policies}
        self.assertEqual(m.canonical(m.replay_receipt(receipt,bundle=bundle,reviewer_registry=registry,policies=pmap)),m.canonical(receipt))

    def test_tampered_receipt_replay_fails(self):
        _,bundle,registry,policies=self.fixture()
        receipt=self.resolve(0); receipt["governance_outcome"]="ACCEPTED"
        pmap={(p["policy_id"],p["policy_version"]):p for p in policies}
        with self.assertRaises(ValueError):
            m.replay_receipt(receipt,bundle=bundle,reviewer_registry=registry,policies=pmap)

    def test_missing_policy_replay_fails(self):
        _,bundle,registry,_=self.fixture()
        receipt=self.resolve(0)
        with self.assertRaises(ValueError):
            m.replay_receipt(receipt,bundle=bundle,reviewer_registry=registry,policies={})

    def test_resolution_deterministic(self):
        self.assertEqual(m.canonical(self.resolve(0)),m.canonical(self.resolve(0)))


if __name__=="__main__":
    unittest.main()
