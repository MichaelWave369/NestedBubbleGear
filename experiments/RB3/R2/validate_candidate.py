#!/usr/bin/env python3
"""RB3-R2 static candidate-data provenance audit. Never trains a model."""
from __future__ import annotations

import csv
import hashlib
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RB3 = ROOT.parent
RB2 = ROOT.parents[1] / "RB2"
R0 = RB3 / "R0"
R1 = RB3 / "R1"
CANDIDATE = ROOT / "additional_rows.csv"
EVIDENCE = ROOT / "source_evidence.json"
QUEUE = ROOT / "extraction_queue.json"

COUNTS = {"RB2-S006": 9, "RB2-S010": 12, "RB2-S011": 8}
KNOWN_LINEAGES = {"L001", "L002", "L004", "L007", "L008"}
KNOWN_TARGETS = {"INCREASE", "DECREASE", "NULL"}
MODEL_FEATURES = (
    "frequency_hz", "amplitude_value_si", "exposure_duration_s",
    "repeated_exposure_count", "field_type", "waveform",
    "geometry_or_orientation", "system_class", "species",
    "sample_class", "endpoint_class", "bubble_from", "bubble_to",
)
CONTROL_FIELDS = {
    "row_id", "source_id", "lineage_id", "reported_direction",
    "reported_significance", "effect_size_value", "effect_size_type",
    "mechanism_claim_class", "source_locator", "extraction_note",
}


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def load_csv(path: Path):
    with path.open(encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        return tuple(reader.fieldnames or ()), list(reader)


def finite_number(value: str) -> float:
    number = float(value)
    if not math.isfinite(number):
        raise AssertionError("nonfinite numeric value")
    return number


def expected_field_combinations(source_id: str):
    if source_id == "RB2-S006":
        return {(f, 5.0) for f in (1, 10, 50)}
    if source_id == "RB2-S010":
        return {(5, a) for a in (0.25, 0.5, 0.8)} | {
            (50, a) for a in (0.5, 0.8, 1.6)
        }
    if source_id == "RB2-S011":
        return {(50, a) for a in (0.02, 0.5)}
    raise AssertionError("unknown R2 source")


def expected_direction(row):
    source = row["source_id"]
    f = int(row["frequency_hz"])
    field_t = finite_number(row["amplitude_value_si"])
    endpoint = row["endpoint_class"]
    if source == "RB2-S006":
        return "INCREASE", "SIGNIFICANT"
    if source == "RB2-S010":
        if endpoint == "SURVIVAL":
            return "NULL", "NOT_REPORTED"
        is_decrease = (
            f == 5 or (f == 50 and math.isclose(field_t, 0.0008, abs_tol=1e-12))
        )
        return (
            ("DECREASE", "SIGNIFICANT")
            if is_decrease else ("NULL", "NOT_SIGNIFICANT")
        )
    if source == "RB2-S011":
        return "NULL", "NOT_REPORTED"
    raise AssertionError("unexpected source")


def validate():
    manifest = load_json(RB2 / "corpus_manifest.json")
    schema = load_json(RB2 / "extraction_schema.json")
    context = load_json(RB2 / "context_registry.json")
    evidence = load_json(EVIDENCE)
    queue = load_json(QUEUE)
    old_fields, r0 = load_csv(R0 / "candidate_rows.csv")
    r1_fields, r1 = load_csv(R1 / "additional_rows.csv")
    fields, rows = load_csv(CANDIDATE)

    source_map = {r["id"]: r for r in manifest["records"]}
    if len(source_map) != 14 or manifest.get("source_count") != 14:
        raise AssertionError("RB2 source freeze modified")
    if context.get("model_input") is not False:
        raise AssertionError("context-only sources promoted")
    if fields != old_fields or fields != r1_fields or set(fields) != set(schema["required_fields"]):
        raise AssertionError("candidate schema differs from frozen RB2")
    if len(r0) != 9 or len(r1) != 18 or len(rows) != 29:
        raise AssertionError("R0/R1/R2 row counts drift")
    if len(rows) != sum(COUNTS.values()):
        raise AssertionError("R2 source-row count drift")
    all_rows = r0 + r1 + rows
    ids = [x["row_id"] for x in all_rows]
    if len(ids) != len(set(ids)):
        raise AssertionError("row IDs reused")
    if any(set(r) != set(fields) for r in rows):
        raise AssertionError("unexpected CSV columns")
    if len(set(MODEL_FEATURES) & CONTROL_FIELDS):
        raise AssertionError("provenance leaked into predictor")

    if evidence["status"] != "PARTIAL_SOURCE_ATTRIBUTED" or evidence["review_status"] != "CANDIDATE_PENDING_INDEPENDENT_REVIEW":
        raise AssertionError("evidence falsely promoted")
    receipts = evidence["records"]
    by_id = {r["row_id"]: r for r in receipts}
    if len(receipts) != len(by_id) or set(by_id) != {r["row_id"] for r in rows}:
        raise AssertionError("evidence receipt mismatch or duplicate")
    if set(evidence["sources"]) != set(COUNTS):
        raise AssertionError("evidence registry source drift")

    if queue["complete"] is not False or queue["model_execution_authorized"] is not False:
        raise AssertionError("incomplete extraction has execution authorization")
    if len(queue["entries"]) != 14 or {x["source_id"] for x in queue["entries"]} != set(source_map):
        raise AssertionError("extraction queue source drift")
    queue_counts = {x["source_id"]: x["candidate_rows"] for x in queue["entries"]}
    actual_counts = Counter(x["source_id"] for x in all_rows)
    if queue_counts != dict(actual_counts) | {sid: 0 for sid in set(source_map) - set(actual_counts)}:
        raise AssertionError("queue and candidate rows inconsistent")
    if (RB3 / "FROZEN_ROWS.csv").exists() or (RB3 / "REAL_ROWS_FREEZE.json").exists():
        raise AssertionError("partial extraction must not authorize real fitting")

    counts = Counter()
    visited_combos = defaultdict(set)
    for row in rows:
        source = row["source_id"]
        if source not in COUNTS:
            raise AssertionError("source not frozen for R2")
        ref = source_map[source]
        if row["lineage_id"] != ref["lineage"]:
            raise AssertionError("source-lineage mismatch")
        if row["endpoint_class"] not in schema["enums"]["endpoint_class"]:
            raise AssertionError("unknown endpoint family")
        if row["reported_direction"] not in KNOWN_TARGETS:
            raise AssertionError("unknown target class")
        if row["reported_significance"] not in schema["enums"]["reported_significance"]:
            raise AssertionError("unknown significance class")
        if row["value_origin"] != "DERIVED_UNIT_CONVERSION":
            raise AssertionError("unit conversion without provenance")
        if row["mechanism_claim_class"] != "UNRESOLVED":
            raise AssertionError("mechanism inferred from downstream outcomes")
        if row["effect_size_value"] or row["effect_size_type"]:
            raise AssertionError("unsupported effect size invented")
        if row["field_type"] != "MAGNETIC" or row["geometry_or_orientation"] or row["duty_cycle"]:
            raise AssertionError("unverified field geometry/duty")
        if row["sham_control_present"] != "true":
            raise AssertionError("non-sham exposure inserted")
        if row["bubble_from"] != "B0_FIELD" or row["bubble_to"] != "B4_CELL_BEHAVIOR_PATTERN":
            raise AssertionError("unjustified bubble boundary")
        if "NULL" not in row["extraction_note"]:
            raise AssertionError("missing null-is-not-equivalence caveat")
        f = int(row["frequency_hz"])
        if f not in ref["frequency_hz"]:
            raise AssertionError("frequency outside frozen source")
        orig = row["amplitude_original"]
        if source == "RB2-S011":
            if not orig.endswith(" uT"):
                raise AssertionError("MCF-7 microtesla unit drift")
            field_mt = finite_number(orig[:-3]) / 1000.0
        else:
            if not orig.endswith(" mT"):
                raise AssertionError("mT unit drift")
            field_mt = finite_number(orig[:-3])
        if (f, field_mt) not in expected_field_combinations(source):
            raise AssertionError("arm intensity/frequency not in paper")
        normalized = finite_number(row["amplitude_value_si"])
        if not math.isclose(normalized, field_mt / 1000.0, abs_tol=1e-12, rel_tol=0):
            raise AssertionError("incorrect tesla conversion")
        if source == "RB2-S006":
            if row["waveform"] != "SINUSOIDAL" or row["endpoint_class"] != "PROLIFERATION":
                raise AssertionError("wrong epidermal assay")
            if row["exposure_duration_s"] != "1800" or row["repeated_exposure_count"] not in ("3", "5", "7"):
                raise AssertionError("epidermal daily-duration drift")
            combo = (f, row["repeated_exposure_count"])
        elif source == "RB2-S010":
            if row["waveform"] != "NOMINAL_SINUSOIDAL_HARMONICS_REPORTED":
                raise AssertionError("measured higher harmonics were suppressed")
            if row["exposure_duration_s"] != "5400" or row["repeated_exposure_count"] != "1":
                raise AssertionError("fibroblast exposure drift")
            if row["endpoint_class"] not in ("PROLIFERATION", "SURVIVAL"):
                raise AssertionError("invalid fibroblast endpoint")
            combo = (f,field_mt,row["endpoint_class"])
        else:
            if row["waveform"] != "SINUSOIDAL":
                raise AssertionError("MCF-7 stimulus drift")
            if row["sample_class"] != "MCF7_BREAST_CARCINOMA_CELLS":
                raise AssertionError("normal tissue incorrectly inferred from cancer cell line")
            if row["exposure_duration_s"] not in ("86400", "345600") or row["repeated_exposure_count"]:
                raise AssertionError("MCF-7 continuous exposure schedule drift")
            if row["endpoint_class"] not in ("PROLIFERATION", "SURVIVAL"):
                raise AssertionError("invalid MCF-7 endpoint")
            combo = (f,field_mt,row["exposure_duration_s"],row["endpoint_class"])
        if combo in visited_combos[source]:
            raise AssertionError("duplicate source condition/assay")
        visited_combos[source].add(combo)
        expected = expected_direction(row)
        if (row["reported_direction"], row["reported_significance"]) != expected:
            raise AssertionError("source outcome direction/significance mismatch")
        receipt = by_id[row["row_id"]]
        if (
            receipt["source_id"] != source
            or receipt["evidence_locator"] != row["source_locator"]
            or receipt["reported_direction"] != row["reported_direction"]
            or receipt["reported_significance"] != row["reported_significance"]
            or receipt["mean"] != "NOT_EXTRACTED"
            or receipt["per_arm_p_value"] != "NOT_EXTRACTED"
        ):
            raise AssertionError("source evidence/row disagreement")
        if not receipt["figure_or_section"] or not receipt["assay"] or not receipt["author_reported_comparison"]:
            raise AssertionError("missing precise evidence scope")
        source_receipt = evidence["sources"][source]
        if source_receipt["doi"] != ref["doi"] or source_receipt["lineage"] != row["lineage_id"] or source_receipt["locator"] != row["source_locator"]:
            raise AssertionError("source bibliography/lineage mismatch")
        counts[source] += 1

    if dict(counts) != COUNTS:
        raise AssertionError("source row counts changed")
    lineages = {x["lineage_id"] for x in all_rows}
    if lineages != KNOWN_LINEAGES:
        raise AssertionError("coverage incorrectly counted independent papers")

    return {
        "status":"PASS_RB3_R2_CROSS_LINEAGE_PARTIAL_AUDIT",
        "new_rows":len(rows),
        "combined_rows":len(all_rows),
        "source_count":len({x["source_id"] for x in all_rows}),
        "lineage_count":len(lineages),
        "represented_lineages":sorted(lineages),
        "r2_source_counts":dict(counts),
        "candidate_csv_sha256":hashlib.sha256(CANDIDATE.read_bytes()).hexdigest(),
        "evidence_sha256":hashlib.sha256(EVIDENCE.read_bytes()).hexdigest(),
        "model_execution_authorized":False,
        "result_claim_authorized":False,
    }


if __name__ == "__main__":
    print(json.dumps(validate(), indent=2, sort_keys=True))
