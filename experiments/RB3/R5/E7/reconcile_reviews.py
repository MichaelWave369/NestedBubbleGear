#!/usr/bin/env python3
"""Compare two E1 reviewer drafts; NEVER authenticate signers or approve scientific rows."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import urlsplit

E7 = Path(__file__).resolve().parent
R5 = E7.parent
RB3 = R5.parent
POLICY_PATH = E7 / "reconciliation_policy.json"
sys.path.insert(0, str(R5 / "E1"))
import review_intake as intake  # noqa: E402
sys.path.insert(0, str(R5 / "E6"))
import audit_contrasts as e6  # noqa: E402

APPROVAL_BOUNDARY = "STRUCTURAL_RECONCILIATION_NOT_INDEPENDENT_REVIEW"
READY = "PASS_RB3_R5_E7_RECONCILIATION_READINESS_UNATTESTED"
MATERIAL = (
    "source_figure_or_table", "assay_exact", "exposure_window",
    "readout_timepoint", "control_comparator",
    "reported_direction_evidence", "statistical_basis",
)
STATES = {
    "AWAITING_BOTH_PRIMARY_REVIEWS",
    "CONCORDANT_UNATTESTED_ELIGIBILITY_PROPOSALS",
    "AGREED_PROPOSED_REJECTION_NOT_FINAL",
    "AGREED_NEEDS_PRIMARY_TEXT",
    "CONFLICT_REQUIRES_HUMAN_ADJUDICATION",
    "MATERIAL_EVIDENCE_DISAGREEMENT_REQUIRES_HUMAN_ADJUDICATION",
    "CONCORDANT_SOURCE_DISCOVERY_NEEDS_NEW_EXTRACTION_PR",
    "SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION",
}


def require(ok: bool, description: str) -> None:
    if not ok:
        raise ValueError("RB3-R5-E7 REFUSED: " + description)


def data(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf8"))


def digest(document: dict[str, Any]) -> str:
    return hashlib.sha256(intake.previous.canonical_bytes(document)).hexdigest()


def check_policy(policy: dict[str, Any]) -> None:
    require(policy["schema_id"] == "NBG-RB3-R5-E7-DUAL-REVIEW-RECONCILIATION",
            "wrong reconciliation protocol")
    require(policy["version"] == "0.1.0" and
            policy["phase"] == "REVIEW_RECONCILIATION_PREPARATION_NOT_ATTESTATION",
            "reconciliation phase changed")
    require(tuple(policy["material_fields"]) == MATERIAL, "material evidence comparison disabled")
    require(set(policy["allowed_states"]) == STATES and
            len(policy["allowed_states"]) == len(STATES),
            "reconciliation statuses changed or duplicated")
    require(set(policy["known_source_only_ids"]) ==
            {"RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"},
            "zero-candidate source requirements changed")
    require(set(policy["special_risks"]) == {"RB2-S008","RB2-S009","RB2-S013"},
            "critical missing-lineage source risks removed")
    require(all(len(x) >= 2 for x in policy["special_risks"].values()),
            "original full-text evidence risks omitted")
    for field, expected in (
        ("approved_rows", 0),
        ("independent_review_attestations", 0),
        ("training_authorized", False),
        ("execution_authorized", False),
    ):
        require(policy[field] == expected and type(policy[field]) is type(expected),
                "review or execution authorization forged: " + field)
    require(policy["human_gate"] and policy["declaration_check"], "human gate bypassed")
    require(policy["input_contract"], "source draft contract missing")


def fulltext_link_is_not_abstract_access(url: str) -> bool:
    p = urlsplit(url)
    host = (p.hostname or "").lower()
    path = p.path.lower()
    return (
        p.scheme == "https"
        and host not in {"pubmed.ncbi.nlm.nih.gov","doi.org","dx.doi.org"}
        and not (host.endswith(".researchgate.net") or host == "researchgate.net")
        and "/doi/abs/" not in path
        and bool(host)
    )


def check_reviewer(document: dict[str, Any]) -> str:
    reviewer = document["reviewer"]
    handle = reviewer["github_handle"]
    require(isinstance(handle,str) and handle.strip(), "reviewer handle declaration missing")
    require(reviewer["is_original_extractor"] is False,
            "declared original extractor not eligible for dual review")
    require(reviewer["identity_verified"] is False, "user-supplied identity falsely authenticated")
    return handle.casefold()


def check_claimed_fulltext_source(document: dict[str, Any]) -> None:
    access = document["source_access"]
    if access["primary_fulltext_checked"]:
        require(access["access_state"] == "FULLTEXT_OBTAINED", "fulltext state discrepancy")
        require(fulltext_link_is_not_abstract_access(access["fulltext_locator"]),
                "abstract or request page presented as inspected primary full text")
        require(access["methods_locator"], "original methods source locator absent")


def forbid_pooled_abstract_promotion(document: dict[str, Any]) -> None:
    sid = document["source_id"]
    for row in document["row_proposals"]:
        if row["proposal"] != "PROPOSE_ELIGIBLE":
            continue
        fig = row["source_figure_or_table"].casefold().strip()
        require(not any(token in fig for token in (
            "abstract", "pubmed", "not_extracted", "unknown", "not available", "pooled result"
        )), "abstract/pooled text masquerades as a primary figure/table")
        comparator = row["control_comparator"].casefold().strip()
        require(not any(token in comparator for token in (
            "unknown", "unspecified", "pooled", "not extracted"
        )), "ambiguous comparator proposed as exact sham comparison")
        require(any(term in comparator for term in (
            "sham", "untreated", "control", "0 mt", "ambient", "nulled"
        )), "no identifiable baseline/reference comparator")
        if sid == "RB2-S008":
            require(not ("3h" in comparator and "6h" in comparator),
                    "S008 exposed-arm comparison wrongly treated as sham")
        if sid == "RB2-S009":
            require("u0126" not in comparator and "mek inhibitor" not in comparator,
                    "S009 inhibitor comparison must not replace baseline control")
        if sid == "RB2-S013":
            require("pooled" not in row["reported_direction_evidence"].casefold(),
                    "S013 pooled null cannot become condition-level evidence")


def identical_material(a: dict[str, Any], b: dict[str, Any]) -> list[str]:
    return [name for name in MATERIAL if a[name] != b[name]]


def reconcile_source(a: dict[str, Any], b: dict[str, Any]) -> dict[str, Any]:
    left = a["source_disposition"]
    right = b["source_disposition"]
    if left == "CONDITIONS_FOUND_PENDING_EXTRACTION" and right == left:
        x = a["new_condition_discovery"]
        y = b["new_condition_discovery"]
        if (x["count"], x["source_evidence_locators"], x["extraction_notes"]) == (
                y["count"], y["source_evidence_locators"], y["extraction_notes"]):
            status = "CONCORDANT_SOURCE_DISCOVERY_NEEDS_NEW_EXTRACTION_PR"
        else:
            status = "SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION"
    elif left != right:
        status = "SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION"
    elif left == "PENDING":
        status = "AWAITING_BOTH_PRIMARY_REVIEWS"
    elif left == "FULLTEXT_UNAVAILABLE":
        status = "AGREED_NEEDS_PRIMARY_TEXT"
    elif left == "NO_CONDITION_LEVEL_EVIDENCE_FOUND":
        status = "AGREED_PROPOSED_REJECTION_NOT_FINAL"
    else:
        status = "SOURCE_DISCOVERY_CONFLICT_REQUIRES_HUMAN_ADJUDICATION"
    return {
        "state":status, "reviewer_a_disposition":left, "reviewer_b_disposition":right,
        "approved_new_condition_rows":0,
    }


def reconcile_pair(a: dict[str, Any], b: dict[str, Any],
                   policy: dict[str, Any] | None = None) -> dict[str, Any]:
    policy = policy if policy is not None else data(POLICY_PATH)
    check_policy(policy)
    left=intake.validate_draft(a)
    right=intake.validate_draft(b)
    require(a["source_id"] == b["source_id"], "different original study IDs")
    require(a["lineage_id"] == b["lineage_id"] and
            a["doi"] == b["doi"] and a["pmid"] == b["pmid"],
            "different frozen study provenance")
    require(a["packet_sha256"] == b["packet_sha256"],
            "reviewers used differing frozen packet hashes")
    h1=check_reviewer(a)
    h2=check_reviewer(b)
    require(h1 != h2, "same declared reviewer cannot count twice")
    check_claimed_fulltext_source(a)
    check_claimed_fulltext_source(b)
    forbid_pooled_abstract_promotion(a)
    forbid_pooled_abstract_promotion(b)
    require(a["independent_review_attested"] is False and
            b["independent_review_attested"] is False, "fake review attestation")
    require(left["fit_eligible_rows"] == right["fit_eligible_rows"] == 0,
            "draft improperly promoted to model input")

    row_comparisons = []
    pairs = list(zip(a["row_proposals"],b["row_proposals"]))
    require(len(pairs) == len(a["row_proposals"]) == len(b["row_proposals"]),
            "candidate rows dropped in reconciliation")
    for l,r in pairs:
        require(l["row_id"] == r["row_id"] and
                l["candidate_row_digest_sha256"] == r["candidate_row_digest_sha256"],
                "candidate row hash or order mismatch")
        lp,rp=l["proposal"],r["proposal"]
        disagreements = []
        if lp != rp:
            status="CONFLICT_REQUIRES_HUMAN_ADJUDICATION"
        elif lp == "PROPOSE_ELIGIBLE":
            disagreements=identical_material(l,r)
            status=("MATERIAL_EVIDENCE_DISAGREEMENT_REQUIRES_HUMAN_ADJUDICATION"
                    if disagreements else "CONCORDANT_UNATTESTED_ELIGIBILITY_PROPOSALS")
        elif lp == "PROPOSE_REJECT":
            status="AGREED_PROPOSED_REJECTION_NOT_FINAL"
        elif lp == "NEEDS_PRIMARY_TEXT":
            status="AGREED_NEEDS_PRIMARY_TEXT"
        else:
            status="AWAITING_BOTH_PRIMARY_REVIEWS"
        row_comparisons.append({
            "row_id":l["row_id"],
            "candidate_row_digest_sha256":l["candidate_row_digest_sha256"],
            "first_proposal":lp,"second_proposal":rp,
            "state":status,
            "disagreed_evidence_fields":disagreements,
            "fit_eligible":False,
        })
    if not row_comparisons:
        source_result=reconcile_source(a,b)
        source_summary=source_result["state"]
    else:
        require(a["source_disposition"] == b["source_disposition"] == "PENDING",
                "row-by-row review with conflicting/approved source-wide disposition")
        source_result=None
        source_summary="ROW_LEVEL_PAIR_COMPARISON_ONLY"

    counts=dict(sorted(Counter(r["state"] for r in row_comparisons).items()))
    return {
        "schema_id":"NBG-RB3-R5-E7-RECONCILIATION-RESULT",
        "status":APPROVAL_BOUNDARY,
        "source_id":a["source_id"],
        "lineage_id":a["lineage_id"],
        "frozen_packet_sha256":a["packet_sha256"],
        "declared_reviewers":[a["reviewer"]["github_handle"],
                              b["reviewer"]["github_handle"]],
        "reviewer_identification_authenticated":False,
        "source_summary":source_summary,
        "source_only_result":source_result,
        "row_comparisons":row_comparisons,
        "comparison_state_counts":counts,
        "first_draft_sha256":left["draft_sha256"],
        "second_draft_sha256":right["draft_sha256"],
        "independently_attested_source_reviews":0,
        "approved_rows":0,
        "new_model_rows":0,
        "training_authorized":False,
        "execution_authorized":False,
        "warning":"Matching declared reviewers and text are NOT authenticated identity, scientific truth, or permission to fit; separate human original-paper/GitHub review required.",
    }


def audit() -> dict[str, Any]:
    policy=data(POLICY_PATH)
    check_policy(policy)
    e6.audit()
    packet=intake.previous.packet()
    require(packet["candidate_rows"]==64 and len(packet["source_queue"])==14,
            "original reviewer packet drift")
    require(packet["reviewed_eligible_rows"]==0 and
            packet["independent_review_attestations"]==0 and
            packet["execution_authorized"] is False,
            "reviewed evidence prematurely admitted")
    for source in packet["source_queue"]:
        template=intake.template_for_source(source["source_id"])
        intake.validate_draft(template)
        require(len(template["row_proposals"])==source["candidate_rows"],
                "review template source row coverage mismatch")
        if source["source_id"] in policy["known_source_only_ids"]:
            require(len(template["row_proposals"])==0,
                    "source-only study unexpectedly has existing candidate rows")
    state=data(R5/"review_decisions.json")
    intake.previous.check_decisions(state)
    require(not (RB3/"FROZEN_ROWS.csv").exists() and
            not (RB3/"REAL_ROWS_FREEZE.json").exists(),
            "unauthorized model input or execution receipt detected")
    return {
        "status":READY,
        "frozen_source_review_templates":14,
        "frozen_candidate_observations":64,
        "source_only_no_candidate_studies":5,
        "unrepresented_lineages":["L005","L006","L010"],
        "actual_dual_reviewer_submissions":0,
        "actual_independent_reviewer_approvals":0,
        "fit_eligible_rows":0,
        "model_execution_authorized":False,
        "protocol_sha256":hashlib.sha256(POLICY_PATH.read_bytes()).hexdigest(),
        "review_packet_sha256":packet["packet_sha256"],
    }


def main() -> int:
    parser=argparse.ArgumentParser()
    choices=parser.add_mutually_exclusive_group(required=True)
    choices.add_argument("--audit",action="store_true")
    choices.add_argument("--compare",nargs=2,type=Path,metavar=("DRAFT_A","DRAFT_B"))
    args=parser.parse_args()
    result=audit() if args.audit else reconcile_pair(data(args.compare[0]),data(args.compare[1]))
    print(json.dumps(result,sort_keys=True,indent=2))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
