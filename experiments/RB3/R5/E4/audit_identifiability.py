#!/usr/bin/env python3
"""Static identifiability audit of the 64 RB3 source-attributed candidates.

Reports opposing labels for IDENTICAL FROZEN model inputs, without adding features,
running a model, approving a reviewer, or inferring a physical mechanism.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
RB3 = ROOT.parents[1]
R5 = ROOT.parent
sys.path.insert(0, str(R5))
import build_review_packet as reviewed_packet  # noqa: E402

E3 = R5 / "E3"
sys.path.insert(0, str(E3))
import audit_timing as timing_audit  # noqa: E402

CASEBOOK_PATH = ROOT / "collision_casebook.json"
BLOCK_STATUS = "RB3_COARSE_FEATURE_NONIDENTIFIABILITY_UNATTESTED"
EXPECTED_CASES = {
    "C1_NEURON_VS_ASTROCYTE_DIFFERENTIATION":(
        "RB2-S002",
        ("RB3R1-S002-03","RB3R1-S002-04"),
        ("INCREASE","NULL"),
        ("ASSAY_CELL_MARKER","POST_EXPOSURE_READOUT_DELAY"),
    ),
    "C2_TUJ1_VS_GFAP_TRANSCRIPTION":(
        "RB2-S002",
        ("RB3R1-S002-05","RB3R1-S002-06"),
        ("INCREASE","NULL"),
        ("GENE_TARGET_IDENTITY",),
    ),
    "C3_NEURITE_LENGTH_COUNT_BRANCHES":(
        "RB2-S002",
        ("RB3R1-S002-07","RB3R1-S002-08","RB3R1-S002-09"),
        ("INCREASE","NULL","INCREASE"),
        ("ASSAY_MORPHOMETRIC_SUBTYPE",),
    ),
    "C4_2014_DIFFERENT_NEURONAL_TRANSCRIPTS":(
        "RB2-S003",
        ("RB3R1-S003-13","RB3R1-S003-14","RB3R1-S003-15"),
        ("INCREASE","DECREASE","INCREASE"),
        ("GENE_TARGET_IDENTITY","ASSAY_TIMEPOINT_NOT_CONFIRMED"),
    ),
}
REQUIRED_BLOCKS = {
    "SOURCE_ATTRIBUTION_IS_NOT_INDEPENDENT_REVIEW",
    "EXACT_PREDICTOR_VECTOR_COLLISION_DIAGNOSTIC_ONLY",
    "DO_NOT_ADD_ANALYTE_IDENTITY_TO_FROZEN_RB3_MODEL",
    "DO_NOT_ADD_POST_EXPOSURE_TIME_TO_FROZEN_RB3_MODEL",
    "DO_NOT_DROP_CONFLICTING_ROWS_TO_IMPROVE_SCORE",
    "DO_NOT_LABEL_NULL_AS_BIOLOGICAL_EQUIVALENCE",
    "NO_REAL_MODEL_EXECUTION",
}


def require(ok: bool, reason: str) -> None:
    if not ok:
        raise ValueError("RB3-R5-E4 REFUSED: " + reason)


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def read_rows() -> list[dict[str, str]]:
    protocol = read_json(R5 / "review_protocol.json")
    inherited = protocol["inherited"]
    rows: list[dict[str, str]] = []
    for rel, expected_count in zip(inherited["candidate_files"], inherited["candidate_expected_counts"]):
        cols, file_rows = reviewed_packet.csv_file(RB3 / rel)
        require(len(cols) == 27, "candidate columns changed")
        require(len(file_rows) == expected_count, "earlier candidate count changed")
        rows += file_rows
    require(len(rows) == 64, "candidate counts must remain 64")
    return rows


def feature_groups(rows: list[dict[str, str]]) -> dict[tuple[str, ...], list[dict[str, str]]]:
    groups: dict[tuple[str, ...], list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        key = tuple(row[field] for field in reviewed_packet.MODEL_FIELDS)
        groups[key].append(row)
    return groups


def conflicting_groups(groups: dict[tuple[str, ...], list[dict[str, str]]]) -> list[list[dict[str, str]]]:
    conflicts = [
        group for group in groups.values()
        if len({row["reported_direction"] for row in group}) > 1
    ]
    return sorted(conflicts, key=lambda group: sorted(r["row_id"] for r in group))


def check_casebook(casebook: dict[str, Any], rows: list[dict[str, str]],
                   primary_timing: dict[str, Any]) -> dict[str, Any]:
    require(casebook["registry_id"] == "NBG-RB3-R5-E4-COARSE-PREDICTOR-CONTRADICTIONS",
            "casebook registry ID changed")
    require(casebook["status"] == "SOURCE_ATTRIBUTED_CANDIDATE_DIAGNOSTIC_UNATTESTED",
            "casebook promoted to scientific approval")
    require(casebook["version"] == "0.1.0", "version changed")
    require(casebook["review_status"]["independent_review_attestations"] == [],
            "forged independent reviewer")
    require(casebook["review_status"]["fit_eligible_rows"] == 0,
            "forged eligible-row count")
    require(casebook["review_status"]["model_execution_authorized"] is False,
            "model run authorized by descriptive casebook")
    require(casebook["review_status"]["classification"] == "DIAGNOSTIC_ONLY_REVIEW_REQUIRED",
            "review boundary weakened")
    require(set(casebook["promotion_blocks"]) == REQUIRED_BLOCKS and
            len(casebook["promotion_blocks"]) == len(REQUIRED_BLOCKS),
            "claim boundary missing/duplicated")
    require(set(casebook["source_evidence"][i]["source_id"] for i in range(
                len(casebook["source_evidence"]))) == {"RB2-S002","RB2-S003"},
            "cross-source scope changed")
    require(len(casebook["source_evidence"]) == 2, "source evidence duplicated")
    manifest = read_json(RB3.parent / "RB2/corpus_manifest.json")
    source_index = {s["id"]:s for s in manifest["records"]}
    for src in casebook["source_evidence"]:
        ref = source_index[src["source_id"]]
        require(src["lineage_id"] == ref["lineage"], "source lineage changed")
        require(src["doi"] == ref["doi"], "source DOI changed")
        require(src["url"].startswith("https://journals.plos.org/plosone/article?id="),
                "source publisher URL changed")
        require(src["scope"], "source evidence scope missing")

    require(len(casebook["cases"]) == 4, "must have four documented opposing-label cases")
    ids = [case["case_id"] for case in casebook["cases"]]
    require(set(ids) == set(EXPECTED_CASES) and len(ids) == len(set(ids)),
            "collision case ID mismatch or duplicate")
    by_id = {row["row_id"]:row for row in rows}
    require(len(by_id) == len(rows), "duplicate original candidate row")
    groups = feature_groups(rows)
    actual_conflicts = conflicting_groups(groups)
    actual_membership = {frozenset(row["row_id"] for row in group) for group in actual_conflicts}
    expected_membership = {frozenset(group[1]) for group in EXPECTED_CASES.values()}
    require(actual_membership == expected_membership, "new/missing opposing-label collision")
    require(len(groups) == 57 and len(actual_conflicts) == 4 and
            sum(map(len, actual_conflicts)) == 10,
            "frozen candidate-vector collision counts changed")
    require(len(reviewed_packet.MODEL_FIELDS) == 13, "frozen predictor representation changed")

    e3_src_rows = {
        row["row_id"]:row
        for row in primary_timing["source_row_crosswalk"]["RB2-S002"]
    }
    require(set(e3_src_rows) == {
        row["row_id"] for row in rows if row["source_id"] == "RB2-S002"
    }, "primary timing crosswalk omitted S002 rows")
    r1_evidence = read_json(RB3 / "R1/source_evidence.json")
    receipts = {x["row_id"]:x for x in r1_evidence["records"]}

    rendered_cases = []
    for case in casebook["cases"]:
        case_id = case["case_id"]
        source_id, expected_ids, labels, dimensions = EXPECTED_CASES[case_id]
        require(case["source_id"] == source_id, "case source changed")
        require(tuple(case["row_ids"]) == expected_ids, "case row IDs changed")
        require(tuple(case["expected_labels"]) == labels, "case outcomes changed")
        require(tuple(case["nonencoded_dimensions"]) == dimensions,
                "source confound dimension changed")
        require(len(case["reported_assays"]) == len(expected_ids),
                "one or more assays excluded")
        require(case["known_source_time_difference"] and case["explanation_boundary"],
                "missing scientific nuance")
        entry_rows = [by_id[rid] for rid in expected_ids]
        feature_keys = {
            tuple(row[name] for name in reviewed_packet.MODEL_FIELDS)
            for row in entry_rows
        }
        require(len(feature_keys) == 1, "claimed collision not exact")
        require(tuple(row["reported_direction"] for row in entry_rows) == labels,
                "labels do not match frozen candidate data")
        for row, assay_text in zip(entry_rows, case["reported_assays"]):
            receipt = receipts[row["row_id"]]
            require(receipt["source_id"] == source_id, "row/source provenance inconsistent")
            require(row["source_id"] == source_id, "candidate paper swapped")
            require(receipt["reported_direction"] == row["reported_direction"],
                    "candidate label differs from study attribution")
            require(receipt["figure_or_table"] in assay_text,
                    "figure locator lost in casebook")
            require(row["lineage_id"] == "L002", "L002 source split leakage")
        if case_id == "C1_NEURON_VS_ASTROCYTE_DIFFERENTIATION":
            require([e3_src_rows[rid]["post_exposure_culture_days_before_assay"]
                     for rid in expected_ids] == [0,3],
                    "delayed astrocyte count is hidden")
            require("three additional" in case["known_source_time_difference"],
                    "known three-day maturation erased")
        if case_id == "C2_TUJ1_VS_GFAP_TRANSCRIPTION":
            require([e3_src_rows[rid]["post_exposure_culture_days_before_assay"]
                     for rid in expected_ids] == [0,0],
                    "transcription timepoints changed")
            require("no observed timing mismatch" in case["known_source_time_difference"],
                    "timing causality overstated")
        if case_id == "C3_NEURITE_LENGTH_COUNT_BRANCHES":
            require([e3_src_rows[rid]["post_exposure_culture_days_before_assay"]
                     for rid in expected_ids] == [0,0,0],
                    "neurite timepoints changed")
        if case_id == "C4_2014_DIFFERENT_NEURONAL_TRANSCRIPTS":
            require("Not established" in case["known_source_time_difference"],
                    "unverified 2014 readout timing presented as fact")
        rendered_cases.append({
            "case_id":case_id,
            "source_id":source_id,
            "row_ids":list(expected_ids),
            "outcome_classes":sorted(set(labels)),
            "reason_for_review":case["nonencoded_dimensions"],
        })

    for name in ("FROZEN_ROWS.csv","REAL_ROWS_FREEZE.json"):
        require(not (RB3/name).exists(), "unapproved training freeze file present")
    require(len(rows)==64, "full candidate set must not be modified")
    return {
        "status":"PASS_RB3_R5_E4_COARSE_FEATURE_IDENTIFIABILITY_AUDIT",
        "readiness":"BLOCKED_RB3_REAL_FIT_AWAITING_INDEPENDENT_REVIEW",
        "candidate_rows":len(rows),
        "distinct_frozen_predictor_vectors":len(groups),
        "opposing_label_predictor_groups":len(actual_conflicts),
        "candidate_rows_in_opposing_label_groups":sum(map(len, actual_conflicts)),
        "review_priority_cases":rendered_cases,
        "readout_delay_unequal_case_ids":["C1_NEURON_VS_ASTROCYTE_DIFFERENTIATION"],
        "same_time_different_target_case_ids":[
            "C2_TUJ1_VS_GFAP_TRANSCRIPTION", "C3_NEURITE_LENGTH_COUNT_BRANCHES"],
        "source_time_not_confirmed_case_ids":["C4_2014_DIFFERENT_NEURONAL_TRANSCRIPTS"],
        "independent_reviews_completed":0,
        "fit_eligible_rows":0,
        "real_model_execution_authorized":False,
    }


def audit() -> dict[str, Any]:
    prior = reviewed_packet.packet()
    require(prior["candidate_rows"] == 64 and prior["candidate_lineages"] == 8,
            "prior review packet coverage changed")
    require(prior["independent_review_attestations"] == 0 and
            prior["reviewed_eligible_rows"] == 0 and
            prior["execution_authorized"] is False,
            "prior reviewer ledger promoted before review")
    timing_audit.audit()
    crosswalk = read_json(timing_audit.DATA)
    casebook = read_json(CASEBOOK_PATH)
    report = check_casebook(casebook, read_rows(), crosswalk)
    report["collision_casebook_sha256"] = hashlib.sha256(CASEBOOK_PATH.read_bytes()).hexdigest()
    report["prior_review_packet_sha256"] = prior["packet_sha256"]
    return report


def markdown_report(report: dict[str, Any]) -> str:
    header = [
        "# RB3-R5-E4 | Frozen predictor collision audit",
        "",
        "**UNATTESTED DIAGNOSTIC. NO MODEL RUN.**",
        "",
        f"- Candidate observations: {report['candidate_rows']}",
        f"- Distinct exact frozen input vectors: {report['distinct_frozen_predictor_vectors']}",
        f"- Opposing-label feature-vector groups: {report['opposing_label_predictor_groups']}",
        f"- Rows in conflicting groups: {report['candidate_rows_in_opposing_label_groups']}",
        f"- Independently reviewed model-eligible rows: {report['fit_eligible_rows']}",
        "",
        "| Case | Source | Row IDs | Source labels | Missing measured dimension(s) |",
        "|---|---|---|---|---|",
    ]
    for c in report["review_priority_cases"]:
        header.append("| "+" | ".join([
            c["case_id"],
            c["source_id"],
            ", ".join(c["row_ids"]),
            ", ".join(c["outcome_classes"]),
            ", ".join(c["reason_for_review"]),
        ])+" |")
    header += [
        "",
        "The groups have exactly identical frozen RB3 predictors but differ",
        "in molecular analyte, cell marker, morphology metric, or a known/unknown",
        "post-exposure readout time. These are **model-identifiability limitations**,",
        "not independent biological contradictions or demonstrations of hidden resonance.",
        "",
        "**The original RB3 model and split policy must not be retroactively edited,",
        "and no conflicting rows can be dropped to inflate apparent accuracy.**",
        "",
    ]
    return "\n".join(header)


def main() -> int:
    parser=argparse.ArgumentParser()
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--audit",action="store_true")
    mode.add_argument("--markdown",action="store_true")
    args=parser.parse_args()
    report=audit()
    print(markdown_report(report) if args.markdown else json.dumps(report,indent=2,sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
