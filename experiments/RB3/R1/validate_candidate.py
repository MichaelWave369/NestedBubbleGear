#!/usr/bin/env python3
"""Source-attributed RB3-R1 candidate audit; never trains a model."""
from __future__ import annotations

import csv
import hashlib
import importlib.util
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RB3 = ROOT.parent
RB2 = ROOT.parents[1] / "RB2"
R0 = RB3 / "R0"
CANDIDATE = ROOT / "additional_rows.csv"
EVIDENCE = ROOT / "source_evidence.json"
QUEUE = ROOT / "extraction_queue.json"

EXPECTED_SOURCES = ("RB2-S002", "RB2-S003")
EXPECTED_R1_ROWS = 18
EXPECTED_R0_ROWS = 9
EXPECTED_LINEAGES_COMBINED = ("L001", "L002")
NUMERIC = ("frequency_hz", "amplitude_value_si", "exposure_duration_s", "repeated_exposure_count")
CATEGORICAL = ("field_type", "waveform", "geometry_or_orientation", "system_class", "species", "sample_class", "endpoint_class", "bubble_from", "bubble_to")


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_csv(path: Path):
    with path.open(encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        fields = tuple(reader.fieldnames or ())
        rows = list(reader)
    return fields, rows


def _number(value: str) -> float:
    num = float(value)
    if not math.isfinite(num):
        raise ValueError("non-finite numeric value")
    return num


def validate() -> dict:
    manifest = load_json(RB2 / "corpus_manifest.json")
    schema = load_json(RB2 / "extraction_schema.json")
    queue = load_json(QUEUE)
    ledger = load_json(EVIDENCE)
    r0_fields, r0_rows = read_csv(R0 / "candidate_rows.csv")
    r1_fields, r1_rows = read_csv(CANDIDATE)

    manifest_index = {entry["id"]: entry for entry in manifest["records"]}
    if len(manifest_index) != 14:
        raise AssertionError("RB2 manifest source count changed")

    if len(r0_rows) != EXPECTED_R0_ROWS or len(r1_rows) != EXPECTED_R1_ROWS:
        raise AssertionError("candidate row count drift")
    if r0_fields != r1_fields or set(r1_fields) != set(schema["required_fields"]):
        raise AssertionError("RB2 extraction schema drift")
    if any(set(row) != set(r1_fields) for row in r1_rows):
        raise AssertionError("unexpected source input column")

    if ledger["status"] != "SOURCE_ATTRIBUTED_PARTIAL" or ledger["review_status"] != "CANDIDATE_PENDING_INDEPENDENT_REVIEW":
        raise AssertionError("evidence registry improperly promoted")
    records = ledger["records"]
    evidence_by_id = {r["row_id"]: r for r in records}
    if len(evidence_by_id) != EXPECTED_R1_ROWS:
        raise AssertionError("duplicate/missing source evidence")
    combined = r0_rows + r1_rows
    combined_ids = {r["row_id"] for r in combined}
    if len(combined_ids) != len(combined):
        raise AssertionError("R0/R1 row ID conflict")
    if set(evidence_by_id) != {r["row_id"] for r in r1_rows}:
        raise AssertionError("unmatched evidence and candidate rows")

    source_ids = {r["source_id"] for r in r1_rows}
    if source_ids != set(EXPECTED_SOURCES):
        raise AssertionError("R1 source set drift")
    for source_id in EXPECTED_SOURCES:
        expected = manifest_index[source_id]
        if expected["lineage"] != "L002":
            raise AssertionError("R1 inherited lineage drift")
        src = ledger["sources"][source_id]
        if src["doi"] != expected["doi"] or src["lineage"] != expected["lineage"]:
            raise AssertionError("primary-paper identity mismatch")

    if queue["complete"] is not False or queue["model_execution_authorized"] is not False:
        raise AssertionError("R1 erroneously authorizes execution")
    if len(queue["entries"]) != 14:
        raise AssertionError("source review queue incomplete")
    if {x["source_id"] for x in queue["entries"]} != set(manifest_index):
        raise AssertionError("source review queue drift")
    if sum(x["candidate_rows"] for x in queue["entries"]) != len(combined):
        raise AssertionError("source queue candidate counts do not reconcile")

    counts = Counter()
    for row in r1_rows:
        sid = row["source_id"]
        source = manifest_index[sid]
        ev = evidence_by_id[row["row_id"]]
        meta = ledger["sources"][sid]

        if row["lineage_id"] != source["lineage"] or row["lineage_id"] != "L002":
            raise AssertionError("source-lineage mismatch")
        if ev["source_id"] != sid or ev["reported_direction"] != row["reported_direction"]:
            raise AssertionError("outcome/evidence tamper or mismatch")
        if ev["reported_significance"] != row["reported_significance"]:
            raise AssertionError("significance/evidence tamper or mismatch")
        if ev["reported_figure_reference"] != row["source_locator"] or row["source_locator"] != meta["url"]:
            raise AssertionError("primary publisher locator drift")
        if not ev["figure_or_table"] or not ev["assay"] or not ev["statistical_evidence"]:
            raise AssertionError("missing source provenance")
        if ev["exact_p_value"] != "NOT_EXTRACTED" or ev["raw_mean"] != "NOT_EXTRACTED":
            raise AssertionError("unsupported numerical result introduced")
        if ev["comparator"] != "SHAM" or ev["provenance"] != "SOURCE_ATTRIBUTED_PRIMARY_ARTICLE":
            raise AssertionError("unexpected comparator/source provenance")

        if row["reported_direction"] not in ("INCREASE", "DECREASE", "NULL"):
            raise AssertionError("invalid classification label")
        if row["endpoint_class"] not in schema["enums"]["endpoint_class"]:
            raise AssertionError("unregistered endpoint")
        if row["reported_significance"] not in schema["enums"]["reported_significance"]:
            raise AssertionError("unregistered significance")
        if row["reported_direction"] == "NULL" and row["reported_significance"] != "NOT_SIGNIFICANT":
            raise AssertionError("NULL must mean source-reported nonsignificance")
        if row["reported_direction"] != "NULL" and row["reported_significance"] != "SIGNIFICANT":
            raise AssertionError("directional label requires reported significance")
        if row["mechanism_claim_class"] != "UNRESOLVED" or row["effect_size_value"] or row["effect_size_type"]:
            raise AssertionError("post-result mechanistic or effect-size promotion")
        if row["value_origin"] != "DERIVED_UNIT_CONVERSION":
            raise AssertionError("missing SI conversion provenance")
        if row["sham_control_present"] != "true":
            raise AssertionError("non-sham comparison inserted")
        if row["frequency_hz"] != "50":
            raise AssertionError("frequency not frozen to source")
        amp = _number(row["amplitude_value_si"])
        match = re.fullmatch(r"(0\.5|1|2) mT", row["amplitude_original"])
        if not match or not math.isclose(amp, float(match.group(1))/1000.0,abs_tol=1e-12,rel_tol=0):
            raise AssertionError("amplitude unit conversion drift")
        if row["geometry_or_orientation"] or not row["extraction_note"]:
            raise AssertionError("geometry was guessed or note missing")
        if "NULL = non-significant" not in row["extraction_note"]:
            raise AssertionError("nonsignificant != biological equivalence firewall absent")

        if sid == "RB2-S002":
            if row["amplitude_original"] != "1 mT":
                raise AssertionError("2016 source amplitude drift")
            if row["waveform"] or row["duty_cycle"]:
                raise AssertionError("unsupported 2016 waveform/duty invented")
            if row["exposure_duration_s"] != "14400" or row["repeated_exposure_count"] != "3":
                raise AssertionError("2016 per-session exposure mismatch")
        else:
            if row["waveform"] != "SINUSOIDAL":
                raise AssertionError("2014 sinusoidal type drift")
            if not math.isclose(_number(row["duty_cycle"]),1/3,rel_tol=1e-12):
                raise AssertionError("2014 5/10 duty cycle mismatch")
            if row["exposure_duration_s"] or row["repeated_exposure_count"]:
                raise AssertionError("unsupported 2014 per-session duration inserted")
            if row["amplitude_original"] != "2 mT" and ev["figure_or_table"] != "Table 1":
                raise AssertionError("2014 sub-2mT data outside Table 1")

        counts[sid] += 1

    if counts != {"RB2-S002": 9, "RB2-S003": 9}:
        raise AssertionError("row counts do not match source extraction")
    lineages = sorted({r["lineage_id"] for r in combined})
    if lineages != list(EXPECTED_LINEAGES_COMBINED):
        raise AssertionError("expected only two source lineages")
    if (RB3 / "FROZEN_ROWS.csv").exists() or (RB3 / "REAL_ROWS_FREEZE.json").exists():
        raise AssertionError("cannot package authorized model input into a partial-extraction PR")

    # Diagnostic only: reveal feature-state aliasing without adding illicit assay predictors.
    feature_collisions = defaultdict(set)
    for row in combined:
        fingerprint = tuple(row.get(field,"") for field in NUMERIC + CATEGORICAL)
        feature_collisions[fingerprint].add(row["reported_direction"])
    opposing_states = sum(1 for v in feature_collisions.values() if len(v)>1)

    return {
        "status":"PASS_RB3_R1_PARTIAL_SOURCE_AUDIT",
        "additional_rows":len(r1_rows),
        "combined_candidate_rows":len(combined),
        "source_coverage":len({r["source_id"] for r in combined}),
        "lineage_coverage":len(lineages),
        "source_lineages":lineages,
        "predictor_collision_groups_with_different_labels":opposing_states,
        "r1_csv_sha256":hashlib.sha256(CANDIDATE.read_bytes()).hexdigest(),
        "r1_evidence_sha256":hashlib.sha256(EVIDENCE.read_bytes()).hexdigest(),
        "model_execution_authorized":False,
        "clinical_claim_authorized":False,
    }


if __name__=="__main__":
    print(json.dumps(validate(),sort_keys=True,indent=2))
