#!/usr/bin/env python3
"""RB3-R4 admissibility audit. Source-only records never become model rows."""
from __future__ import annotations

import csv
import hashlib
import json
from collections import Counter
from pathlib import Path

R4 = Path(__file__).resolve().parent
RB3 = R4.parent
RB2 = RB3.parent / "RB2"
CANDIDATES = (
    ("R0/candidate_rows.csv", 9),
    ("R1/additional_rows.csv", 18),
    ("R2/additional_rows.csv", 29),
    ("R3/additional_rows.csv", 8),
)
EVIDENCE_PATHS = (
    "R0/row_evidence.json",
    "R1/source_evidence.json",
    "R2/source_evidence.json",
    "R3/source_evidence.json",
)
EXPECTED_UNEXTRACTED = {
    "RB2-S005", "RB2-S007", "RB2-S008", "RB2-S009", "RB2-S013"
}
EXPECTED_MISSING_LINEAGES = {"L005", "L006", "L010"}
EXPECTED_L005_L006_L010 = {
    "RB2-S008":"L005", "RB2-S009":"L006", "RB2-S013":"L010"
}
BLOCKED_CLASS = "BLOCKED_RB3_REAL_FIT_SOURCE_EVIDENCE_INCOMPLETE"
MANIFEST_DIGEST = "2a91f27c113fb4ae3b63ec8bfad2b2c1c99e84417bd5f3e095c803b9e4c4e351"


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path):
    with path.open(encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        return tuple(reader.fieldnames or ()), list(reader)


def validate_study_register(register, studies, represented):
    source_ids = [s["source_id"] for s in register["sources"]]
    assert len(source_ids) == len(set(source_ids)) == 5, "source register duplicate or missing"
    assert set(source_ids) == EXPECTED_UNEXTRACTED, "unresolved studies drift"
    assert register["status"] == "SOURCE_LEVEL_EVIDENCE_ONLY"
    assert register["row_count_added"] == 0, "source summaries must not mint model rows"
    assert register["evidence_grade"] == "PRIMARY_STUDY_ABSTRACT"
    assert register["source_set_frozen"] is True

    for entry in register["sources"]:
        sid = entry["source_id"]
        source = studies[sid]
        assert sid not in represented, "unresolved source already represented as candidate"
        assert entry["lineage_id"] == source["lineage"], "lineage drift"
        assert entry["pmid"] == source["pmid"], "PMID mismatch"
        assert entry["doi"] == source["doi"], "DOI mismatch"
        assert entry["eligible_for_model_freeze"] is False, "unreviewed source promoted"
        assert entry["url"].startswith("https://pubmed.ncbi.nlm.nih.gov/"), "wrong primary bibliographic source"
        assert entry["missing_for_admission"], "source lacks explicit blocker"
        assert entry["comparison_facts"], "missing cited claims"
        assert entry["caution"], "missing pooled-data limitation"
        assert all("per_arm_assignment" in fact for fact in entry["comparison_facts"])
        assert all(fact["per_arm_assignment"] not in ("VERIFIED", "EXACT_PER_ARM")
                   for fact in entry["comparison_facts"]), "pooled claims promoted to measured row"

    l005 = next(s for s in register["sources"] if s["source_id"] == "RB2-S008")
    assert l005["nominal_stimulus"]["durations_hours"] == [3, 6]
    assert l005["nominal_stimulus"]["frequency_hz"] == 50
    assert l005["nominal_stimulus"]["amplitude_tesla"] == 0.01
    assert any("BETWEEN_EXPOSURE_ARMS" in fact["direction"] for fact in l005["comparison_facts"])
    assert any("NULL_LATE" == fact["direction"] for fact in l005["comparison_facts"])

    l006 = next(s for s in register["sources"] if s["source_id"] == "RB2-S009")
    assert l006["nominal_stimulus"]["frequency_hz"] == 15
    assert l006["nominal_stimulus"]["amplitude_tesla"] == 0.001
    assert l006["nominal_stimulus"]["durations_hours"] is None, "unreported duration invented"

    l010 = next(s for s in register["sources"] if s["source_id"] == "RB2-S013")
    field = l010["nominal_stimulus"]
    assert field["frequency_hz"] == 50
    assert field["amplitude_tesla_rms_for_vertical_regime"] == 0.000006
    assert field["durations_days"] == [1,4,7,21]
    assert set(field["other_regimes"]) == {
        "ambient laboratory","nulled field","Ca2+ ion-cyclotron-resonance regime at 50 Hz"
    }, "regime conflation"
    assert l010["comparison_facts"][0]["per_arm_assignment"] == "NOT_RESOLVED"
    for sid,lin in EXPECTED_L005_L006_L010.items():
        assert studies[sid]["lineage"] == lin, "missing-lineage mapping drift"


def validate_admission_policy(policy):
    assert policy["status"] == "READINESS_ONLY_NO_TRAINING"
    frozen = policy["immutable_inherited"]
    assert frozen["rb2_source_count"] == 14
    assert frozen["rb2_lineage_count"] == 11
    assert frozen["rb2_manifest_digest_sha256"] == MANIFEST_DIGEST
    auth = policy["authorization"]
    for key in (
        "candidate_csvs_are_never_fit_ready",
        "independent_review_required",
        "machine_readable_row_evidence_required",
        "reviewers_must_be_independent_of_original_extractor",
        "no_model_fit_in_pr",
        "no_imputation_at_extraction",
        "no_automatic_pooled_claim_promotion",
    ):
        assert auth[key] is True, f"admission boundary removed: {key}"
    assert auth["execution_authorized"] is False
    assert auth["all_extraction_review_statuses"] == "PENDING"
    assert "REVIEWED_ELIGIBLE" in policy["classes"]
    assert "SOURCE_ONLY_BLOCKED" in policy["classes"]
    assert "VOID_INSUFFICIENT_CORPUS" in policy["classes"]
    assert "NOT_EXTRAPOLATED_FROM_POOLED_SUMMARY" in policy["promotion_contract"]["per_row"]
    assert "NO_EMPTY_LINEAGE_TEST_FOLD" in policy["promotion_contract"]["entire_corpus"]
    assert "IF_LESS_THAN_11_HOLDOUT_CAPABLE_LINEAGES_AFTER_REVIEW_FLAG_VOID" in policy["stop_conditions"]


def audit():
    manifest = read_json(RB2 / "corpus_manifest.json")
    schema = read_json(RB2 / "extraction_schema.json")
    context = read_json(RB2 / "context_registry.json")
    register = read_json(R4 / "unresolved_studies.json")
    policy = read_json(R4 / "admission_policy.json")

    studies = {s["id"]:s for s in manifest["records"]}
    assert len(studies) == 14 and manifest["source_count"] == 14
    assert len({s["lineage"] for s in studies.values()}) == 11
    assert manifest["lineage_count"] == 11
    assert context["model_input"] is False, "mechanism-context contamination"
    digest_payload = "".join(s["record_digest_sha256"] + "\n" for s in manifest["records"])
    assert hashlib.sha256(digest_payload.encode()).hexdigest() == MANIFEST_DIGEST, "RB2 manifest hash drift"
    assert manifest["manifest_digest_sha256"] == MANIFEST_DIGEST
    assert manifest["split_policy"]["type"] == "GROUPED_5_FOLD_LINEAGE_CROSS_VALIDATION"

    all_rows = []
    schema_columns = tuple(schema["required_fields"])
    for relative,n in CANDIDATES:
        columns, rows = read_csv(RB3 / relative)
        assert columns == schema_columns, "frozen schema drift"
        assert len(rows) == n, "prior rung count changed"
        all_rows.extend(rows)
    assert len(all_rows) == 64
    ids = [r["row_id"] for r in all_rows]
    assert len(set(ids)) == len(ids), "candidate row ID collision"

    for row in all_rows:
        sid = row["source_id"]
        assert sid in studies, "new source outside RB2 freeze"
        assert row["lineage_id"] == studies[sid]["lineage"], "candidate/source lineage mismatch"
        assert row["reported_direction"] in ("INCREASE", "DECREASE", "NULL"), "non-frozen target class"
        assert row["source_locator"], "missing source"
        assert row["value_origin"] in schema["enums"]["value_origin"]
    represented = set(r["source_id"] for r in all_rows)
    assert len(represented) == 9, "represented paper count drift"
    lineages = set(r["lineage_id"] for r in all_rows)
    assert len(lineages) == 8, "represented lineage count drift"
    missing_sources = set(studies) - represented
    missing_lineages = {s["lineage"] for s in studies.values()} - lineages
    assert missing_sources == EXPECTED_UNEXTRACTED
    assert missing_lineages == EXPECTED_MISSING_LINEAGES

    # Candidate validators do not grant independent full-text confirmation.
    evidence_receipts = [read_json(RB3 / p) for p in EVIDENCE_PATHS]
    assert evidence_receipts[0]["status"] == "PARTIAL_SOURCE_BACKED"
    assert len(evidence_receipts[0]["records"]) == 9
    assert evidence_receipts[1]["review_status"] == "CANDIDATE_PENDING_INDEPENDENT_REVIEW"
    assert evidence_receipts[2]["review_status"] == "CANDIDATE_PENDING_INDEPENDENT_REVIEW"
    assert evidence_receipts[3]["review_status"] == "NEEDS_PRIMARY_FULLTEXT_PER_ARM_VERIFICATION"
    assert all(rec["eligible_for_model_freeze"] is False
               for rec in evidence_receipts[3]["records"])
    assert sum(len(e["records"]) for e in evidence_receipts) == 64
    validate_study_register(register, studies, represented)
    validate_admission_policy(policy)
    assert not (RB3 / "FROZEN_ROWS.csv").exists(), "unapproved model rows committed"
    assert not (RB3 / "REAL_ROWS_FREEZE.json").exists(), "unapproved execution authorization"

    return {
        "status":"PASS_RB3_R4_SOURCE_ADMISSIBILITY_AUDIT",
        "result_classification":BLOCKED_CLASS,
        "frozen_rb2_sources":len(studies),
        "frozen_rb2_lineages":11,
        "candidate_rows":len(all_rows),
        "candidate_sources":len(represented),
        "candidate_lineages":len(lineages),
        "unrepresented_sources":sorted(missing_sources),
        "unrepresented_lineages":sorted(missing_lineages),
        "new_fit_eligible_rows":0,
        "independently_reviewed_source_rows_confirmed":0,
        "real_model_execution_authorized":False,
        "source_registry_sha256":hashlib.sha256((R4/"unresolved_studies.json").read_bytes()).hexdigest(),
        "admission_policy_sha256":hashlib.sha256((R4/"admission_policy.json").read_bytes()).hexdigest(),
    }

if __name__ == "__main__":
    print(json.dumps(audit(),sort_keys=True,indent=2))
