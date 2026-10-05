import importlib.util
import sys
from pathlib import Path
import tempfile
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt8.py"
spec = importlib.util.spec_from_file_location("nbgt8", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT8Tests(unittest.TestCase):
    def fixture(self):
        return m.frozen_fixture()

    def result(self):
        return m.run_suite()

    def test_all_eighteen_checks_pass(self):
        r = self.result()
        self.assertEqual((r["checks_passed"], r["checks_total"], r["verdict"]), (18, 18, "PASS_NBGT8"))

    def test_locator_allowlist_blocks_unknown_host(self):
        adapter = m.make_adapter("A", "P", "1", "G", {"example.com"})
        with self.assertRaises(ValueError):
            m.validate_locator("https://evil.example/x", adapter["allow_hosts"])

    def test_private_ip_is_refused_even_when_allowlisted(self):
        adapter = m.make_adapter("A", "P", "1", "G", {"127.0.0.1"})
        with self.assertRaises(ValueError):
            m.validate_locator("http://127.0.0.1/x", adapter["allow_hosts"])

    def test_capture_receipt_hash_replays(self):
        _, captures, _, _ = self.fixture()
        self.assertEqual(m.replay_capture(captures[0])["capture_id"], captures[0]["capture_id"])

    def test_tampered_capture_fails(self):
        _, captures, _, _ = self.fixture()
        bad = dict(captures[0])
        bad["locator"] = "https://archive.example/tampered"
        with self.assertRaises(ValueError):
            m.replay_capture(bad)

    def test_persisted_content_matches_receipt(self):
        _, captures, _, content_store = self.fixture()
        capture = next(c for c in captures if c["capture_id"] == "CAP_SUPPORT_V1")
        with tempfile.TemporaryDirectory() as tmp:
            paths = m.persist_capture(capture, content_store["CAP_SUPPORT_V1"], tmp)
            self.assertTrue(Path(paths["receipt_path"]).exists())
            self.assertTrue(Path(paths["content_path"]).exists())

    def test_failed_capture_is_blocked(self):
        claim, captures, decisions, _ = self.fixture()
        q = m.review_queue(captures, decisions, knowledge_cutoff=5)
        row = next(x for x in q if x["capture_id"] == "CAP_FAILED")
        self.assertEqual(row["queue_state"], "BLOCKED")

    def test_ambiguous_capture_is_blocked(self):
        claim, captures, decisions, _ = self.fixture()
        q = m.review_queue(captures, decisions, knowledge_cutoff=5)
        row = next(x for x in q if x["capture_id"] == "CAP_AMBIGUOUS")
        self.assertEqual(row["queue_state"], "BLOCKED")

    def test_retrieval_alone_does_not_upgrade(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=5)
        self.assertEqual(d["review_status"], "ALLEGED")

    def test_acceptance_upgrades(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=6)
        self.assertEqual(d["review_status"], "CORROBORATED")

    def test_source_status_never_rewritten(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual((claim["source_status"], d["source_status"]), ("ALLEGED", "ALLEGED"))

    def test_drift_detected(self):
        _, captures, _, _ = self.fixture()
        d = m.detect_version_drift(captures)
        self.assertEqual(len(d), 1)
        self.assertEqual(d[0]["status"], "DRIFT_DETECTED")

    def test_drifted_version_requires_separate_decision(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=7)
        self.assertEqual(d["accepted_capture_ids"], ["CAP_SUPPORT_V1"])

    def test_rejected_drift_is_visible_in_queue(self):
        _, captures, decisions, _ = self.fixture()
        q = m.review_queue(captures, decisions, knowledge_cutoff=8)
        row = next(x for x in q if x["capture_id"] == "CAP_SUPPORT_V2")
        self.assertEqual(row["queue_state"], "REJECT")

    def test_opposition_retrieval_alone_does_not_dispute(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=8)
        self.assertEqual(d["review_status"], "CORROBORATED")

    def test_accepted_opposition_creates_dispute(self):
        claim, captures, decisions, _ = self.fixture()
        d = m.derive_review_status(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(d["review_status"], "DISPUTED")
        self.assertEqual(d["independent_oppose_groups"], ["EXT_G2"])

    def test_offline_replay_matches_derived(self):
        claim, captures, decisions, _ = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(m.offline_replay(b), b["derived"])

    def test_no_hindsight_before_capture(self):
        claim, captures, decisions, _ = self.fixture()
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=4)
        self.assertEqual(b["captures"], [])
        self.assertEqual(b["derived"]["review_status"], "ALLEGED")

    def test_order_is_canonical(self):
        claim, captures, decisions, _ = self.fixture()
        a = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        b = m.evidence_bundle(claim, list(reversed(captures)), list(reversed(decisions)), knowledge_cutoff=9)
        self.assertEqual(m.canonical(a), m.canonical(b))

    def test_replay_exact(self):
        claim, captures, decisions, _ = self.fixture()
        a = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        b = m.evidence_bundle(claim, captures, decisions, knowledge_cutoff=9)
        self.assertEqual(m.canonical(a), m.canonical(b))


if __name__ == "__main__":
    unittest.main()
