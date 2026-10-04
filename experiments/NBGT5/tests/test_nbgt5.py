import importlib.util
import sys
from pathlib import Path
import unittest

P = Path(__file__).resolve().parents[1] / "src" / "nbgt5.py"
spec = importlib.util.spec_from_file_location("nbgt5", P)
m = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = m
spec.loader.exec_module(m)


class NBGT5Tests(unittest.TestCase):
    def fixture(self):
        records, raw = m.frozen_fixture()
        return records, raw, m.chain_events(raw)

    def result(self):
        return m.run_suite()

    def test_all_eighteen_checks_pass(self):
        r = self.result()
        self.assertEqual((r["checks_passed"], r["checks_total"], r["verdict"]), (18, 18, "PASS_NBGT5"))

    def test_base_ambiguity_is_append_only(self):
        records, _, events = self.fixture()
        _ = m.temporal_keyhole(records, events, knowledge_cutoff=3)
        self.assertEqual(next(r for r in records if r["record_id"] == "A1")["subject"], "UNKNOWN")

    def test_ambiguity_hidden_before_review(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=1)
        a = next(x for x in v["items"] if x["record_id"] == "A1")
        self.assertEqual((a["subject"], a["ambiguity"]), ("UNKNOWN", True))

    def test_ambiguity_resolves_only_through_event(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=3)
        a = next(x for x in v["items"] if x["record_id"] == "A1")
        self.assertEqual((a["subject"], a["ambiguity"], a["applied_event_ids"]), ("NODE_X", False, ["RV1"]))

    def test_later_review_does_not_rewrite_earlier_keyhole(self):
        records, _, events = self.fixture()
        a = m.temporal_keyhole(records, events, knowledge_cutoff=1)
        b = m.temporal_keyhole(records, m.chain_events([]), knowledge_cutoff=1)
        self.assertEqual(m.canonical(a), m.canonical(b))

    def test_external_evidence_hidden_before_known_time(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=1)
        c = next(x for x in v["items"] if x["record_id"] == "C1")
        self.assertEqual((c["status"], c["external_evidence"]), ("ALLEGED", []))

    def test_external_evidence_visible_at_k4(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        c = next(x for x in v["items"] if x["record_id"] == "C1")
        self.assertEqual(c["status"], "CORROBORATED")
        self.assertEqual(c["external_evidence"][0]["evidence_id"], "EXT_E1")

    def test_source_layer_remains_distinct(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        c = next(x for x in v["items"] if x["record_id"] == "C1")
        self.assertEqual((c["source_status"], c["status"]), ("ALLEGED", "CORROBORATED"))

    def test_status_filter(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4, statuses={"CORROBORATED"})
        self.assertEqual([x["record_id"] for x in v["items"]], ["C1"])

    def test_relation_toggle(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4, relations={"ALLEGED_LINK"})
        self.assertEqual([x["record_id"] for x in v["items"]], ["A1", "C1"])

    def test_analyst_overlay_off(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4, include_analyst_hypotheses=False)
        self.assertNotIn("H1", [x["record_id"] for x in v["items"]])

    def test_analyst_overlay_on(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4, include_analyst_hypotheses=True)
        self.assertIn("H1", [x["record_id"] for x in v["items"]])

    def test_provenance_bundle_contains_source_and_event(self):
        records, _, events = self.fixture()
        b = m.provenance_bundle("C1", records, events, knowledge_cutoff=4)
        self.assertEqual(b["base_record"]["provenance"]["layer"], "SOURCE_MAP")
        self.assertEqual([e["event_id"] for e in b["review_events"]], ["EV1"])

    def test_external_independence_is_explicit(self):
        records, _, events = self.fixture()
        v = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        c = next(x for x in v["items"] if x["record_id"] == "C1")
        self.assertEqual(c["external_evidence"][0]["source"]["independence_group"], "EXT_G1")

    def test_hash_chain_valid(self):
        _, _, events = self.fixture()
        self.assertTrue(m.validate_chain(events))

    def test_chain_input_order_canonical(self):
        _, raw, _ = self.fixture()
        self.assertEqual(m.canonical(m.chain_events(raw)), m.canonical(m.chain_events(list(reversed(raw)))))

    def test_filters_do_not_mutate_ledger_head(self):
        records, _, events = self.fixture()
        a = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        b = m.temporal_keyhole(records, events, knowledge_cutoff=4, statuses={"CORROBORATED"})
        self.assertEqual(a["review_ledger_head"], b["review_ledger_head"])

    def test_export_preserves_chain(self):
        records, _, events = self.fixture()
        e = m.export_review(records, events, knowledge_cutoff=4)
        self.assertEqual(e["base_digest"], m.base_digest(records))
        self.assertEqual(e["ledger_head"], events[-1]["event_hash"])
        self.assertEqual(len(e["review_ledger"]), 2)

    def test_replay_exact(self):
        records, _, events = self.fixture()
        a = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        b = m.temporal_keyhole(records, events, knowledge_cutoff=4)
        self.assertEqual(m.canonical(a), m.canonical(b))


if __name__ == "__main__":
    unittest.main()
