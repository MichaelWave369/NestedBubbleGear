from __future__ import annotations

import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r5_e7_review_pair", ROOT/"reconcile_reviews.py")
assert SPEC and SPEC.loader
r7 = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(r7)

RB3_SPEC = importlib.util.spec_from_file_location("rb3_r5_e7_frozen_runner", ROOT.parents[1]/"src"/"rb3.py")
assert RB3_SPEC and RB3_SPEC.loader
frozen = importlib.util.module_from_spec(RB3_SPEC)
RB3_SPEC.loader.exec_module(frozen)


def paired(source_id="RB2-S001"):
    a = r7.intake.template_for_source(source_id)
    b = copy.deepcopy(a)
    for document,handle in ((a,"mock-reviewer-a"),(b,"mock-reviewer-b")):
        document["reviewer"]["github_handle"] = handle
        document["reviewer"]["is_original_extractor"] = False
    return a,b


def mock_proposal(document):
    """FABRICATED TEST FIXTURE ONLY, never a real source assessment."""
    document["source_access"].update({
        "access_state":"FULLTEXT_OBTAINED",
        "primary_fulltext_checked":True,
        "fulltext_locator":"https://example.org/mock-primary-paper-for-unit-tests",
        "methods_locator":"Mock Methods section (TEST ONLY)",
    })
    document["row_proposals"][0].update({
        "proposal":"PROPOSE_ELIGIBLE",
        "source_figure_or_table":"Mock Figure 3B",
        "assay_exact":"Mock neuron assay",
        "exposure_window":"Mock 1h/day for three days",
        "readout_timepoint":"Mock day 3",
        "control_comparator":"Mock 0 mT sham control",
        "reported_direction_evidence":"Mock author direction, not real data",
        "statistical_basis":"Mock source statistics, not verified",
        "review_notes":"TEST FIXTURE ONLY; synthetic example, NOT reviewed scientific evidence",
    })


class DualReviewerTests(unittest.TestCase):
    def test_all_original_sources_and_no_approvals(self):
        report=r7.audit()
        self.assertEqual(report["status"],r7.READY)
        self.assertEqual(report["frozen_source_review_templates"],14)
        self.assertEqual(report["frozen_candidate_observations"],64)
        self.assertEqual(report["source_only_no_candidate_studies"],5)
        self.assertEqual(report["unrepresented_lineages"],["L005","L006","L010"])
        self.assertEqual(report["actual_dual_reviewer_submissions"],0)
        self.assertFalse(report["model_execution_authorized"])

    def test_unreviewed_two_distinct_declarations_do_not_count_as_reviews(self):
        a,b=paired()
        result=r7.reconcile_pair(a,b)
        self.assertEqual(result["status"],r7.APPROVAL_BOUNDARY)
        self.assertEqual(len(result["row_comparisons"]),9)
        self.assertEqual(result["comparison_state_counts"],{"AWAITING_BOTH_PRIMARY_REVIEWS":9})
        self.assertEqual(result["independently_attested_source_reviews"],0)
        self.assertFalse(result["reviewer_identification_authenticated"])
        self.assertEqual(result["approved_rows"],0)

    def test_same_declared_reviewer_casefolded_is_refused(self):
        a,b=paired()
        b["reviewer"]["github_handle"]="MOCK-REVIEWER-A"
        with self.assertRaisesRegex(ValueError,"same declared reviewer"):
            r7.reconcile_pair(a,b)

    def test_original_extractor_declaration_is_refused(self):
        a,b=paired()
        a["reviewer"]["is_original_extractor"]=True
        with self.assertRaisesRegex(ValueError,"original extractor"):
            r7.reconcile_pair(a,b)

    def test_unidentified_reviewer_is_refused(self):
        a,b=paired()
        b["reviewer"]["github_handle"]=None
        with self.assertRaisesRegex(ValueError,"reviewer handle declaration missing"):
            r7.reconcile_pair(a,b)

    def test_fake_authenticated_reviewer_is_refused(self):
        a,b=paired()
        b["reviewer"]["identity_verified"]=True
        with self.assertRaisesRegex(ValueError,"draft cannot verify identity"):
            r7.reconcile_pair(a,b)

    def test_one_reviewer_cannot_assert_sci_approval(self):
        a,b=paired()
        b["independent_review_attested"]=True
        with self.assertRaisesRegex(ValueError,"fake independent reviewer attestation"):
            r7.reconcile_pair(a,b)

    def test_source_and_lineage_mismatch_refused(self):
        a,b=paired()
        other,_=paired("RB2-S002")
        with self.assertRaisesRegex(ValueError,"different original study IDs"):
            r7.reconcile_pair(a,other)

    def test_fulltext_pubmed_abstract_not_accepted_as_fulltext(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        a["source_access"]["fulltext_locator"]="https://pubmed.ncbi.nlm.nih.gov/40789910/"
        with self.assertRaisesRegex(ValueError,"abstract or request page"):
            r7.reconcile_pair(a,b)

    def test_fulltext_researchgate_request_not_accepted(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        b["source_access"]["fulltext_locator"]="https://www.researchgate.net/publication/12345678"
        with self.assertRaisesRegex(ValueError,"abstract or request page"):
            r7.reconcile_pair(a,b)

    def test_fulltext_doi_landing_not_accepted(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        b["source_access"]["fulltext_locator"]="https://doi.org/10.1038/s41598-025-14738-x"
        with self.assertRaisesRegex(ValueError,"abstract or request page"):
            r7.reconcile_pair(a,b)

    def test_two_matching_eligibility_proposals_never_become_approved(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        result=r7.reconcile_pair(a,b)
        self.assertEqual(result["row_comparisons"][0]["state"],
                         "CONCORDANT_UNATTESTED_ELIGIBILITY_PROPOSALS")
        self.assertEqual(result["approved_rows"],0)
        self.assertEqual(result["new_model_rows"],0)
        self.assertFalse(result["training_authorized"])
        self.assertFalse(result["execution_authorized"])
        self.assertFalse(result["row_comparisons"][0]["fit_eligible"])

    def test_material_figure_disagreement_requires_human_adjudication(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        b["row_proposals"][0]["source_figure_or_table"]="Mock Figure 5C"
        result=r7.reconcile_pair(a,b)
        self.assertEqual(result["row_comparisons"][0]["state"],
                         "MATERIAL_EVIDENCE_DISAGREEMENT_REQUIRES_HUMAN_ADJUDICATION")
        self.assertEqual(result["row_comparisons"][0]["disagreed_evidence_fields"],
                         ["source_figure_or_table"])

    def test_material_comparator_disagreement_requires_human_adjudication(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        b["row_proposals"][0]["control_comparator"]="Mock untreated controls"
        result=r7.reconcile_pair(a,b)
        self.assertIn("control_comparator",result["row_comparisons"][0]["disagreed_evidence_fields"])

    def test_mock_abstract_cannot_masquerade_as_primary_figure(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        a["row_proposals"][0]["source_figure_or_table"]="PubMed Abstract"
        with self.assertRaisesRegex(ValueError,"abstract/pooled text"):
            r7.reconcile_pair(a,b)

    def test_pooled_comparator_rejected(self):
        a,b=paired()
        mock_proposal(a);mock_proposal(b)
        a["row_proposals"][0]["control_comparator"]="Pooled aggregate vs sham"
        with self.assertRaisesRegex(ValueError,"ambiguous comparator"):
            r7.reconcile_pair(a,b)

    def test_proposal_rejection_is_not_auto_final_decision(self):
        a,b=paired()
        for doc in (a,b):
            doc["row_proposals"][0]["proposal"]="PROPOSE_REJECT"
            doc["row_proposals"][0]["review_notes"]="No condition-level support; TEST ONLY"
        r=r7.reconcile_pair(a,b)
        self.assertEqual(r["row_comparisons"][0]["state"],
                         "AGREED_PROPOSED_REJECTION_NOT_FINAL")
        self.assertEqual(r["approved_rows"],0)

    def test_opposing_proposal_classes_require_resolution(self):
        a,b=paired()
        a["row_proposals"][0]["proposal"]="NEEDS_PRIMARY_TEXT"
        a["row_proposals"][0]["review_notes"]="Missing original data, test only"
        b["row_proposals"][0]["proposal"]="PROPOSE_REJECT"
        b["row_proposals"][0]["review_notes"]="Missing exact sham contrast, test only"
        r=r7.reconcile_pair(a,b)
        self.assertEqual(r["row_comparisons"][0]["state"],
                         "CONFLICT_REQUIRES_HUMAN_ADJUDICATION")

    def test_source_only_missing_papers_remain_zero_candidate_rows(self):
        for source in ("RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"):
            a,b=paired(source)
            r=r7.reconcile_pair(a,b)
            self.assertEqual(r["row_comparisons"],[])
            self.assertEqual(r["source_summary"],"AWAITING_BOTH_PRIMARY_REVIEWS")
            self.assertEqual(r["new_model_rows"],0)

    def test_source_only_discovery_pair_requires_new_extraction_pr(self):
        a,b=paired("RB2-S008")
        for doc in (a,b):
            doc["source_access"].update({
                "access_state":"FULLTEXT_OBTAINED",
                "primary_fulltext_checked":True,
                "fulltext_locator":"https://example.org/mock-primary-paper-for-unit-tests",
                "methods_locator":"Methods, figure details TEST ONLY",
            })
            doc["source_disposition"]="CONDITIONS_FOUND_PENDING_EXTRACTION"
            doc["new_condition_discovery"]={
                "count":1,
                "source_evidence_locators":["Mock Table 3 comparator"],
                "extraction_notes":"TEST ONLY: source-level discovery, not a model row",
            }
        r=r7.reconcile_pair(a,b)
        self.assertEqual(r["source_summary"],
                         "CONCORDANT_SOURCE_DISCOVERY_NEEDS_NEW_EXTRACTION_PR")
        self.assertEqual(r["new_model_rows"],0)
        self.assertEqual(r["approved_rows"],0)

    def test_source_discovery_disagreement_stays_visible(self):
        a,b=paired("RB2-S009")
        for doc in (a,b):
            doc["source_access"].update({
                "access_state":"FULLTEXT_OBTAINED",
                "primary_fulltext_checked":True,
                "fulltext_locator":"https://example.org/mock-primary-paper-for-unit-tests",
                "methods_locator":"Methods, unit test only",
            })
            doc["source_disposition"]="CONDITIONS_FOUND_PENDING_EXTRACTION"
            doc["new_condition_discovery"]={
                "count":1,"source_evidence_locators":["Mock Fig 2"],
                "extraction_notes":"TEST ONLY: unrelated mock evidence discovery"
            }
        b["new_condition_discovery"]["source_evidence_locators"]=["Mock Fig 5"]
        r=r7.reconcile_pair(a,b)
        self.assertEqual(r["source_summary"],
                         "SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION")

    def test_source_only_fake_condition_row_is_refused(self):
        a,b=paired("RB2-S013")
        mockrow=r7.intake.template_for_source("RB2-S001")["row_proposals"][0]
        a["row_proposals"].append(mockrow)
        with self.assertRaisesRegex(ValueError,"row omitted or invented"):
            r7.reconcile_pair(a,b)

    def test_unauthorized_policy_promotion_refused(self):
        a,b=paired()
        policy=r7.data(r7.POLICY_PATH)
        policy["approved_rows"]=1
        with self.assertRaisesRegex(ValueError,"authorization forged"):
            r7.reconcile_pair(a,b,policy)

    def test_original_model_refuses_candidate_csv(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            frozen.execute(ROOT.parents[1]/"R3"/"additional_rows.csv")


if __name__=="__main__":
    unittest.main()
