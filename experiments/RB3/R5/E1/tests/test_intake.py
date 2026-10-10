from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

HERE = Path(__file__).resolve()
ROOT = HERE.parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r5_e1_intake", ROOT / "review_intake.py")
assert SPEC and SPEC.loader
intake = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(intake)

RUN_SPEC = importlib.util.spec_from_file_location("rb3_r5_e1_runner", ROOT.parents[1] / "src" / "rb3.py")
assert RUN_SPEC and RUN_SPEC.loader
runner = importlib.util.module_from_spec(RUN_SPEC)
RUN_SPEC.loader.exec_module(runner)


class R5E1IntakeTests(unittest.TestCase):
    def setUp(self):
        self.sample = intake.template_for_source("RB2-S010")
        self.empty = intake.template_for_source("RB2-S008")

    def invalid(self, edit, fragment):
        draft = copy.deepcopy(self.sample)
        edit(draft)
        with self.assertRaisesRegex(ValueError, fragment):
            intake.validate_draft(draft)

    def test_audit_source_intake(self):
        report = intake.audit()
        self.assertEqual(report["source_templates"], 14)
        self.assertEqual(report["candidate_rows_available_for_review"], 64)
        self.assertEqual(report["unresolved_access_requests"], 5)
        self.assertEqual(report["independent_reviews_completed"], 0)
        self.assertFalse(report["model_run_authorized"])

    def test_draft_starts_empty_and_not_attested(self):
        result = intake.validate_draft(self.sample)
        self.assertEqual(result["status"], intake.DRAFT_CLASS)
        self.assertEqual(result["fit_eligible_rows"], 0)
        self.assertFalse(result["execution_authorized"])
        self.assertEqual(len(self.sample["row_proposals"]), 12)
        self.assertEqual(len(self.empty["row_proposals"]), 0)

    def test_each_source_uses_frozen_digest_and_row_identity(self):
        p = intake.previous.packet()
        by_id = {s["source_id"]:s for s in p["source_queue"]}
        for sid in by_id:
            draft = intake.template_for_source(sid)
            self.assertEqual(draft["packet_sha256"],p["packet_sha256"])
            self.assertEqual(draft["lineage_id"],by_id[sid]["lineage_id"])
            self.assertEqual(len(draft["row_proposals"]),by_id[sid]["candidate_rows"])

    def test_source_only_does_not_imply_no_effect(self):
        self.assertEqual(self.empty["source_disposition"],"PENDING")
        self.assertEqual(self.empty["new_condition_discovery"]["count"],0)
        result = intake.validate_draft(self.empty)
        self.assertEqual(result["candidate_rows_checked"],0)

    def test_fake_review_attestation_is_rejected(self):
        self.invalid(lambda d: d.__setitem__("independent_review_attested",True),"fake independent reviewer")

    def test_fake_fit_authority_is_rejected(self):
        self.invalid(lambda d: d.__setitem__("execution_authorized",True),"unauthorized model")

    def test_faked_eligible_row_count_is_rejected(self):
        self.invalid(lambda d: d.__setitem__("fit_eligible_rows",1),"eligible-row count")

    def test_packet_sha_mismatch_rejected(self):
        self.invalid(lambda d: d.__setitem__("packet_sha256","0"*64),"packet_sha256")

    def test_row_hash_changed_rejected(self):
        self.invalid(lambda d: d["row_proposals"][0].__setitem__("candidate_row_digest_sha256","0"*64),"SHA-256 changed")

    def test_source_id_changed_rejected(self):
        self.invalid(lambda d: d.__setitem__("source_id","RB2-S011"),"changed:")

    def test_row_omission_rejected(self):
        self.invalid(lambda d: d["row_proposals"].pop(),"row omitted")

    def test_reject_automatic_approval_vocabulary(self):
        self.invalid(lambda d: d["row_proposals"][0].__setitem__("proposal","REVIEWED_ELIGIBLE"),"unapproved row disposition")

    def test_eligibility_requires_primary_fulltext(self):
        def propose(d):
            d["row_proposals"][0]["proposal"]="PROPOSE_ELIGIBLE"
            d["row_proposals"][0]["review_notes"]="A full text recheck is required."
        self.invalid(propose,"eligibility proposal requires fulltext")

    def test_eligibility_requires_distinct_reviewer(self):
        def propose(d):
            d["source_access"].update({
                "access_state":"FULLTEXT_OBTAINED",
                "primary_fulltext_checked":True,
                "fulltext_locator":"https://example.org/mock-fulltext",
                "methods_locator":"Mock methods section",
            })
            d["row_proposals"][0].update({
                "proposal":"PROPOSE_ELIGIBLE",
                "review_notes":"Mock proposal, not real evidence",
            })
        self.invalid(propose,"distinct reviewer")

    def test_structurally_complete_mock_is_still_not_an_attestation(self):
        d = copy.deepcopy(self.sample)
        d["reviewer"].update({"github_handle":"mock-reviewer","is_original_extractor":False})
        d["source_access"].update({
            "access_state":"FULLTEXT_OBTAINED",
            "primary_fulltext_checked":True,
            "fulltext_locator":"https://example.org/mock-document",
            "methods_locator":"Mock methods section",
        })
        d["row_proposals"][0].update({
            "proposal":"PROPOSE_ELIGIBLE",
            "review_notes":"UNIT TEST ONLY: contents are fabricated and must not be submitted",
            "source_figure_or_table":"Mock Figure 1",
            "assay_exact":"Mock assay",
            "exposure_window":"Mock 3 hours",
            "readout_timepoint":"Mock 24 hours",
            "control_comparator":"Mock sham",
            "reported_direction_evidence":"Mock result",
            "statistical_basis":"Mock p-value",
        })
        report=intake.validate_draft(d)
        self.assertEqual(report["unapproved_eligibility_proposals"],1)
        self.assertEqual(report["fit_eligible_rows"],0)
        self.assertFalse(report["independent_review_attested"])
        self.assertFalse(report["execution_authorized"])

    def test_cannot_claim_new_conditions_without_primary_text(self):
        draft=copy.deepcopy(self.empty)
        draft["source_disposition"]="CONDITIONS_FOUND_PENDING_EXTRACTION"
        draft["new_condition_discovery"]["count"]=1
        with self.assertRaisesRegex(ValueError,"new conditions require checked"):
            intake.validate_draft(draft)

    def test_cannot_claim_fulltext_missing_when_fulltext_is_claimed_read(self):
        draft=copy.deepcopy(self.empty)
        draft["source_disposition"]="FULLTEXT_UNAVAILABLE"
        with self.assertRaisesRegex(ValueError,"unavailable disposition"):
            intake.validate_draft(draft)

    def test_existing_runner_still_refuses_candidates(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            runner.execute(ROOT.parents[1] / "R0" / "candidate_rows.csv")


if __name__=="__main__":
    unittest.main()
