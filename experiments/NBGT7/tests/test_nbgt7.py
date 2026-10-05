import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt7.py"
spec = importlib.util.spec_from_file_location("nbgt7", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT7Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def result(self):
        return m.run_suite()

    def test_all_eighteen_checks_pass(self):
        r = self.result()
        self.assertEqual(
            (r["checks_passed"], r["checks_total"], r["verdict"]),
            (18, 18, "PASS_NBGT7"),
        )

    def test_capture_has_exact_locator(self):
        _, captures, _ = self.fixture()
        c = next(x for x in captures if x["capture_id"] == "CAP_SUPPORT_V1")
        self.assertEqual(c["locator"], "synthetic://archive/document-1")

    def test_capture_has_content_digest(self):
        _, captures, _ = self.fixture()
        c = next(x for x in captures if x["capture_id"] == "CAP_SUPPORT_V1")
        self.assertEqual(len(c["content_sha256"]), 64)

    def test_capture_has_independence_group(self):
        _, captures, _ = self.fixture()
        c = next(x for x in captures if x["capture_id"] == "CAP_SUPPORT_V1")
        self.assertEqual(c["adapter"]["independence_group"], "EXT_G1")

    def test_failed_capture_is_explicit(self):
        _, captures, _ = self.fixture()
        c = next(x for x in captures if x["capture_id"] == "CAP_FAILED")
        self.assertEqual((c["retrieval_status"], c["content_sha256"]), ("FAILED", None))

    def test_ambiguous_capture_is_explicit(self):
        _, captures, _ = self.fixture()
        c = next(x for x in captures if x["capture_id"] == "CAP_AMBIGUOUS")
        self.assertEqual(c["retrieval_status"], "AMBIGUOUS")

    def test_retrieval_alone_does_not_upgrade(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=5)
        self.assertEqual(b["derived"]["review_status"], "ALLEGED")

    def test_acceptance_upgrades(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=6)
        self.assertEqual(b["derived"]["review_status"], "CORROBORATED")

    def test_source_status_is_immutable(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(b["base_claim"]["source_status"], "ALLEGED")
        self.assertEqual(b["derived"]["source_status"], "ALLEGED")

    def test_drift_is_detected(self):
        _, captures, _ = self.fixture()
        d = m.detect_version_drift(captures)
        self.assertEqual(len(d), 1)
        self.assertEqual((d[0]["from_capture_id"], d[0]["to_capture_id"]), ("CAP_SUPPORT_V1", "CAP_SUPPORT_V2"))

    def test_unaccepted_drift_does_not_rewrite(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=7)
        self.assertEqual(b["derived"]["accepted_capture_ids"], ["CAP_SUPPORT_V1"])
        self.assertEqual(b["derived"]["review_status"], "CORROBORATED")

    def test_opposition_retrieval_alone_does_not_apply(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=8)
        self.assertEqual(b["derived"]["review_status"], "CORROBORATED")

    def test_accepted_opposition_preserves_dispute(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(b["derived"]["review_status"], "DISPUTED")
        self.assertEqual(b["derived"]["independent_support_groups"], ["EXT_G1"])
        self.assertEqual(b["derived"]["independent_oppose_groups"], ["EXT_G2"])

    def test_offline_replay_matches_derived_state(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(m.offline_replay(b), b["derived"])

    def test_tampered_capture_fails_replay(self):
        _, captures, _ = self.fixture()
        c = dict(captures[0])
        c["locator"] = "synthetic://tampered"
        with self.assertRaises(ValueError):
            m.replay_capture(c)

    def test_non_captured_receipt_cannot_be_accepted(self):
        claim, captures, decisions = self.fixture()
        bad = [{
            "decision_id": "BAD",
            "capture_id": "CAP_FAILED",
            "target_claim_id": "C1",
            "known_time": 6,
            "reviewer_id": "R",
            "decision": "ACCEPT",
            "reason": "should fail",
            "provenance": "review://bad",
        }]
        with self.assertRaises(ValueError):
            m.evidence_bundle(claim, captures, bad, knowledge_cutoff=6)

    def test_no_hindsight_before_retrieval(self):
        claim, captures, decisions = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=4)
        self.assertEqual(b["derived"]["visible_capture_ids"], [])
        self.assertEqual(b["derived"]["review_status"], "ALLEGED")

    def test_order_is_canonical(self):
        claim, captures, decisions = self.fixture()
        a = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        b = m.evidence_bundle(claim, list(reversed(captures)), list(reversed(decisions)), knowledge_cutoff=9)
        self.assertEqual(m.canonical(a), m.canonical(b))

    def test_replay_exact(self):
        claim, captures, decisions = self.fixture()
        a = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(m.canonical(a), m.canonical(b))


if __name__ == "__main__":
    unittest.main()
