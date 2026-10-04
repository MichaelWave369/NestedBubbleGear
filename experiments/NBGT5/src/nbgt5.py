#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

STATUSES = {
    "OBSERVED",
    "CORROBORATED",
    "INFERRED",
    "DISPUTED",
    "ALLEGED",
    "REFUTED",
    "UNKNOWN",
}

ORIGINS = {"SOURCE_MAP", "ANALYST_HYPOTHESIS"}
EVENT_TYPES = {"RESOLVE_AMBIGUITY", "ADD_EXTERNAL_EVIDENCE"}
GENESIS = "GENESIS"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def validate_base(record):
    required = {
        "record_id",
        "origin_kind",
        "valid_time",
        "known_time",
        "subject",
        "relation",
        "object",
        "source_status",
        "provenance",
    }
    missing = sorted(required - set(record))
    if missing:
        raise ValueError(f"missing base fields: {missing}")
    if record["origin_kind"] not in ORIGINS:
        raise ValueError(f"unsupported origin_kind: {record['origin_kind']}")
    if record["source_status"] not in STATUSES:
        raise ValueError(f"unsupported source_status: {record['source_status']}")
    if record["known_time"] < record["valid_time"]:
        raise ValueError("known_time must be >= valid_time")
    return True


def validate_raw_event(event):
    required = {
        "event_id",
        "event_type",
        "target_record_id",
        "known_time",
        "reviewer_id",
        "reason",
        "payload",
        "provenance",
    }
    missing = sorted(required - set(event))
    if missing:
        raise ValueError(f"missing event fields: {missing}")
    if event["event_type"] not in EVENT_TYPES:
        raise ValueError(f"unsupported event_type: {event['event_type']}")
    if not isinstance(event["known_time"], int):
        raise ValueError("event known_time must be an integer")
    if event["event_type"] == "ADD_EXTERNAL_EVIDENCE":
        payload = event["payload"]
        required_payload = {"evidence_id", "status", "source"}
        miss = sorted(required_payload - set(payload))
        if miss:
            raise ValueError(f"missing evidence payload fields: {miss}")
        if payload["status"] not in STATUSES:
            raise ValueError(f"unsupported evidence status: {payload['status']}")
        required_source = {"source_id", "independence_group", "locator", "provenance"}
        miss_source = sorted(required_source - set(payload["source"]))
        if miss_source:
            raise ValueError(f"missing external source fields: {miss_source}")
    return True


def chain_events(raw_events):
    for event in raw_events:
        validate_raw_event(event)
    ordered = sorted((deepcopy(e) for e in raw_events), key=lambda e: (e["known_time"], e["event_id"]))
    chained = []
    prev = GENESIS
    for event in ordered:
        event["prev_hash"] = prev
        event["event_hash"] = digest({k: v for k, v in event.items() if k != "event_hash"})
        prev = event["event_hash"]
        chained.append(event)
    return chained


def validate_chain(events):
    prev = GENESIS
    for event in events:
        if event["prev_hash"] != prev:
            return False
        expected = digest({k: v for k, v in event.items() if k != "event_hash"})
        if event["event_hash"] != expected:
            return False
        prev = event["event_hash"]
    return True


def base_digest(records):
    for record in records:
        validate_base(record)
    ordered = sorted((deepcopy(r) for r in records), key=lambda r: r["record_id"])
    return digest(ordered)


def _item_from_base(record):
    return {
        "record_id": record["record_id"],
        "origin_kind": record["origin_kind"],
        "valid_time": record["valid_time"],
        "known_time": record["known_time"],
        "subject": record["subject"],
        "relation": record["relation"],
        "object": record["object"],
        "status": record["source_status"],
        "source_status": record["source_status"],
        "ambiguity": bool(record.get("ambiguity", False)),
        "provenance": deepcopy(record["provenance"]),
        "external_evidence": [],
        "applied_event_ids": [],
    }


def temporal_keyhole(
    records,
    events,
    *,
    knowledge_cutoff,
    statuses=None,
    relations=None,
    include_analyst_hypotheses=False,
):
    for record in records:
        validate_base(record)
    if not validate_chain(events):
        raise ValueError("invalid review ledger chain")

    by_id = {}
    for record in sorted(records, key=lambda r: r["record_id"]):
        if record["known_time"] > knowledge_cutoff:
            continue
        if record["origin_kind"] == "ANALYST_HYPOTHESIS" and not include_analyst_hypotheses:
            continue
        by_id[record["record_id"]] = _item_from_base(record)

    for event in events:
        if event["known_time"] > knowledge_cutoff:
            continue
        target = by_id.get(event["target_record_id"])
        if target is None:
            continue

        if event["event_type"] == "RESOLVE_AMBIGUITY":
            target["subject"] = event["payload"].get("subject", target["subject"])
            target["object"] = event["payload"].get("object", target["object"])
            target["ambiguity"] = False
            target["applied_event_ids"].append(event["event_id"])
        elif event["event_type"] == "ADD_EXTERNAL_EVIDENCE":
            evidence = deepcopy(event["payload"])
            evidence["ledger_event_id"] = event["event_id"]
            target["external_evidence"].append(evidence)
            target["status"] = evidence["status"]
            target["applied_event_ids"].append(event["event_id"])
        else:
            raise AssertionError(event["event_type"])

    items = list(by_id.values())
    if statuses is not None:
        wanted = set(statuses)
        items = [item for item in items if item["status"] in wanted]
    if relations is not None:
        wanted = set(relations)
        items = [item for item in items if item["relation"] in wanted]
    items.sort(key=lambda item: item["record_id"])

    visible_events = [e for e in events if e["known_time"] <= knowledge_cutoff]
    view = {
        "experiment": "NBG-T5",
        "version": VERSION,
        "knowledge_cutoff": knowledge_cutoff,
        "filters": {
            "statuses": sorted(set(statuses)) if statuses is not None else None,
            "relations": sorted(set(relations)) if relations is not None else None,
            "include_analyst_hypotheses": bool(include_analyst_hypotheses),
        },
        "items": items,
        "review_ledger_head": visible_events[-1]["event_hash"] if visible_events else GENESIS,
        "base_digest": base_digest(records),
    }
    view["view_hash"] = digest(view)
    return view


def provenance_bundle(record_id, records, events, *, knowledge_cutoff):
    base = next((deepcopy(r) for r in records if r["record_id"] == record_id), None)
    if base is None:
        raise KeyError(record_id)
    visible_events = [
        deepcopy(e)
        for e in events
        if e["target_record_id"] == record_id and e["known_time"] <= knowledge_cutoff
    ]
    visible_events.sort(key=lambda e: (e["known_time"], e["event_id"]))
    bundle = {
        "record_id": record_id,
        "knowledge_cutoff": knowledge_cutoff,
        "base_record": base,
        "review_events": visible_events,
        "base_digest": base_digest(records),
        "ledger_head_at_export": visible_events[-1]["event_hash"] if visible_events else GENESIS,
    }
    bundle["bundle_hash"] = digest(bundle)
    return bundle


def export_review(records, events, *, knowledge_cutoff):
    view = temporal_keyhole(
        records,
        events,
        knowledge_cutoff=knowledge_cutoff,
        include_analyst_hypotheses=True,
    )
    ordered_base = sorted((deepcopy(r) for r in records), key=lambda r: r["record_id"])
    visible_events = [
        deepcopy(e)
        for e in events
        if e["known_time"] <= knowledge_cutoff
    ]
    export = {
        "experiment": "NBG-T5",
        "version": VERSION,
        "knowledge_cutoff": knowledge_cutoff,
        "base_records": ordered_base,
        "review_ledger": visible_events,
        "derived_view": view,
        "base_digest": base_digest(records),
        "ledger_head": visible_events[-1]["event_hash"] if visible_events else GENESIS,
    }
    export["export_hash"] = digest(export)
    return export


def frozen_fixture():
    records = [
        {
            "record_id": "C1",
            "origin_kind": "SOURCE_MAP",
            "valid_time": 1,
            "known_time": 1,
            "subject": "NODE_A",
            "relation": "ALLEGED_LINK",
            "object": "NODE_B",
            "source_status": "ALLEGED",
            "provenance": {
                "layer": "SOURCE_MAP",
                "source_locator": "qweb:p1:fixture-arrow-1",
                "source_lineage": "QWEB_ORIGINAL",
            },
        },
        {
            "record_id": "A1",
            "origin_kind": "SOURCE_MAP",
            "valid_time": 1,
            "known_time": 1,
            "subject": "UNKNOWN",
            "relation": "ALLEGED_LINK",
            "object": "NODE_C",
            "source_status": "UNKNOWN",
            "ambiguity": True,
            "provenance": {
                "layer": "SOURCE_MAP",
                "source_locator": "qweb:p1:tiny-label-1",
                "source_lineage": "QWEB_ORIGINAL",
            },
        },
        {
            "record_id": "C2",
            "origin_kind": "SOURCE_MAP",
            "valid_time": 1,
            "known_time": 1,
            "subject": "EVENT_1",
            "relation": "OCCURRED_BEFORE",
            "object": "EVENT_2",
            "source_status": "OBSERVED",
            "provenance": {
                "layer": "SOURCE_MAP",
                "source_locator": "qweb:p1:center-timeline-1",
                "source_lineage": "QWEB_ORIGINAL",
            },
        },
        {
            "record_id": "H1",
            "origin_kind": "ANALYST_HYPOTHESIS",
            "valid_time": 1,
            "known_time": 1,
            "subject": "NODE_A",
            "relation": "INFERRED_INFLUENCE",
            "object": "NODE_C",
            "source_status": "INFERRED",
            "provenance": {
                "layer": "ANALYST_HYPOTHESIS",
                "source_locator": "analyst://nbgt5/hypothesis-1",
                "source_lineage": "ANALYST_SESSION_1",
            },
        },
    ]

    raw_events = [
        {
            "event_id": "RV1",
            "event_type": "RESOLVE_AMBIGUITY",
            "target_record_id": "A1",
            "known_time": 3,
            "reviewer_id": "REVIEWER_1",
            "reason": "synthetic label-resolution witness",
            "payload": {"subject": "NODE_X", "object": "NODE_C"},
            "provenance": {
                "layer": "REVIEW_EVENT",
                "locator": "review://nbgt5/RV1",
            },
        },
        {
            "event_id": "EV1",
            "event_type": "ADD_EXTERNAL_EVIDENCE",
            "target_record_id": "C1",
            "known_time": 4,
            "reviewer_id": "REVIEWER_1",
            "reason": "synthetic external-corroboration witness",
            "payload": {
                "evidence_id": "EXT_E1",
                "status": "CORROBORATED",
                "source": {
                    "source_id": "EXT_S1",
                    "independence_group": "EXT_G1",
                    "locator": "synthetic://external/source-1",
                    "provenance": "SYNTHETIC_EXTERNAL_EVIDENCE",
                },
            },
            "provenance": {
                "layer": "REVIEW_EVENT",
                "locator": "review://nbgt5/EV1",
            },
        },
    ]
    return records, raw_events


def run_suite():
    records, raw_events = frozen_fixture()
    events = chain_events(raw_events)

    k1 = temporal_keyhole(records, events, knowledge_cutoff=1)
    k3 = temporal_keyhole(records, events, knowledge_cutoff=3)
    k4 = temporal_keyhole(records, events, knowledge_cutoff=4)

    k4_corr = temporal_keyhole(records, events, knowledge_cutoff=4, statuses={"CORROBORATED"})
    k4_alleged = temporal_keyhole(records, events, knowledge_cutoff=4, relations={"ALLEGED_LINK"})
    k4_overlay_off = temporal_keyhole(records, events, knowledge_cutoff=4, include_analyst_hypotheses=False)
    k4_overlay_on = temporal_keyhole(records, events, knowledge_cutoff=4, include_analyst_hypotheses=True)

    a1_k1 = next(item for item in k1["items"] if item["record_id"] == "A1")
    a1_k3 = next(item for item in k3["items"] if item["record_id"] == "A1")
    c1_k1 = next(item for item in k1["items"] if item["record_id"] == "C1")
    c1_k4 = next(item for item in k4["items"] if item["record_id"] == "C1")

    bundle_c1 = provenance_bundle("C1", records, events, knowledge_cutoff=4)
    export_k4 = export_review(records, events, knowledge_cutoff=4)

    k1_with_full_ledger = canonical(k1)
    k1_with_truncated_ledger = canonical(
        temporal_keyhole(records, chain_events([]), knowledge_cutoff=1)
    )

    reversed_chain = chain_events(list(reversed(raw_events)))

    checks = [
        {
            "name": "append_only:base_ambiguity_not_overwritten",
            "pass": next(r for r in records if r["record_id"] == "A1")["subject"] == "UNKNOWN",
        },
        {
            "name": "ambiguity:not_resolved_before_event",
            "pass": a1_k1["subject"] == "UNKNOWN" and a1_k1["ambiguity"] is True,
        },
        {
            "name": "ambiguity:explicit_resolution_visible",
            "pass": a1_k3["subject"] == "NODE_X" and a1_k3["ambiguity"] is False and a1_k3["applied_event_ids"] == ["RV1"],
        },
        {
            "name": "bitemporal:future_review_does_not_rewrite_k1",
            "pass": k1_with_full_ledger == k1_with_truncated_ledger,
        },
        {
            "name": "evidence:external_hidden_before_known_time",
            "pass": c1_k1["status"] == "ALLEGED" and c1_k1["external_evidence"] == [],
        },
        {
            "name": "evidence:external_visible_at_k4",
            "pass": c1_k4["status"] == "CORROBORATED" and [x["evidence_id"] for x in c1_k4["external_evidence"]] == ["EXT_E1"],
        },
        {
            "name": "layers:source_status_preserved",
            "pass": c1_k4["source_status"] == "ALLEGED" and c1_k4["status"] == "CORROBORATED",
        },
        {
            "name": "filters:status",
            "pass": [x["record_id"] for x in k4_corr["items"]] == ["C1"],
        },
        {
            "name": "filters:relation_toggle",
            "pass": [x["record_id"] for x in k4_alleged["items"]] == ["A1", "C1"],
        },
        {
            "name": "overlay:analyst_off",
            "pass": "H1" not in [x["record_id"] for x in k4_overlay_off["items"]],
        },
        {
            "name": "overlay:analyst_on",
            "pass": "H1" in [x["record_id"] for x in k4_overlay_on["items"]],
        },
        {
            "name": "provenance:bundle_contains_base_and_event",
            "pass": bundle_c1["base_record"]["record_id"] == "C1" and [x["event_id"] for x in bundle_c1["review_events"]] == ["EV1"],
        },
        {
            "name": "independence:external_source_explicit",
            "pass": c1_k4["external_evidence"][0]["source"]["independence_group"] == "EXT_G1",
        },
        {
            "name": "ledger:hash_chain_valid",
            "pass": validate_chain(events),
        },
        {
            "name": "ledger:order_canonical",
            "pass": canonical(events) == canonical(reversed_chain),
        },
        {
            "name": "view:filters_do_not_mutate_ledger",
            "pass": k4_corr["review_ledger_head"] == k4["review_ledger_head"] == events[-1]["event_hash"],
        },
        {
            "name": "export:preserves_audit_chain",
            "pass": export_k4["base_digest"] == base_digest(records) and export_k4["ledger_head"] == events[-1]["event_hash"] and len(export_k4["review_ledger"]) == 2,
        },
        {
            "name": "replay:exact",
            "pass": canonical(k4) == canonical(temporal_keyhole(records, events, knowledge_cutoff=4)),
        },
    ]

    payload = {
        "experiment": "NBG-T5",
        "version": VERSION,
        "witness": {
            "k1_ambiguous_subject": a1_k1["subject"],
            "k3_resolved_subject": a1_k3["subject"],
            "c1_k1_status": c1_k1["status"],
            "c1_k4_source_status": c1_k4["source_status"],
            "c1_k4_review_status": c1_k4["status"],
            "status_filter_ids": [x["record_id"] for x in k4_corr["items"]],
            "relation_filter_ids": [x["record_id"] for x in k4_alleged["items"]],
            "overlay_off_ids": [x["record_id"] for x in k4_overlay_off["items"]],
            "overlay_on_ids": [x["record_id"] for x in k4_overlay_on["items"]],
            "ledger_head": events[-1]["event_hash"],
            "base_digest": base_digest(records),
        },
        "receipts": {
            "k1": k1,
            "k3": k3,
            "k4": k4,
            "provenance_bundle_c1": bundle_c1,
            "export_k4": export_k4,
        },
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = "PASS_NBGT5" if payload["checks_passed"] == payload["checks_total"] else "FAIL_NBGT5"
    payload["result_hash"] = digest(payload)
    return payload


def main():
    payload = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    records, raw_events = frozen_fixture()
    events = chain_events(raw_events)

    (out / "base_records.json").write_text(json.dumps(records, indent=2, sort_keys=True) + "\n")
    (out / "review_ledger.json").write_text(json.dumps(events, indent=2, sort_keys=True) + "\n")
    (out / "export_k4.json").write_text(json.dumps(payload["receipts"]["export_k4"], indent=2, sort_keys=True) + "\n")
    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)

    print(
        json.dumps(
            {
                "verdict": payload["verdict"],
                "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
                "k1_ambiguous": payload["witness"]["k1_ambiguous_subject"],
                "k3_resolved": payload["witness"]["k3_resolved_subject"],
                "c1_k1_status": payload["witness"]["c1_k1_status"],
                "c1_k4_source_status": payload["witness"]["c1_k4_source_status"],
                "c1_k4_review_status": payload["witness"]["c1_k4_review_status"],
                "result_sha256": hashlib.sha256(data).hexdigest(),
            },
            indent=2,
        )
    )
    if payload["verdict"] != "PASS_NBGT5":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
