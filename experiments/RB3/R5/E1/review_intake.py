#!/usr/bin/env python3
"""RB3-R5-E1 reviewer draft intake. Validates structure, NEVER approves science."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

E1 = Path(__file__).resolve().parent
R5 = E1.parent
sys.path.insert(0, str(R5))
import build_review_packet as previous  # noqa: E402

ACCESS_PATH = E1 / "source_access.json"
SCHEMA_ID = "NBG-RB3-R5-E1-REVIEW-DRAFT"
VERSION = "0.1.0"
DRAFT_CLASS = "STRUCTURAL_REVIEW_DRAFT_VALID_NOT_ATTESTED"
ACCESS_STATES = (
    "NOT_REVIEWED",
    "FULLTEXT_OBTAINED",
    "FULLTEXT_NOT_OBTAINED",
    "FULLTEXT_INCONCLUSIVE",
)
SOURCE_DISPOSITIONS = (
    "PENDING",
    "CONDITIONS_FOUND_PENDING_EXTRACTION",
    "NO_CONDITION_LEVEL_EVIDENCE_FOUND",
    "FULLTEXT_UNAVAILABLE",
    "SOURCE_CONFLICT_NEEDS_ADJUDICATION",
)
ROW_PROPOSALS = ("PENDING", "PROPOSE_ELIGIBLE", "PROPOSE_REJECT", "NEEDS_PRIMARY_TEXT")


def require(condition: bool, description: str) -> None:
    if not condition:
        raise ValueError("RB3-R5-E1 REFUSED: " + description)


def registry() -> dict[str, Any]:
    return previous.json_file(ACCESS_PATH)


def check_registry(packet: dict[str, Any], access: dict[str, Any]) -> dict[str, dict[str, Any]]:
    require(access["registry_id"] == "NBG-RB3-R5-E1-SOURCE-ACCESS", "wrong source-access ledger")
    require(access["version"] == VERSION, "source-access version changed")
    require(access["purpose"] == "reviewer discovery and evidence requests, not model promotion",
            "source-access purpose altered")
    require(access["provenance_warning"], "source-page provenance warning missing")
    by_source = {x["source_id"]:x for x in access["records"]}
    require(len(by_source) == len(access["records"]) == 5, "source-access duplicates/count")
    require(set(by_source) == {"RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"},
            "unknown or missing unresolved source")
    packet_sources = {x["source_id"]:x for x in packet["source_queue"]}
    for sid, source in by_source.items():
        require(sid in packet_sources, "source outside frozen RB2")
        p = packet_sources[sid]
        require(source["lineage_id"] == p["lineage_id"], "source-lineage mismatch")
        require(source["doi"] == p["doi"] and source["pmid"] == p["pmid"], "DOI/PMID drift")
        require(source["priority"] in ("MEDIUM","HIGH","CRITICAL"), "invalid priority")
        require(source["access_status"] in (
            "ABSTRACT_VISIBLE_FULLTEXT_NOT_VERIFIED","ABSTRACT_VISIBLE_FULLTEXT_REQUEST_PAGE",
        ), "source landing page promoted as verified")
        require(source["request_exactly"], "missing evidence requests")
        require(all(link.startswith("https://") for link in source["landing_pages"]),
                "invalid public source URL")
    return by_source


def template_for_source(source_id: str) -> dict[str, Any]:
    packet = previous.packet()
    check_registry(packet, registry())
    by_source = {x["source_id"]:x for x in packet["source_queue"]}
    require(source_id in by_source, "source not in frozen RB2")
    source = by_source[source_id]
    candidates = [r for r in packet["row_queue"] if r["source_id"] == source_id]
    return {
        "schema_id":SCHEMA_ID,
        "version":VERSION,
        "phase":"EVIDENCE_DRAFT_NOT_ATTESTED",
        "packet_sha256":packet["packet_sha256"],
        "source_id":source_id,
        "lineage_id":source["lineage_id"],
        "doi":source["doi"],
        "pmid":source["pmid"],
        "source_risk_flags":source["risk_flags"],
        "reviewer":{
            "github_handle":None,
            "is_original_extractor":None,
            "identity_verified":False,
        },
        "source_access":{
            "access_state":"NOT_REVIEWED",
            "primary_fulltext_checked":False,
            "fulltext_locator":None,
            "methods_locator":None,
            "access_notes":None,
        },
        "source_disposition":"PENDING",
        "row_proposals":[{
            "row_id":row["row_id"],
            "candidate_row_digest_sha256":row["candidate_row_digest_sha256"],
            "proposal":"PENDING",
            "source_figure_or_table":None,
            "assay_exact":None,
            "exposure_window":None,
            "readout_timepoint":None,
            "control_comparator":None,
            "reported_direction_evidence":None,
            "statistical_basis":None,
            "review_notes":None,
        } for row in candidates],
        "new_condition_discovery":{
            "count":0,
            "source_evidence_locators":[],
            "extraction_notes":None,
        },
        "independent_review_attested":False,
        "fit_eligible_rows":0,
        "execution_authorized":False,
    }


def check_keys(data: dict[str, Any], expected: dict[str, Any], label: str) -> None:
    require(set(data) == set(expected), label + " unexpected or missing fields")


def validate_draft(document: dict[str, Any]) -> dict[str, Any]:
    require(isinstance(document,dict), "draft not JSON object")
    require(isinstance(document.get("source_id"), str), "missing source ID")
    expected = template_for_source(document["source_id"])
    check_keys(document, expected, "top level")
    for key in ("schema_id","version","phase","packet_sha256","source_id",
                "lineage_id","doi","pmid","source_risk_flags"):
        require(document[key] == expected[key], "frozen identity or review protocol changed: " + key)
    require(document["independent_review_attested"] is False, "fake independent reviewer attestation")
    require(document["execution_authorized"] is False, "unauthorized model fit")
    require(type(document["fit_eligible_rows"]) is int and document["fit_eligible_rows"] == 0,
            "draft cannot contain eligible-row count")

    reviewer = document["reviewer"]
    require(isinstance(reviewer,dict), "reviewer must be object")
    check_keys(reviewer,expected["reviewer"],"reviewer")
    require(reviewer["identity_verified"] is False, "draft cannot verify identity")
    require(reviewer["is_original_extractor"] in (None,True,False),
            "invalid extractor-independent status")
    if reviewer["github_handle"] is not None:
        require(isinstance(reviewer["github_handle"],str) and
                1 <= len(reviewer["github_handle"].strip()) <= 39 and
                all(ch.isalnum() or ch=="-" for ch in reviewer["github_handle"]),
                "reviewer handle format invalid")

    access = document["source_access"]
    require(isinstance(access,dict), "source-access must be object")
    check_keys(access,expected["source_access"],"source access")
    require(access["access_state"] in ACCESS_STATES, "invalid fulltext access state")
    require(type(access["primary_fulltext_checked"]) is bool, "invalid fulltext flag")
    if access["primary_fulltext_checked"]:
        require(access["access_state"] == "FULLTEXT_OBTAINED",
                "fulltext checked but access status not obtained")
        require(isinstance(access["fulltext_locator"],str) and
                access["fulltext_locator"].startswith("https://"),
                "claimed fulltext lacks retrievable document URL")
        require(isinstance(access["methods_locator"],str) and
                len(access["methods_locator"].strip()) >= 4,
                "primary methods page/section missing")
    if access["access_state"] == "FULLTEXT_OBTAINED":
        require(access["primary_fulltext_checked"] is True,
                "fulltext claimed obtained but not checked")
    if access["access_state"] in ("FULLTEXT_NOT_OBTAINED","FULLTEXT_INCONCLUSIVE"):
        require(access["primary_fulltext_checked"] is False,
                "unavailable/inconclusive text claimed checked")
    for k in ("fulltext_locator","methods_locator","access_notes"):
        require(access[k] is None or isinstance(access[k],str), "invalid source access note")

    disposition = document["source_disposition"]
    require(disposition in SOURCE_DISPOSITIONS,"invalid source disposition")
    discoveries = document["new_condition_discovery"]
    require(isinstance(discoveries,dict), "new condition discovery must be object")
    check_keys(discoveries,expected["new_condition_discovery"],"new condition discovery")
    require(type(discoveries["count"]) is int and discoveries["count"] >= 0,
            "invalid discovery count")
    require(isinstance(discoveries["source_evidence_locators"],list) and
            all(isinstance(x,str) and x.strip() for x in discoveries["source_evidence_locators"]),
            "invalid new-condition source locators")
    require(discoveries["extraction_notes"] is None or isinstance(discoveries["extraction_notes"],str),
            "invalid extraction notes")
    if disposition == "CONDITIONS_FOUND_PENDING_EXTRACTION":
        require(access["primary_fulltext_checked"] is True,
                "new conditions require checked primary fulltext")
        require(discoveries["count"] > 0 and
                len(discoveries["source_evidence_locators"]) >= discoveries["count"] and
                isinstance(discoveries["extraction_notes"],str) and
                len(discoveries["extraction_notes"].strip()) >= 12,
                "new conditions need exact evidence and explanation")
    elif disposition == "FULLTEXT_UNAVAILABLE":
        require(access["access_state"] == "FULLTEXT_NOT_OBTAINED",
                "unavailable disposition needs unavailable access state")
    elif disposition == "NO_CONDITION_LEVEL_EVIDENCE_FOUND":
        require(access["primary_fulltext_checked"] is True,
                "cannot declare no eligible conditions without fulltext")
        require(discoveries["count"] == 0,
                "inconsistent source disposition")

    rows = document["row_proposals"]
    require(isinstance(rows,list), "row proposals must be list")
    require(len(rows) == len(expected["row_proposals"]), "row omitted or invented")
    proposed = 0
    for current, baseline in zip(rows,expected["row_proposals"]):
        require(isinstance(current,dict), "row proposal must be object")
        check_keys(current, baseline, "row proposal")
        for key in ("row_id","candidate_row_digest_sha256"):
            require(current[key] == baseline[key], "candidate ID or SHA-256 changed: "+key)
        action = current["proposal"]
        require(action in ROW_PROPOSALS,"unapproved row disposition")
        if action != "PENDING":
            require(isinstance(current["review_notes"],str) and
                    len(current["review_notes"].strip()) >= 12,
                    "decision proposal requires explanation")
        if action == "PROPOSE_ELIGIBLE":
            proposed += 1
            require(access["primary_fulltext_checked"] is True,
                    "eligibility proposal requires fulltext check")
            require(reviewer["is_original_extractor"] is False and
                    reviewer["github_handle"] is not None,
                    "eligibility proposal needs declared distinct reviewer")
            for field in (
                "source_figure_or_table","assay_exact","exposure_window",
                "readout_timepoint","control_comparator",
                "reported_direction_evidence","statistical_basis",
            ):
                require(isinstance(current[field],str) and len(current[field].strip()) >= 4,
                        "eligibility proposal missing "+field)
            require(disposition != "FULLTEXT_UNAVAILABLE",
                    "unavailable fulltext contradicts eligibility proposal")
        for key in (
            "source_figure_or_table","assay_exact","exposure_window",
            "readout_timepoint","control_comparator",
            "reported_direction_evidence","statistical_basis","review_notes",
        ):
            require(current[key] is None or isinstance(current[key],str),
                    "invalid row evidence field: "+key)
    if proposed:
        require(disposition != "NO_CONDITION_LEVEL_EVIDENCE_FOUND",
                "source marked with no evidence but rows proposed eligible")
    return {
        "status":DRAFT_CLASS,
        "source_id":document["source_id"],
        "candidate_rows_checked":len(rows),
        "unapproved_eligibility_proposals":proposed,
        "independent_review_attested":False,
        "fit_eligible_rows":0,
        "execution_authorized":False,
        "notice":"Structural consistency only. GitHub approval + independent primary fulltext adjudication remain separate.",
        "draft_sha256":previous.sha256(previous.canonical_bytes(document)),
    }


def audit() -> dict[str, Any]:
    packet = previous.packet()
    access = registry()
    by_source = check_registry(packet,access)
    for entry in packet["source_queue"]:
        sample = template_for_source(entry["source_id"])
        result = validate_draft(sample)
        require(result["candidate_rows_checked"] == entry["candidate_rows"], "source packet incomplete")
    return {
        "status":"PASS_RB3_R5_E1_INTAKE_READINESS_NOT_ATTESTED",
        "source_templates":len(packet["source_queue"]),
        "candidate_rows_available_for_review":len(packet["row_queue"]),
        "unresolved_access_requests":len(by_source),
        "independent_reviews_completed":0,
        "model_run_authorized":False,
        "source_access_sha256":previous.sha256(ACCESS_PATH.read_bytes()),
        "review_packet_sha256":packet["packet_sha256"],
    }


def main() -> int:
    parser=argparse.ArgumentParser()
    selection=parser.add_mutually_exclusive_group(required=True)
    selection.add_argument("--audit",action="store_true")
    selection.add_argument("--source",type=str)
    selection.add_argument("--validate",type=Path)
    args=parser.parse_args()
    if args.audit:
        result=audit()
    elif args.source:
        result=template_for_source(args.source)
    else:
        result=validate_draft(previous.json_file(args.validate))
    print(json.dumps(result,indent=2,sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
