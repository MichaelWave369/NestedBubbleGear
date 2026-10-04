#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

EVIDENCE_STATUSES = {
    "OBSERVED",
    "CORROBORATED",
    "INFERRED",
    "DISPUTED",
    "ALLEGED",
    "REFUTED",
    "UNKNOWN",
}

KINDS = {"SET_MACRO", "SET_LATENT", "ASSERT_CLAIM", "PROBE_LATENT"}

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()

def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()

def validate_event(event):
    required = {"event_id", "valid_time", "known_time", "kind", "payload", "provenance"}
    missing = sorted(required - set(event))
    if missing:
        raise ValueError(f"missing event fields: {missing}")
    if event["kind"] not in KINDS:
        raise ValueError(f"unsupported kind: {event['kind']}")
    if not isinstance(event["valid_time"], int) or not isinstance(event["known_time"], int):
        raise ValueError("times must be integers in NBG-T1")
    if event["known_time"] < event["valid_time"]:
        raise ValueError("known_time must be >= valid_time in NBG-T1")
    if event["kind"] == "ASSERT_CLAIM":
        status = event.get("evidence_status")
        if status not in EVIDENCE_STATUSES:
            raise ValueError(f"invalid evidence status: {status}")
        if "sources" not in event or not isinstance(event["sources"], list):
            raise ValueError("ASSERT_CLAIM requires a sources list")
        payload_required = {"claim_id", "subject", "predicate", "object"}
        missing_payload = sorted(payload_required - set(event["payload"]))
        if missing_payload:
            raise ValueError(f"missing claim payload fields: {missing_payload}")
    return True

def blank_state():
    return {
        "macro": {},
        "latent": {},
        "claims": {},
        "observations": [],
    }

def apply_event(state, event):
    kind = event["kind"]
    payload = event["payload"]

    if kind == "SET_MACRO":
        state["macro"][payload["key"]] = payload["value"]
    elif kind == "SET_LATENT":
        state["latent"][payload["key"]] = payload["value"]
    elif kind == "ASSERT_CLAIM":
        state["claims"][payload["claim_id"]] = {
            "subject": payload["subject"],
            "predicate": payload["predicate"],
            "object": payload["object"],
            "evidence_status": event["evidence_status"],
            "sources": list(event["sources"]),
            "provenance": event["provenance"],
            "valid_time": event["valid_time"],
            "known_time": event["known_time"],
        }
    elif kind == "PROBE_LATENT":
        key = payload["key"]
        state["observations"].append({
            "event_id": event["event_id"],
            "probe": key,
            "value": state["latent"].get(key, "UNKNOWN"),
        })
    else:
        raise AssertionError(kind)

def replay(events, *, world_cutoff, knowledge_cutoff, exclude_event_ids=()):
    excluded = tuple(sorted(exclude_event_ids))
    for event in events:
        validate_event(event)

    selected = [
        deepcopy(event)
        for event in events
        if event["valid_time"] <= world_cutoff
        and event["known_time"] <= knowledge_cutoff
        and event["event_id"] not in excluded
    ]
    selected.sort(key=lambda e: (e["valid_time"], e["known_time"], e["event_id"]))

    state = blank_state()
    for event in selected:
        apply_event(state, event)

    lineage = [e["event_id"] for e in selected if e["kind"] != "ASSERT_CLAIM"]
    receipt = {
        "experiment": "NBG-T1",
        "version": VERSION,
        "mode": "COUNTERFACTUAL" if excluded else "OBSERVED",
        "world_cutoff": world_cutoff,
        "knowledge_cutoff": knowledge_cutoff,
        "excluded_event_ids": list(excluded),
        "applied_event_ids": [e["event_id"] for e in selected],
        "lineage_event_ids": lineage,
        "lineage_digest": digest(lineage),
        "state": state,
    }
    receipt["receipt_hash"] = digest(receipt)
    return receipt

def coarse_keyhole(receipt):
    return {"macro": deepcopy(receipt["state"]["macro"])}

def full_keyhole(receipt):
    return {
        "macro": deepcopy(receipt["state"]["macro"]),
        "latent": deepcopy(receipt["state"]["latent"]),
    }

def frozen_histories():
    history_a = [
        {
            "event_id": "A1_ROUTE",
            "valid_time": 1,
            "known_time": 1,
            "kind": "SET_LATENT",
            "payload": {"key": "route", "value": "NORTH"},
            "provenance": "SYNTHETIC_WITNESS",
        },
        {
            "event_id": "A2_READY",
            "valid_time": 2,
            "known_time": 2,
            "kind": "SET_MACRO",
            "payload": {"key": "status", "value": "READY"},
            "provenance": "SYNTHETIC_WITNESS",
        },
        {
            "event_id": "A3_LATE_CLAIM",
            "valid_time": 2,
            "known_time": 4,
            "kind": "ASSERT_CLAIM",
            "payload": {
                "claim_id": "CLAIM_ROUTE_NORTH",
                "subject": "history_a",
                "predicate": "used_route",
                "object": "NORTH",
            },
            "provenance": "LATE_SYNTHETIC_RECORD",
            "evidence_status": "CORROBORATED",
            "sources": ["synthetic://source-1", "synthetic://source-2"],
        },
        {
            "event_id": "A4_PROBE",
            "valid_time": 3,
            "known_time": 3,
            "kind": "PROBE_LATENT",
            "payload": {"key": "route"},
            "provenance": "ADMISSIBLE_PROBE",
        },
    ]

    history_b = [
        {
            "event_id": "B1_ROUTE",
            "valid_time": 1,
            "known_time": 1,
            "kind": "SET_LATENT",
            "payload": {"key": "route", "value": "SOUTH"},
            "provenance": "SYNTHETIC_WITNESS",
        },
        {
            "event_id": "B2_READY",
            "valid_time": 2,
            "known_time": 2,
            "kind": "SET_MACRO",
            "payload": {"key": "status", "value": "READY"},
            "provenance": "SYNTHETIC_WITNESS",
        },
        {
            "event_id": "B4_PROBE",
            "valid_time": 3,
            "known_time": 3,
            "kind": "PROBE_LATENT",
            "payload": {"key": "route"},
            "provenance": "ADMISSIBLE_PROBE",
        },
    ]
    return history_a, history_b

def run_suite():
    history_a, history_b = frozen_histories()

    a_t2_k2 = replay(history_a, world_cutoff=2, knowledge_cutoff=2)
    b_t2_k2 = replay(history_b, world_cutoff=2, knowledge_cutoff=2)
    a_t3_k3 = replay(history_a, world_cutoff=3, knowledge_cutoff=3)
    b_t3_k3 = replay(history_b, world_cutoff=3, knowledge_cutoff=3)
    a_t2_k4 = replay(history_a, world_cutoff=2, knowledge_cutoff=4)

    # Same earlier knowledge cutoff, with and without the future late-evidence event.
    a_without_late = replay(
        [e for e in history_a if e["event_id"] != "A3_LATE_CLAIM"],
        world_cutoff=2,
        knowledge_cutoff=2,
    )

    counterfactual = replay(
        history_a,
        world_cutoff=3,
        knowledge_cutoff=3,
        exclude_event_ids=("A1_ROUTE",),
    )
    counterfactual_replay = replay(
        history_a,
        world_cutoff=3,
        knowledge_cutoff=3,
        exclude_event_ids=("A1_ROUTE",),
    )

    a_probe = a_t3_k3["state"]["observations"][-1]["value"]
    b_probe = b_t3_k3["state"]["observations"][-1]["value"]
    cf_probe = counterfactual["state"]["observations"][-1]["value"]

    checks = [
        {
            "name": "schema:all_events_valid",
            "pass": all(validate_event(e) for e in history_a + history_b),
        },
        {
            "name": "keyhole:coarse_equivalent_at_t2",
            "pass": coarse_keyhole(a_t2_k2) == coarse_keyhole(b_t2_k2)
            and coarse_keyhole(a_t2_k2) == {"macro": {"status": "READY"}},
        },
        {
            "name": "lineage:full_state_non_equivalent",
            "pass": full_keyhole(a_t2_k2) != full_keyhole(b_t2_k2),
        },
        {
            "name": "lineage:digest_non_equivalent",
            "pass": a_t2_k2["lineage_digest"] != b_t2_k2["lineage_digest"],
        },
        {
            "name": "probe:future_divergence",
            "pass": a_probe == "NORTH" and b_probe == "SOUTH" and a_probe != b_probe,
        },
        {
            "name": "bitemporal:late_claim_hidden_before_known_time",
            "pass": "CLAIM_ROUTE_NORTH" not in a_t2_k2["state"]["claims"],
        },
        {
            "name": "bitemporal:late_claim_visible_after_known_time",
            "pass": (
                a_t2_k4["state"]["claims"].get("CLAIM_ROUTE_NORTH", {}).get("evidence_status")
                == "CORROBORATED"
            ),
        },
        {
            "name": "bitemporal:no_hindsight_mutation",
            "pass": canonical(a_t2_k2) == canonical(a_without_late),
        },
        {
            "name": "counterfactual:separated_and_deterministic",
            "pass": (
                counterfactual["mode"] == "COUNTERFACTUAL"
                and counterfactual["excluded_event_ids"] == ["A1_ROUTE"]
                and cf_probe == "UNKNOWN"
                and canonical(counterfactual) == canonical(counterfactual_replay)
            ),
        },
        {
            "name": "replay:observed_exact",
            "pass": canonical(a_t3_k3)
            == canonical(replay(history_a, world_cutoff=3, knowledge_cutoff=3)),
        },
    ]

    payload = {
        "experiment": "NBG-T1",
        "version": VERSION,
        "witness": {
            "coarse_a_t2": coarse_keyhole(a_t2_k2),
            "coarse_b_t2": coarse_keyhole(b_t2_k2),
            "full_a_t2": full_keyhole(a_t2_k2),
            "full_b_t2": full_keyhole(b_t2_k2),
            "probe_a_t3": a_probe,
            "probe_b_t3": b_probe,
            "late_claim_visible_k2": "CLAIM_ROUTE_NORTH" in a_t2_k2["state"]["claims"],
            "late_claim_visible_k4": "CLAIM_ROUTE_NORTH" in a_t2_k4["state"]["claims"],
            "counterfactual_probe_without_A1": cf_probe,
        },
        "receipts": {
            "a_t2_k2": a_t2_k2,
            "b_t2_k2": b_t2_k2,
            "a_t3_k3": a_t3_k3,
            "b_t3_k3": b_t3_k3,
            "a_t2_k4": a_t2_k4,
            "counterfactual_without_A1": counterfactual,
        },
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = (
        "PASS_NBGT1" if payload["checks_passed"] == payload["checks_total"] else "FAIL_NBGT1"
    )
    payload["result_hash"] = digest(payload)
    return payload

def main():
    payload = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    history_a, history_b = frozen_histories()

    (out / "history_a.json").write_text(
        json.dumps(history_a, indent=2, sort_keys=True) + "\n"
    )
    (out / "history_b.json").write_text(
        json.dumps(history_b, indent=2, sort_keys=True) + "\n"
    )
    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)

    print(
        json.dumps(
            {
                "verdict": payload["verdict"],
                "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
                "coarse_equal": payload["witness"]["coarse_a_t2"]
                == payload["witness"]["coarse_b_t2"],
                "future_probe": [
                    payload["witness"]["probe_a_t3"],
                    payload["witness"]["probe_b_t3"],
                ],
                "late_claim_visible": [
                    payload["witness"]["late_claim_visible_k2"],
                    payload["witness"]["late_claim_visible_k4"],
                ],
                "counterfactual_probe": payload["witness"][
                    "counterfactual_probe_without_A1"
                ],
                "result_sha256": hashlib.sha256(data).hexdigest(),
            },
            indent=2,
        )
    )

    if payload["verdict"] != "PASS_NBGT1":
        raise SystemExit(1)

if __name__ == "__main__":
    main()
