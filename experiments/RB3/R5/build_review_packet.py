#!/usr/bin/env python3
"""Deterministic, read-only RB3-R5 reviewer packet. NEVER trains or attests."""
from __future__ import annotations

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
RB3 = ROOT.parent
RB2 = RB3.parent / "RB2"
PROTOCOL = ROOT / "review_protocol.json"
DECISIONS = ROOT / "review_decisions.json"
EVIDENCE_FILES = (
    "R0/row_evidence.json",
    "R1/source_evidence.json",
    "R2/source_evidence.json",
    "R3/source_evidence.json",
)
RB2_MANIFEST_DIGEST = "2a91f27c113fb4ae3b63ec8bfad2b2c1c99e84417bd5f3e095c803b9e4c4e351"
BLOCK_CLASS = "BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW"
MODEL_FIELDS = (
    "frequency_hz", "amplitude_value_si", "exposure_duration_s",
    "repeated_exposure_count", "field_type", "waveform",
    "geometry_or_orientation", "system_class", "species",
    "sample_class", "endpoint_class", "bubble_from", "bubble_to",
)


def require(ok: bool, message: str) -> None:
    if not ok:
        raise ValueError("RB3-R5 CONTRACT: " + message)


def json_file(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def csv_file(path: Path) -> tuple[tuple[str, ...], list[dict[str, str]]]:
    with path.open(encoding="utf-8", newline="") as stream:
        reader = csv.DictReader(stream)
        columns = tuple(reader.fieldnames or ())
        return columns, list(reader)


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def canonical_bytes(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def check_protocol(protocol: dict[str, Any], manifest: dict[str, Any]) -> None:
    require(protocol["phase"] == "REVIEW_PREPARATION_ONLY", "wrong phase")
    require(protocol["version"] == "0.1.0", "version changed")
    inherited = protocol["inherited"]
    require(inherited["frozen_source_count"] == 14, "source count changed")
    require(inherited["frozen_lineage_count"] == 11, "lineage count changed")
    require(inherited["corpus_digest_sha256"] == RB2_MANIFEST_DIGEST, "corpus digest changed")
    require(inherited["candidate_expected_counts"] == [9, 18, 29, 8], "candidate counts changed")
    require(inherited["expected_candidate_rows"] == 64, "row count changed")
    require(inherited["expected_candidate_sources"] == 9, "candidate source count changed")
    require(inherited["expected_candidate_lineages"] == 8, "candidate lineage count changed")
    require(set(protocol["review_cases"]) == {x["id"] for x in manifest["records"]}, "risk review register missing sources")
    require(all(x["risk"] and x["priority"] in ("MEDIUM", "HIGH", "CRITICAL")
                for x in protocol["review_cases"].values()), "missing risk or priority")
    constraints = protocol["constraints"]
    for field in (
        "this_rung_has_no_human_review_attestation",
        "no_automatic_review_status_upgrade",
        "no_source_set_or_fold_change",
        "no_model_training",
        "no_final_frozen_rows",
    ):
        require(constraints.get(field) is True, field + " disabled")
    require(constraints["execution_authorized"] is False, "execution approved by protocol")
    require(constraints["reviewed_row_count"] == 0, "imaginary reviewed row count")
    require("REVIEWED_ELIGIBLE" in protocol["outcome_classes"], "missing reviewed class")
    require("SOURCE_UNAVAILABLE" in protocol["outcome_classes"], "missing unavailable class")
    require(any("independently" in s.lower() for s in protocol["conditions_for_reviewed_eligible"]),
            "independent review rule absent")


def check_decisions(decisions: dict[str, Any]) -> None:
    require(decisions["schema_id"] == "NBG-RB3-R5-ADJUDICATION-LEDGER", "wrong adjudication schema")
    require(decisions["phase"] == "UNREVIEWED_INITIAL_STATE", "R5 ledger misrepresented as reviewed")
    require(decisions["current_status"] == "AWAITING_INDEPENDENT_SOURCE_REVIEW", "review status forged")
    for field in ("independent_reviewer_attestations", "source_decisions", "row_decisions"):
        require(decisions.get(field) == [], "unreviewed R5 cannot contain " + field)
    require(decisions["reviewed_eligible_row_count"] == 0, "fake eligible count")
    require(decisions["authorized_training_dataset"] is False, "training improperly authorized")
    require(decisions["execution_authorized"] is False, "execution improperly authorized")


def checked_evidence(row: dict[str, str], entry: dict[str, Any], rung: int) -> tuple[str, list[str]]:
    """Return evidence class/extra blockers, not an assertion of scientific truth."""
    extras: list[str] = []
    if rung == 0:
        require(entry["reference"] == row["source_locator"], "R0 provenance locator mismatch")
        require(entry["figure"] in ("Figure 3B", "Figure 3C", "Figure 3G"), "R0 figure mismatch")
        ptext = str(entry["p_vs_sham"])
        if ptext.startswith("<"):
            significant = float(ptext[1:]) <= 0.05
        else:
            significant = float(ptext) < 0.05
        require(row["reported_significance"] == ("SIGNIFICANT" if significant else "NOT_SIGNIFICANT"),
                "R0 figure significance disagrees with row")
        require(row["reported_direction"] == ("INCREASE" if significant else "NULL"),
                "R0 figure outcome disagrees with row")
        require(entry["n"] > 0 and entry["assay"], "R0 quantitative receipt missing")
        return "FIGURE_LEVEL_SOURCE_ATTRIBUTION", extras

    locator_key = {
        1:"reported_figure_reference",
        2:"evidence_locator",
        3:"source_url",
    }[rung]
    require(entry["source_id"] == row["source_id"], "row source mismatches receipt")
    require(entry[locator_key] == row["source_locator"], "evidence locator mismatch")
    require(entry["reported_direction"] == row["reported_direction"], "outcome label mismatches evidence receipt")
    require(entry["reported_significance"] == row["reported_significance"], "significance mismatches evidence receipt")

    if rung == 1:
        require(entry["exact_p_value"] == "NOT_EXTRACTED", "R1 p-value unexpectedly changed")
        require(entry["raw_mean"] == "NOT_EXTRACTED", "R1 raw mean unexpectedly changed")
        extras.append("EXACT_NUMERIC_STATISTICS_NOT_EXTRACTED")
        return "PRIMARY_TEXT_ATTRIBUTION_UNREVIEWED", extras
    if rung == 2:
        require(entry["per_arm_p_value"] == "NOT_EXTRACTED", "R2 p-value unexpectedly changed")
        require(entry["mean"] == "NOT_EXTRACTED", "R2 mean unexpectedly changed")
        extras.append("EXACT_NUMERIC_STATISTICS_NOT_EXTRACTED")
        if row["source_id"] == "RB2-S011":
            extras.append("ABSTRACT_POOLED_NO_EFFECT_NEEDS_PER_ARM_VERIFICATION")
        return "SOURCE_ATTRIBUTION_UNREVIEWED", extras

    require(entry["independent_review"] == "PENDING", "R3 false independent review")
    require(entry["eligible_for_model_freeze"] is False, "R3 source wrongly admitted")
    require(entry["exact_p_value"] == "NOT_EXTRACTED", "R3 p-value unexpectedly changed")
    require(entry["effect_size"] == "NOT_EXTRACTED", "R3 effect unexpectedly changed")
    extras.extend(["ABSTRACT_ONLY_OR_POOLED", "MUST_REVIEW_EXACT_ARM_AND_CONTROL"])
    return "PROVISIONAL_ABSTRACT_ATTRIBUTION", extras


def packet() -> dict[str, Any]:
    protocol = json_file(PROTOCOL)
    decisions = json_file(DECISIONS)
    manifest = json_file(RB2 / "corpus_manifest.json")
    schema = json_file(RB2 / "extraction_schema.json")
    context = json_file(RB2 / "context_registry.json")
    source_map = {s["id"]: s for s in manifest["records"]}

    require(len(source_map) == 14 and manifest["lineage_count"] == 11, "RB2 manifest drift")
    require(context["model_input"] is False, "context sources promoted")
    check_protocol(protocol, manifest)
    check_decisions(decisions)
    digest = sha256("".join(s["record_digest_sha256"] + "\n" for s in manifest["records"]).encode())
    require(digest == RB2_MANIFEST_DIGEST, "RB2 canonical source digest drift")
    require(manifest["manifest_digest_sha256"] == digest, "RB2 declared digest drift")

    r4 = json_file(RB3 / "R4" / "admission_policy.json")
    require(r4["authorization"]["execution_authorized"] is False, "R4 authorized training")
    require(r4["authorization"]["independent_review_required"] is True, "independent review rule changed")
    require(not (RB3 / "FROZEN_ROWS.csv").exists(), "R5 cannot have frozen training data")
    require(not (RB3 / "REAL_ROWS_FREEZE.json").exists(), "R5 cannot have execution receipt")
    require(not set(MODEL_FIELDS) & {"source_id","lineage_id","reported_direction","source_locator"},
            "source identity in predictors")

    all_rows: list[dict[str, str]] = []
    row_packet: list[dict[str, Any]] = []
    candidate_digests: dict[str, str] = {}
    evidence_digests: dict[str, str] = {}
    ids: set[str] = set()
    reviews: Counter[str] = Counter()
    coarse_labels: dict[tuple[str, ...], set[str]] = defaultdict(set)

    for rung,(relative,expected_n) in enumerate(zip(
            protocol["inherited"]["candidate_files"],
            protocol["inherited"]["candidate_expected_counts"])):
        path = RB3 / relative
        columns, rows = csv_file(path)
        require(tuple(schema["required_fields"]) == columns, "RB2 extraction schema drift")
        require(len(rows) == expected_n, "candidate count drift " + relative)
        candidate_digests[relative] = sha256(path.read_bytes())
        evidence_path = RB3 / EVIDENCE_FILES[rung]
        evidence = json_file(evidence_path)
        evidence_digests[EVIDENCE_FILES[rung]] = sha256(evidence_path.read_bytes())
        receipts = evidence["records"]
        evidence_index = {e["row_id"]: e for e in receipts}
        require(len(evidence_index) == len(receipts), "duplicate evidence IDs")
        require(set(evidence_index) == {r["row_id"] for r in rows}, "missing/extra evidence IDs")

        for row in rows:
            rowid = row["row_id"]
            sourceid = row["source_id"]
            require(rowid not in ids, "duplicate row ID across rungs")
            ids.add(rowid)
            require(sourceid in source_map, "candidate from non-RB2 paper")
            require(row["lineage_id"] == source_map[sourceid]["lineage"], "candidate lineage mismatch")
            require(row["reported_direction"] in ("INCREASE","DECREASE","NULL"), "unexpected target class")
            require(row["endpoint_class"] in schema["enums"]["endpoint_class"], "invalid endpoint class")
            require(row["source_locator"], "missing source locator")
            kind, flags = checked_evidence(row, evidence_index[rowid], rung)
            case = protocol["review_cases"][sourceid]
            reviews[sourceid] += 1
            coarse_labels[tuple(row[x] for x in MODEL_FIELDS)].add(row["reported_direction"])
            row_packet.append({
                "row_id":rowid, "source_id":sourceid,
                "lineage_id":row["lineage_id"],
                "doi":source_map[sourceid]["doi"],
                "source_locator":row["source_locator"],
                "endpoint":row["endpoint_class"],
                "frequency_hz":row["frequency_hz"],
                "amplitude_original":row["amplitude_original"],
                "source_attribution_class":kind,
                "review_status":"PENDING_INDEPENDENT_REVIEW",
                "fit_eligible":False,
                "blocking_flags":sorted(set(case["risk"] + flags)),
                "candidate_row_digest_sha256":sha256(canonical_bytes(row)),
            })
            all_rows.append(row)

    require(len(all_rows) == 64, "expected 64 source-attributed candidates")
    require(len(reviews) == 9, "expected nine candidate source papers")
    lineages = {s["lineage"] for s in source_map.values()}
    represented = {r["lineage_id"] for r in all_rows}
    require(len(represented) == 8, "expected eight represented lineages")
    missing = sorted(lineages - represented)
    require(missing == ["L005","L006","L010"], "missing lineage set drift")
    for sid in source_map:
        if sid not in reviews:
            require("NO_CANDIDATE_ROWS" in protocol["review_cases"][sid]["risk"],
                    "unrepresented source not flagged")

    priority_rank = {"CRITICAL":0,"HIGH":1,"MEDIUM":2}
    source_queue = []
    for sid, source in sorted(source_map.items()):
        case = protocol["review_cases"][sid]
        source_queue.append({
            "source_id":sid,
            "lineage_id":source["lineage"],
            "doi":source["doi"], "pmid":source["pmid"],
            "citation_url":"https://pubmed.ncbi.nlm.nih.gov/" + source["pmid"] + "/",
            "priority":case["priority"],
            "risk_flags":case["risk"],
            "candidate_rows":reviews[sid],
            "review_status":"PENDING_INDEPENDENT_REVIEW",
            "source_outcome": "NO_ADMISSIBLE_ROWS_VERIFIED",
        })
    source_queue.sort(key=lambda item:(priority_rank[item["priority"]],item["source_id"]))

    report = {
        "protocol":"NBG-RB3-R5",
        "version":"0.1.0",
        "status":BLOCK_CLASS,
        "review_status":"UNREVIEWED_PENDING_INDEPENDENT_FULLTEXT",
        "frozen_sources":len(source_map),
        "frozen_lineages":len(lineages),
        "candidate_rows":len(all_rows),
        "candidate_papers":len(reviews),
        "candidate_lineages":len(represented),
        "missing_candidate_lineages":missing,
        "reviewed_eligible_rows":0,
        "independent_review_attestations":0,
        "coarse_feature_collision_groups_with_opposing_labels":sum(len(x)>1 for x in coarse_labels.values()),
        "execution_authorized":False,
        "candidate_sha256":candidate_digests,
        "evidence_sha256":evidence_digests,
        "source_queue":source_queue,
        "row_queue":row_packet,
        "warning":"Machine-generated evidence inventory is not independent full-text adjudication and cannot authorize fitting.",
    }
    report["packet_sha256"] = sha256(canonical_bytes(report))
    return report


def main() -> int:
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--audit",action="store_true")
    mode.add_argument("--packet",action="store_true")
    args=parser.parse_args()
    output=packet()
    if args.audit:
        output={k:v for k,v in output.items() if k not in ("source_queue","row_queue")}
    print(json.dumps(output,indent=2,sort_keys=True))
    return 0


if __name__=="__main__":
    raise SystemExit(main())
