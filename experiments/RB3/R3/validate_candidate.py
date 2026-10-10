#!/usr/bin/env python3
"""R3 source-attributed candidate checks. STATIC ONLY; NEVER fits or promotes."""
from __future__ import annotations

import csv
import hashlib
import json
import math
from collections import Counter
from pathlib import Path

R3 = Path(__file__).resolve().parent
RB3 = R3.parent
RB2 = RB3.parent / "RB2"
FILES = ("R0/candidate_rows.csv", "R1/additional_rows.csv",
         "R2/additional_rows.csv", "R3/additional_rows.csv")
R3_COUNTS = {"RB2-S004": 3, "RB2-S012": 2, "RB2-S014": 3}
PREVIOUS_COUNTS = (9, 18, 29)
EXPECTED_LINEAGES = {"L001","L002","L003","L004","L007","L008","L009","L011"}
SCOPE = {"SINGLE_CONDITION_AUTHOR_SUMMARY",
         "POOLED_NULL_APPLIED_TO_TESTED_ARM_PENDING_REVIEW",
         "AUTHOR_POOLED_ALL_CELL_TYPES"}
FROZEN_TARGETS = {"INCREASE", "DECREASE", "NULL"}

def load_json(p: Path):
    return json.loads(p.read_text(encoding="utf8"))

def load_csv(p: Path):
    with p.open(encoding="utf8", newline="") as handle:
        reader = csv.DictReader(handle)
        return tuple(reader.fieldnames or ()), list(reader)

def number(x):
    v = float(x)
    if not math.isfinite(v):
        raise AssertionError("nonfinite number")
    return v

def audit():
    schema = load_json(RB2 / "extraction_schema.json")
    manifest = load_json(RB2 / "corpus_manifest.json")
    context = load_json(RB2 / "context_registry.json")
    queue = load_json(R3 / "extraction_queue.json")
    evidence = load_json(R3 / "source_evidence.json")
    triage = load_json(R3 / "source_triage.json")
    studies = {x["id"]: x for x in manifest["records"]}

    assert len(studies) == 14 and manifest["source_count"] == 14, "manifest drift"
    assert manifest["lineage_count"] == 11, "lineage count drift"
    assert context["model_input"] is False, "context leakage"
    assert queue["complete"] is False and queue["model_execution_authorized"] is False, "false execution authority"
    assert evidence["execution_authorized"] is False, "evidence authorizes execution"
    assert evidence["review_status"] == "NEEDS_PRIMARY_FULLTEXT_PER_ARM_VERIFICATION"
    assert set(evidence["sources"]) == set(R3_COUNTS)
    assert triage["status"] == "PENDING_EVIDENCE_NOT_MODEL_ROWS"
    assert len(triage["items"]) == 5, "missing unresolved source"
    assert {x["source_id"] for x in triage["items"]} == {"RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"}

    all_rows = []
    for idx, fname in enumerate(FILES):
        head, rows = load_csv(RB3 / fname)
        assert set(head) == set(schema["required_fields"]), "extraction schema drift"
        if idx < 3:
            assert len(rows) == PREVIOUS_COUNTS[idx], "earlier rung data changed"
        else:
            assert len(rows) == 8, "R3 candidate count changed"
        all_rows.extend(rows)
    assert len(all_rows) == 64, "total candidates changed"
    all_ids = [x["row_id"] for x in all_rows]
    assert len(all_ids) == len(set(all_ids)), "row ID collision"
    lineages = {x["lineage_id"] for x in all_rows}
    assert lineages == EXPECTED_LINEAGES, "wrong represented lineage count"
    assert len({x["source_id"] for x in all_rows}) == 9, "wrong represented source count"

    r3_rows = load_csv(RB3 / FILES[-1])[1]
    assert dict(Counter(x["source_id"] for x in r3_rows)) == R3_COUNTS, "R3 source counts changed"
    receipts = evidence["records"]
    byid = {r["row_id"]: r for r in receipts}
    assert len(byid) == len(receipts) == len(r3_rows), "duplicate/missing receipt"
    assert set(byid) == {r["row_id"] for r in r3_rows}, "row evidence mismatch"
    assert len(queue["entries"]) == 14 and {x["source_id"] for x in queue["entries"]} == set(studies), "queue incomplete"
    totals = dict(Counter(x["source_id"] for x in all_rows))
    for record in queue["entries"]:
        assert record["candidate_rows"] == totals.get(record["source_id"], 0), "queue/CSV totals drift"
    assert queue["total_candidate_rows"] == 64
    assert queue["lineages_with_candidate_coverage"] == 8
    assert queue["unrepresented_lineages"] == ["L005","L006","L010"]

    for row in r3_rows:
        sid = row["source_id"]
        source = studies[sid]
        ref = evidence["sources"][sid]
        e = byid[row["row_id"]]
        assert row["lineage_id"] == source["lineage"] == ref["lineage"], "lineage mismatch"
        assert row["source_locator"] == ref["locator"] == e["source_url"], "locator mismatch"
        assert ref["doi"] == source["doi"] and ref["pmid"] == source["pmid"], "bibliography mismatch"
        assert row["species"] in ("MOUSE","RAT","HUMAN")
        assert row["endpoint_class"] in schema["enums"]["endpoint_class"]
        assert row["reported_direction"] in FROZEN_TARGETS
        assert row["reported_significance"] in schema["enums"]["reported_significance"]
        assert row["reported_direction"] == e["reported_direction"]
        assert row["reported_significance"] == e["reported_significance"]
        assert e["scope"] in SCOPE and e["independent_review"] == "PENDING"
        assert e["eligible_for_model_freeze"] is False, "unreviewed candidate promoted"
        assert e["provenance_origin"] == "SOURCE_ATTRIBUTED_ABSTRACT"
        assert e["exact_p_value"] == "NOT_EXTRACTED" and e["effect_size"] == "NOT_EXTRACTED", "numeric evidence invented"
        assert row["mechanism_claim_class"] == "UNRESOLVED"
        assert row["effect_size_value"] == "" and row["effect_size_type"] == ""
        assert row["waveform"] in ("","SINUSOIDAL")
        assert row["duty_cycle"] == "" and row["repeated_exposure_count"] == "" and row["geometry_or_orientation"] == "", "missing values guessed"
        assert row["sham_control_present"] == "true" and row["value_origin"] == "DERIVED_UNIT_CONVERSION"
        assert row["bubble_from"] == "B0_FIELD" and row["bubble_to"] in (
            "B1_MEMBRANE_CHANNEL","B2_INTRACELLULAR_SIGNAL","B4_CELL_BEHAVIOR_PATTERN"
        )
        assert "CANDIDATE ONLY" in row["extraction_note"], "provisional warning missing"
        assert row["frequency_hz"] == "50" and number(row["frequency_hz"]) in source["frequency_hz"]
        if sid == "RB2-S004":
            assert row["amplitude_original"] == "1 mT" and number(row["amplitude_value_si"]) == 0.001
            assert row["exposure_duration_s"] == "" and row["waveform"] == ""
            assert row["reported_direction"] == "INCREASE"
            assert e["scope"] == "SINGLE_CONDITION_AUTHOR_SUMMARY"
            assert row["endpoint_class"] in ("DIFFERENTIATION","ION_CHANNEL_ACTIVITY","CALCIUM_SIGNAL")
        elif sid == "RB2-S012":
            assert row["amplitude_original"] in ("10 uT","1 mT")
            field = 10e-6 if row["amplitude_original"] == "10 uT" else 0.001
            assert math.isclose(number(row["amplitude_value_si"]),field,abs_tol=1e-12,rel_tol=0), "microtesla normalization"
            assert row["endpoint_class"] == "PROLIFERATION"
            assert row["reported_direction"] == "NULL" and row["reported_significance"] == "NOT_REPORTED"
            assert row["exposure_duration_s"] == "" and row["waveform"] == "SINUSOIDAL"
            assert e["scope"] == "POOLED_NULL_APPLIED_TO_TESTED_ARM_PENDING_REVIEW"
            assert e["blocker"] == "MUST_CONFIRM_PER_ARM_NULL_FROM_FULLTEXT"
        elif sid == "RB2-S014":
            assert row["amplitude_original"] == "1 mT" and number(row["amplitude_value_si"]) == 0.001
            assert row["exposure_duration_s"] == "259200" and row["waveform"] == ""
            assert row["endpoint_class"] == "PROLIFERATION"
            assert row["reported_direction"] == "INCREASE" and row["reported_significance"] == "NOT_REPORTED"
            assert e["scope"] == "AUTHOR_POOLED_ALL_CELL_TYPES"
            assert e["blocker"] == "MUST_CONFIRM_CELL_LINE_SPECIFIC_RESULT_FROM_FULLTEXT"
            assert "DNA damage" in row["extraction_note"], "safety context omitted"
        else:
            raise AssertionError("unexpected source")

    assert len({x["amplitude_original"] for x in r3_rows if x["source_id"]=="RB2-S012"}) == 2
    assert {x["sample_class"] for x in r3_rows if x["source_id"]=="RB2-S014"} == {
        "HL60_LEUKEMIA_CELLS","RAT1_FIBROBLAST_CELL_LINE","WI38_DIPLOID_FIBROBLAST_CELL_LINE",
    }
    assert (RB3 / "FROZEN_ROWS.csv").exists() is False, "unapproved real dataset"
    assert (RB3 / "REAL_ROWS_FREEZE.json").exists() is False, "unapproved execution receipt"

    return {
        "status":"PASS_RB3_R3_PROVISIONAL_EVIDENCE_AUDIT",
        "added_candidate_rows":len(r3_rows),
        "total_candidate_rows":len(all_rows),
        "papers":len({x["source_id"] for x in all_rows}),
        "lineages":len(lineages),
        "awaiting_lineages":["L005","L006","L010"],
        "sha256_candidate_csv":hashlib.sha256((R3 / "additional_rows.csv").read_bytes()).hexdigest(),
        "sha256_evidence":hashlib.sha256((R3 / "source_evidence.json").read_bytes()).hexdigest(),
        "model_execution_authorized":False,
        "scientific_result_authorized":False,
    }

if __name__ == "__main__":
    print(json.dumps(audit(),sort_keys=True,indent=2))
