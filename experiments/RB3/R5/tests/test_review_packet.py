from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

R5 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("nbg_rb3_r5_packet", R5 / "build_review_packet.py")
if SPEC is None or SPEC.loader is None:
    raise RuntimeError("cannot import R5 review packet")
r5 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(r5)

RB3SPEC = importlib.util.spec_from_file_location("nbg_rb3_r5_runner", R5.parent / "src" / "rb3.py")
if RB3SPEC is None or RB3SPEC.loader is None:
    raise RuntimeError("cannot import frozen RB3 runner")
rb3 = importlib.util.module_from_spec(RB3SPEC)
RB3SPEC.loader.exec_module(rb3)


class ReviewerPacketTests(unittest.TestCase):
    def setUp(self):
        self.protocol = r5.json_file(r5.PROTOCOL)
        self.decisions = r5.json_file(r5.DECISIONS)
        self.manifest = r5.json_file(r5.RB2 / "corpus_manifest.json")

    def test_audited_packet_has_expected_unreviewed_counts(self):
        p = r5.packet()
        self.assertEqual(p["status"], r5.BLOCK_CLASS)
        self.assertEqual(p["candidate_rows"], 64)
        self.assertEqual(p["candidate_papers"], 9)
        self.assertEqual(p["candidate_lineages"], 8)
        self.assertEqual(p["frozen_sources"], 14)
        self.assertEqual(p["frozen_lineages"], 11)
        self.assertEqual(p["missing_candidate_lineages"], ["L005", "L006", "L010"])
        self.assertEqual(p["reviewed_eligible_rows"], 0)
        self.assertEqual(p["independent_review_attestations"], 0)
        self.assertFalse(p["execution_authorized"])
        self.assertEqual(len(p["row_queue"]), 64)
        self.assertEqual(len(p["source_queue"]), 14)

    def test_packet_is_deterministic(self):
        p = r5.packet()
        self.assertEqual(p["packet_sha256"], r5.packet()["packet_sha256"])
        self.assertEqual(
            p["packet_sha256"],
            r5.sha256(r5.canonical_bytes({k:v for k,v in p.items() if k!="packet_sha256"})),
        )

    def test_every_candidate_is_pending(self):
        p = r5.packet()
        self.assertTrue(all(not r["fit_eligible"] for r in p["row_queue"]))
        self.assertTrue(all(r["review_status"]=="PENDING_INDEPENDENT_REVIEW" for r in p["row_queue"]))
        self.assertTrue(all(r["source_outcome"]=="NO_ADMISSIBLE_ROWS_VERIFIED" for r in p["source_queue"]))

    def test_source_only_lineages_are_unrepresented_and_queued(self):
        p = r5.packet()
        source_index = {s["source_id"]:s for s in p["source_queue"]}
        for sid in ("RB2-S008", "RB2-S009", "RB2-S013"):
            self.assertEqual(source_index[sid]["candidate_rows"], 0)
            self.assertIn("NO_CANDIDATE_ROWS", source_index[sid]["risk_flags"])

    def test_known_pooled_source_risks_are_visible(self):
        p = r5.packet()
        bysource = {s["source_id"]:s for s in p["source_queue"]}
        self.assertIn("ABSTRACT_ATTRIBUTED_POOLED_NULL", bysource["RB2-S012"]["risk_flags"])
        self.assertIn("NOMINAL_FREQUENCY_HAS_MEASURED_HARMONICS", bysource["RB2-S010"]["risk_flags"])
        self.assertIn("DNA_DAMAGE_CO_REPORTED", bysource["RB2-S014"]["risk_flags"])

    def test_forged_independent_review_rejected(self):
        decisions = copy.deepcopy(self.decisions)
        decisions["independent_reviewer_attestations"] = [{"reviewer":"fake"}]
        with self.assertRaisesRegex(ValueError,"independent_reviewer_attestations"):
            r5.check_decisions(decisions)

    def test_forged_row_approval_rejected(self):
        decisions = copy.deepcopy(self.decisions)
        decisions["row_decisions"] = [{"row_id":"RB3R0-S001-01","status":"REVIEWED_ELIGIBLE"}]
        with self.assertRaisesRegex(ValueError,"row_decisions"):
            r5.check_decisions(decisions)

    def test_forged_execution_authorization_rejected(self):
        decisions = copy.deepcopy(self.decisions)
        decisions["execution_authorized"] = True
        with self.assertRaisesRegex(ValueError,"execution improperly authorized"):
            r5.check_decisions(decisions)

    def test_protocol_review_constraints_cannot_be_turned_off(self):
        protocol = copy.deepcopy(self.protocol)
        protocol["constraints"]["no_automatic_review_status_upgrade"] = False
        with self.assertRaisesRegex(ValueError,"no_automatic_review_status_upgrade"):
            r5.check_protocol(protocol,self.manifest)

    def test_protocol_cannot_hide_unreviewed_source(self):
        protocol = copy.deepcopy(self.protocol)
        del protocol["review_cases"]["RB2-S013"]
        with self.assertRaisesRegex(ValueError,"missing sources"):
            r5.check_protocol(protocol,self.manifest)

    def test_tampered_receipt_direction_refused(self):
        _, rows = r5.csv_file(r5.RB3 / "R2/additional_rows.csv")
        evidence = r5.json_file(r5.RB3 / "R2/source_evidence.json")
        match = next(e for e in evidence["records"] if e["row_id"] == rows[0]["row_id"])
        bad = copy.deepcopy(match)
        bad["reported_direction"] = "DECREASE"
        with self.assertRaisesRegex(ValueError,"outcome label mismatches"):
            r5.checked_evidence(rows[0],bad,2)

    def test_real_fit_still_refuses_candidate_csv(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            rb3.execute(r5.RB3 / "R3/additional_rows.csv")


if __name__=="__main__":
    unittest.main()
