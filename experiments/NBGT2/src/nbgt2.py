#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

RELATION_TYPES = {
    "OCCURRED_BEFORE",
    "MEMBER_OF",
    "FUNDED_BY",
    "OPERATED_BY",
    "DOCUMENTED_INTERACTION",
    "INFERRED_INFLUENCE",
    "ALLEGED_LINK",
    "CONTRADICTS",
    "SUPERSEDES",
}

EVIDENCE_STATUSES = {
    "OBSERVED",
    "CORROBORATED",
    "INFERRED",
    "DISPUTED",
    "ALLEGED",
    "REFUTED",
    "UNKNOWN",
}

# Composition is intentionally narrow. NBG-T2 refuses to invent semantics.
COMPOSITION_RULES = {
    ("OCCURRED_BEFORE", "OCCURRED_BEFORE"): "OCCURRED_BEFORE",
}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def normalize_assertion(assertion):
    a = deepcopy(assertion)
    a["sources"] = sorted(a.get("sources", []))
    return a


def validate_assertion(assertion):
    required = {
        "assertion_id",
        "subject",
        "relation",
        "object",
        "valid_time",
        "known_time",
        "provenance",
        "evidence_status",
        "sources",
    }
    missing = sorted(required - set(assertion))
    if missing:
        raise ValueError(f"missing assertion fields: {missing}")
    if assertion["relation"] not in RELATION_TYPES:
        raise ValueError(f"unsupported relation: {assertion['relation']}")
    if assertion["evidence_status"] not in EVIDENCE_STATUSES:
        raise ValueError(f"unsupported evidence status: {assertion['evidence_status']}")
    if not isinstance(assertion["valid_time"], int) or not isinstance(assertion["known_time"], int):
        raise ValueError("valid_time and known_time must be integers")
    if assertion["known_time"] < assertion["valid_time"]:
        raise ValueError("known_time must be >= valid_time in NBG-T2")
    if not isinstance(assertion["sources"], list):
        raise ValueError("sources must be a list")
    return True


def replay(assertions, *, world_cutoff, knowledge_cutoff, exclude_assertion_ids=()):
    excluded = tuple(sorted(exclude_assertion_ids))
    normalized = []
    for assertion in assertions:
        validate_assertion(assertion)
        a = normalize_assertion(assertion)
        if (
            a["valid_time"] <= world_cutoff
            and a["known_time"] <= knowledge_cutoff
            and a["assertion_id"] not in excluded
        ):
            normalized.append(a)

    normalized.sort(
        key=lambda a: (
            a["valid_time"],
            a["known_time"],
            a["subject"],
            a["relation"],
            a["object"],
            a["assertion_id"],
            tuple(a["sources"]),
        )
    )

    receipt = {
        "experiment": "NBG-T2",
        "version": VERSION,
        "mode": "COUNTERFACTUAL" if excluded else "OBSERVED",
        "world_cutoff": world_cutoff,
        "knowledge_cutoff": knowledge_cutoff,
        "excluded_assertion_ids": list(excluded),
        "assertions": normalized,
    }
    receipt["receipt_hash"] = digest(receipt)
    return receipt


def explicit_keyhole(receipt, *, allowed_relations):
    allowed = tuple(sorted(set(allowed_relations)))
    unknown = sorted(set(allowed) - RELATION_TYPES)
    if unknown:
        raise ValueError(f"unsupported Keyhole relation types: {unknown}")
    projected = [
        deepcopy(a) for a in receipt["assertions"] if a["relation"] in allowed
    ]
    return {
        "projection": "EXPLICIT_KEYHOLE",
        "allowed_relations": list(allowed),
        "assertions": projected,
    }


def compose(left, right):
    validate_assertion(left)
    validate_assertion(right)
    if left["object"] != right["subject"]:
        return {
            "status": "REFUSE_NONCOMPOSABLE_ENDPOINTS",
            "derived": None,
        }
    out_relation = COMPOSITION_RULES.get((left["relation"], right["relation"]))
    if out_relation is None:
        return {
            "status": "REFUSE_UNTYPED_COMPOSITION",
            "derived": None,
        }
    derived = {
        "assertion_id": f"DERIVED::{left['assertion_id']}::{right['assertion_id']}",
        "subject": left["subject"],
        "relation": out_relation,
        "object": right["object"],
        "valid_time": max(left["valid_time"], right["valid_time"]),
        "known_time": max(left["known_time"], right["known_time"]),
        "provenance": "TYPED_COMPOSITION",
        "evidence_status": "INFERRED",
        "sources": sorted([left["assertion_id"], right["assertion_id"]]),
    }
    validate_assertion(derived)
    return {
        "status": "COMPOSED_EXPLICIT_RULE",
        "derived": derived,
    }


def frozen_assertions():
    return [
        {
            "assertion_id": "T01_A_BEFORE_B",
            "subject": "A",
            "relation": "OCCURRED_BEFORE",
            "object": "B",
            "valid_time": 1,
            "known_time": 1,
            "provenance": "SYNTHETIC_CLOCK",
            "evidence_status": "OBSERVED",
            "sources": ["synthetic://clock-a"],
        },
        {
            "assertion_id": "T02_B_BEFORE_C",
            "subject": "B",
            "relation": "OCCURRED_BEFORE",
            "object": "C",
            "valid_time": 2,
            "known_time": 2,
            "provenance": "SYNTHETIC_CLOCK",
            "evidence_status": "OBSERVED",
            "sources": ["synthetic://clock-b"],
        },
        {
            "assertion_id": "T03_ALLEGED_LINK",
            "subject": "ORG_X",
            "relation": "ALLEGED_LINK",
            "object": "ORG_Y",
            "valid_time": 2,
            "known_time": 2,
            "provenance": "SOURCE_RED",
            "evidence_status": "ALLEGED",
            "sources": ["synthetic://red-2", "synthetic://red-1"],
        },
        {
            "assertion_id": "T04_CONTRADICTION",
            "subject": "claim:no-link-x-y",
            "relation": "CONTRADICTS",
            "object": "T03_ALLEGED_LINK",
            "valid_time": 2,
            "known_time": 3,
            "provenance": "SOURCE_BLUE",
            "evidence_status": "DISPUTED",
            "sources": ["synthetic://blue-1"],
        },
        {
            "assertion_id": "T05_LATE_CORROBORATION",
            "subject": "ORG_X",
            "relation": "ALLEGED_LINK",
            "object": "ORG_Y",
            "valid_time": 2,
            "known_time": 4,
            "provenance": "SOURCE_GREEN",
            "evidence_status": "CORROBORATED",
            "sources": ["synthetic://green-1", "synthetic://green-2"],
        },
        {
            "assertion_id": "T06_DOCUMENTED_MEETING",
            "subject": "PERSON_P",
            "relation": "DOCUMENTED_INTERACTION",
            "object": "ORG_X",
            "valid_time": 3,
            "known_time": 3,
            "provenance": "ARCHIVE_RECORD",
            "evidence_status": "CORROBORATED",
            "sources": ["synthetic://archive-1"],
        },
        {
            "assertion_id": "T07_INFERRED_INFLUENCE",
            "subject": "ORG_Y",
            "relation": "INFERRED_INFLUENCE",
            "object": "POLICY_Q",
            "valid_time": 4,
            "known_time": 5,
            "provenance": "ANALYST_MODEL",
            "evidence_status": "INFERRED",
            "sources": ["synthetic://analysis-1"],
        },
    ]


def reordered_equivalent(assertions):
    out = [deepcopy(a) for a in reversed(assertions)]
    for a in out:
        a["sources"] = list(reversed(a["sources"]))
    return out


def run_suite():
    assertions = frozen_assertions()
    early = replay(assertions, world_cutoff=5, knowledge_cutoff=2)
    middle = replay(assertions, world_cutoff=5, knowledge_cutoff=3)
    late = replay(assertions, world_cutoff=5, knowledge_cutoff=5)
    reordered = replay(reordered_equivalent(assertions), world_cutoff=5, knowledge_cutoff=5)

    by_id_early = {a["assertion_id"]: a for a in early["assertions"]}
    by_id_middle = {a["assertion_id"]: a for a in middle["assertions"]}
    by_id_late = {a["assertion_id"]: a for a in late["assertions"]}

    temporal_composition = compose(by_id_late["T01_A_BEFORE_B"], by_id_late["T02_B_BEFORE_C"])
    forbidden_composition = compose(by_id_late["T03_ALLEGED_LINK"], by_id_late["T07_INFERRED_INFLUENCE"])

    keyhole = explicit_keyhole(
        late,
        allowed_relations=("DOCUMENTED_INTERACTION", "OCCURRED_BEFORE"),
    )
    counterfactual = replay(
        assertions,
        world_cutoff=5,
        knowledge_cutoff=5,
        exclude_assertion_ids=("T03_ALLEGED_LINK",),
    )

    early_before = canonical(early)
    early_from_without_late = replay(
        [a for a in assertions if a["assertion_id"] != "T05_LATE_CORROBORATION"],
        world_cutoff=5,
        knowledge_cutoff=2,
    )

    checks = [
        {"name": "schema:all_assertions_valid", "pass": all(validate_assertion(a) for a in assertions)},
        {
            "name": "relation:chronology_not_promoted_to_influence",
            "pass": temporal_composition["derived"]["relation"] == "OCCURRED_BEFORE",
        },
        {
            "name": "relation:alleged_never_canonicalizes_to_documented",
            "pass": by_id_late["T03_ALLEGED_LINK"]["relation"] == "ALLEGED_LINK"
            and by_id_late["T05_LATE_CORROBORATION"]["relation"] == "ALLEGED_LINK",
        },
        {
            "name": "contradiction:coexists_with_disputed_claim",
            "pass": "T03_ALLEGED_LINK" in by_id_middle and "T04_CONTRADICTION" in by_id_middle,
        },
        {
            "name": "bitemporal:late_corroboration_not_visible_early",
            "pass": "T05_LATE_CORROBORATION" not in by_id_early,
        },
        {
            "name": "bitemporal:late_corroboration_visible_later",
            "pass": by_id_late["T05_LATE_CORROBORATION"]["evidence_status"] == "CORROBORATED",
        },
        {
            "name": "bitemporal:no_hindsight_rewrite",
            "pass": early_before == canonical(early_from_without_late),
        },
        {
            "name": "keyhole:projection_is_explicit",
            "pass": keyhole["projection"] == "EXPLICIT_KEYHOLE"
            and set(a["relation"] for a in keyhole["assertions"]) <= {"DOCUMENTED_INTERACTION", "OCCURRED_BEFORE"}
            and len(keyhole["assertions"]) < len(late["assertions"]),
        },
        {
            "name": "counterfactual:separate_from_observed",
            "pass": counterfactual["mode"] == "COUNTERFACTUAL"
            and late["mode"] == "OBSERVED"
            and counterfactual["excluded_assertion_ids"] == ["T03_ALLEGED_LINK"]
            and "T03_ALLEGED_LINK" not in {a["assertion_id"] for a in counterfactual["assertions"]},
        },
        {
            "name": "canonical:input_and_source_order_irrelevant",
            "pass": canonical(late) == canonical(reordered),
        },
        {
            "name": "composition:compatible_type_composes",
            "pass": temporal_composition["status"] == "COMPOSED_EXPLICIT_RULE"
            and temporal_composition["derived"]["subject"] == "A"
            and temporal_composition["derived"]["object"] == "C",
        },
        {
            "name": "composition:incompatible_types_refused",
            "pass": forbidden_composition["status"] == "REFUSE_UNTYPED_COMPOSITION"
            and forbidden_composition["derived"] is None,
        },
    ]

    payload = {
        "experiment": "NBG-T2",
        "version": VERSION,
        "witness": {
            "early_assertion_ids": [a["assertion_id"] for a in early["assertions"]],
            "middle_assertion_ids": [a["assertion_id"] for a in middle["assertions"]],
            "late_assertion_ids": [a["assertion_id"] for a in late["assertions"]],
            "late_corroboration_relation": by_id_late["T05_LATE_CORROBORATION"]["relation"],
            "late_corroboration_status": by_id_late["T05_LATE_CORROBORATION"]["evidence_status"],
            "temporal_composition": temporal_composition,
            "forbidden_composition": forbidden_composition,
            "keyhole_relations": sorted({a["relation"] for a in keyhole["assertions"]}),
            "counterfactual_excluded": counterfactual["excluded_assertion_ids"],
        },
        "receipts": {
            "early": early,
            "middle": middle,
            "late": late,
            "counterfactual": counterfactual,
            "keyhole": keyhole,
        },
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = "PASS_NBGT2" if payload["checks_passed"] == payload["checks_total"] else "FAIL_NBGT2"
    payload["result_hash"] = digest(payload)
    return payload


def main():
    payload = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    assertions = frozen_assertions()
    (out / "assertions.json").write_text(json.dumps(assertions, indent=2, sort_keys=True) + "\n")
    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)

    print(json.dumps({
        "verdict": payload["verdict"],
        "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
        "late_corroboration": [
            payload["witness"]["late_corroboration_relation"],
            payload["witness"]["late_corroboration_status"],
        ],
        "temporal_composition": payload["witness"]["temporal_composition"]["derived"]["relation"],
        "forbidden_composition": payload["witness"]["forbidden_composition"]["status"],
        "result_sha256": hashlib.sha256(data).hexdigest(),
        "assertions_sha256": hashlib.sha256((out / "assertions.json").read_bytes()).hexdigest(),
    }, indent=2))

    if payload["verdict"] != "PASS_NBGT2":
        raise SystemExit(1)


if __name__ == "__main__":
    main()