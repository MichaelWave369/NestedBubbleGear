#!/usr/bin/env python3
"""Static-only source-backed RB3-R0 extraction audit. Does not fit any model."""
from __future__ import annotations

import csv
import hashlib
import json
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RB2 = ROOT.parents[1] / "RB2"
CSV_PATH = ROOT / "candidate_rows.csv"
EVIDENCE_PATH = ROOT / "row_evidence.json"
QUEUE_PATH = ROOT / "extraction_queue.json"

EXTRACTION_COLUMNS = (
    "row_id", "source_id", "lineage_id", "species", "sample_class", "system_class",
    "endpoint_class", "frequency_hz", "field_type", "amplitude_value_si",
    "amplitude_original", "waveform", "duty_cycle", "exposure_duration_s",
    "repeated_exposure_count", "geometry_or_orientation", "sham_control_present",
    "reported_direction", "reported_significance", "effect_size_value",
    "effect_size_type", "mechanism_claim_class", "bubble_from", "bubble_to",
    "value_origin", "source_locator", "extraction_note",
)
BUBBLES = (
    "B0_FIELD", "B1_MEMBRANE_CHANNEL", "B2_INTRACELLULAR_SIGNAL",
    "B3_TRANSCRIPTION_CELL_STATE", "B4_CELL_BEHAVIOR_PATTERN",
    "B5_TISSUE_FUNCTION",
)
TARGETS = ("INCREASE", "DECREASE", "NULL")


def _read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


def parse_p(value: str) -> tuple[str, float]:
    m = re.fullmatch(r"(<|<=|>|>=)?(0(?:\.\d+)?|1(?:\.0+)?)", value.strip())
    if not m:
        raise ValueError(f"invalid source p-value {value!r}")
    return (m.group(1) or "=", float(m.group(2)))


def p_is_significant(value: str) -> bool:
    op, p = parse_p(value)
    if op == "<":
        return p <= 0.05
    if op == "<=":
        return p < 0.05
    if op in (">", ">="):
        raise ValueError("direction-ambiguous p-value bound cannot support a row")
    return p < 0.05


def parse_amplitude_mt(value: str) -> float:
    m = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?) mT", value)
    if not m:
        raise ValueError(f"only exact source-backed mT conditions are allowed: {value}")
    return float(m.group(1)) / 1000.0


def audit() -> dict:
    manifest = _read_json(RB2 / "corpus_manifest.json")
    schema = _read_json(RB2 / "extraction_schema.json")
    queue = _read_json(QUEUE_PATH)
    evidence = _read_json(EVIDENCE_PATH)
    sources = {x["id"]: x for x in manifest["records"]}

    assert len(sources) == 14, "RB2 source set drift"
    assert set(queue["source_ids"]) == set(sources), "extraction queue missing source"
    assert queue["complete"] is False, "partial corpus must remain incomplete"
    assert queue["model_execution_authorized"] is False, "partial corpus cannot authorize execution"
    assert len(queue["entries"]) == len(sources), "source review queue incomplete"
    assert {e["source_id"] for e in queue["entries"]} == set(sources), "queue source drift"
    assert set(schema["required_fields"]) == set(EXTRACTION_COLUMNS), "RB2 schema drift"

    with CSV_PATH.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        assert tuple(reader.fieldnames or ()) == EXTRACTION_COLUMNS, "CSV schema mismatch"
        rows = list(reader)

    assert rows, "no audited rows"
    assert len({r["row_id"] for r in rows}) == len(rows), "duplicate row ID"
    assert evidence["source_id"] == "RB2-S001", "source receipt drift"
    receipts = {r["row_id"]: r for r in evidence["records"]}
    assert set(receipts) == {r["row_id"] for r in rows}, "evidence/row set mismatch"
    assert len(receipts) == len(evidence["records"]), "duplicate evidence IDs"

    for row in rows:
        assert set(row) == set(EXTRACTION_COLUMNS), "unexpected CSV field"
        assert row["source_id"] in sources, "source outside RB2 frozen set"
        source = sources[row["source_id"]]
        assert row["lineage_id"] == source["lineage"], "source-lineage mismatch"
        assert row["endpoint_class"] in schema["enums"]["endpoint_class"]
        assert row["reported_direction"] in TARGETS, "invalid target label"
        assert row["reported_significance"] in schema["enums"]["reported_significance"]
        assert row["mechanism_claim_class"] in schema["enums"]["mechanism_claim_class"]
        assert row["value_origin"] in schema["enums"]["value_origin"]
        assert row["bubble_from"] in BUBBLES and row["bubble_to"] in BUBBLES
        assert row["sham_control_present"] == "true"
        assert row["source_locator"] == evidence["source_url"]
        assert row["frequency_hz"], "frequency missing"
        frequency = float(row["frequency_hz"])
        assert math.isfinite(frequency) and frequency > 0
        assert frequency in source["frequency_hz"], "frequency not in source"
        assert row["amplitude_original"] in source["amplitude"], "amplitude not in source"
        amplitude = parse_amplitude_mt(row["amplitude_original"])
        actual_amplitude = float(row["amplitude_value_si"])
        assert math.isfinite(actual_amplitude)
        assert math.isclose(amplitude, actual_amplitude, abs_tol=1e-12, rel_tol=0), "incorrect SI conversion"
        assert row["value_origin"] == "DERIVED_UNIT_CONVERSION"
        assert row["exposure_duration_s"] == "3600", "source 1h/session drift"
        assert row["repeated_exposure_count"] == "3", "source 3 days drift"
        assert row["duty_cycle"] == "", "unknown duty cycle must remain blank"
        assert row["geometry_or_orientation"] == "", "unknown orientation must remain blank"
        assert row["effect_size_value"] == "", "do not reclassify assay mean as effect size"
        assert row["effect_size_type"] == ""
        assert row["mechanism_claim_class"] == "UNRESOLVED"
        assert row["reported_significance"] in ("SIGNIFICANT", "NOT_SIGNIFICANT")
        ev = receipts[row["row_id"]]
        assert ev["reference"] == row["source_locator"]
        assert ev["figure"] in ("Figure 3B", "Figure 3C", "Figure 3G")
        assert ev["mean"] > 0 and ev["comparator_mean"] > 0
        significant = p_is_significant(ev["p_vs_sham"])
        assert significant == (row["reported_significance"] == "SIGNIFICANT"), "p/significance mismatch"
        assert row["reported_direction"] == ("INCREASE" if significant else "NULL"), "p/target mismatch"
        assert "does not mean zero biological effect" in row["extraction_note"], "NULL semantics missing"

    lineage_ids = {r["lineage_id"] for r in rows}
    coverage = len(lineage_ids)
    assert coverage < 11, "R0 expected partial extraction only"
    return {
        "status": "PASS_RB3_R0_PARTIAL_EXTRACTION_AUDIT",
        "candidate_row_count": len(rows),
        "source_coverage": len({r["source_id"] for r in rows}),
        "lineage_coverage": coverage,
        "rb2_source_count": len(sources),
        "model_execution_authorized": False,
        "candidate_csv_sha256": hashlib.sha256(CSV_PATH.read_bytes()).hexdigest(),
        "candidate_evidence_sha256": hashlib.sha256(EVIDENCE_PATH.read_bytes()).hexdigest(),
        "note": "Partial source-backed audit only; not an RB3 scientific result.",
    }


if __name__ == "__main__":
    print(json.dumps(audit(), indent=2, sort_keys=True))
