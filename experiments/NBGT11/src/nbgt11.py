#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]
GENESIS = "GENESIS"

T10_PATH = ROOT.parent / "NBGT10" / "src" / "nbgt10.py"
_spec = importlib.util.spec_from_file_location("nbgt10_for_t11", T10_PATH)
t10 = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = t10
_spec.loader.exec_module(t10)


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def make_temporal_policy(
    *,
    policy_version_id,
    family_id,
    revision,
    policy_kind,
    valid_from,
    valid_until,
    known_at,
    priority,
    t10_policy,
):
    if policy_kind not in {"NORMAL", "EMERGENCY"}:
        raise ValueError("unsupported policy kind")
    if valid_until < valid_from:
        raise ValueError("invalid valid-time interval")
    t10.validate_policy(t10_policy, known_time=max(t10_policy["effective_from"], min(known_at, t10_policy["effective_until"])))
    row = {
        "experiment": "NBG-T11",
        "version": VERSION,
        "policy_version_id": policy_version_id,
        "family_id": family_id,
        "revision": int(revision),
        "policy_kind": policy_kind,
        "valid_from": int(valid_from),
        "valid_until": int(valid_until),
        "known_at": int(known_at),
        "priority": int(priority),
        "t10_policy": deepcopy(t10_policy),
    }
    row["record_hash"] = sha256_obj(row)
    return row


def validate_temporal_policy(row):
    frozen = deepcopy(row)
    expected = frozen.pop("record_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("temporal policy record hash mismatch")
    if row["valid_until"] < row["valid_from"]:
        raise ValueError("invalid temporal policy validity interval")
    t10.validate_policy(
        row["t10_policy"],
        known_time=max(
            row["t10_policy"]["effective_from"],
            min(row["known_at"], row["t10_policy"]["effective_until"]),
        ),
    )
    return True


def make_ledger_event(
    *,
    event_id,
    event_type,
    known_time,
    valid_time,
    target_policy_version_id,
    payload,
    prev_hash,
):
    if event_type not in {
        "REGISTER_POLICY",
        "SUPERSEDE_POLICY",
        "ACTIVATE_EMERGENCY",
        "DEACTIVATE_EMERGENCY",
    }:
        raise ValueError("unsupported policy-ledger event")
    row = {
        "experiment": "NBG-T11",
        "version": VERSION,
        "event_id": event_id,
        "event_type": event_type,
        "known_time": int(known_time),
        "valid_time": int(valid_time),
        "target_policy_version_id": target_policy_version_id,
        "payload": deepcopy(payload),
        "prev_hash": prev_hash,
    }
    row["event_hash"] = sha256_obj(row)
    return row


def build_policy_ledger(event_specs):
    rows = []
    prev = GENESIS
    ordered = sorted(event_specs, key=lambda e: (e["known_time"], e["event_id"]))
    for spec in ordered:
        event = make_ledger_event(
            event_id=spec["event_id"],
            event_type=spec["event_type"],
            known_time=spec["known_time"],
            valid_time=spec["valid_time"],
            target_policy_version_id=spec["target_policy_version_id"],
            payload=spec.get("payload", {}),
            prev_hash=prev,
        )
        rows.append(event)
        prev = event["event_hash"]
    return rows


def validate_policy_ledger(events):
    prev = GENESIS
    last_key = None
    for event in events:
        frozen = deepcopy(event)
        expected = frozen.pop("event_hash")
        if sha256_obj(frozen) != expected:
            raise ValueError("policy ledger event hash mismatch")
        if event["prev_hash"] != prev:
            raise ValueError("policy ledger chain break")
        key = (event["known_time"], event["event_id"])
        if last_key is not None and key < last_key:
            raise ValueError("policy ledger not in canonical order")
        prev = event["event_hash"]
        last_key = key
    return prev


def visible_events(events, known_cutoff):
    validate_policy_ledger(events)
    return [deepcopy(e) for e in events if e["known_time"] <= known_cutoff]


def ledger_head_at(events, known_cutoff):
    rows = visible_events(events, known_cutoff)
    return rows[-1]["event_hash"] if rows else GENESIS


def _policy_index(policy_records):
    index = {}
    for row in policy_records:
        validate_temporal_policy(row)
        pid = row["policy_version_id"]
        if pid in index:
            raise ValueError(f"duplicate policy version: {pid}")
        index[pid] = row
    return index


def policy_visibility(policy_records, events, known_cutoff):
    index = _policy_index(policy_records)
    visible = visible_events(events, known_cutoff)
    registered = {
        e["target_policy_version_id"]
        for e in visible
        if e["event_type"] == "REGISTER_POLICY"
    }
    for pid in registered:
        if pid not in index:
            raise ValueError("ledger registers unknown policy version")
    return sorted(registered)


def _visible_supersessions(events, known_cutoff, valid_time):
    return [
        e
        for e in visible_events(events, known_cutoff)
        if e["event_type"] == "SUPERSEDE_POLICY" and e["valid_time"] <= valid_time
    ]


def emergency_state(policy_version_id, events, *, known_cutoff, valid_time):
    state = "INACTIVE"
    for event in visible_events(events, known_cutoff):
        if event["target_policy_version_id"] != policy_version_id:
            continue
        if event["valid_time"] > valid_time:
            continue
        if event["event_type"] == "ACTIVATE_EMERGENCY":
            state = "ACTIVE"
        elif event["event_type"] == "DEACTIVATE_EMERGENCY":
            state = "INACTIVE"
    return state


def policy_status_at(policy_version_id, policy_records, events, *, known_cutoff, valid_time):
    index = _policy_index(policy_records)
    row = index[policy_version_id]
    registered = set(policy_visibility(policy_records, events, known_cutoff))
    if policy_version_id not in registered:
        return "NOT_YET_KNOWN"
    if not (row["valid_from"] <= valid_time <= row["valid_until"]):
        return "OUT_OF_VALIDITY"
    if row["policy_kind"] == "EMERGENCY":
        return emergency_state(
            policy_version_id,
            events,
            known_cutoff=known_cutoff,
            valid_time=valid_time,
        )
    for event in _visible_supersessions(events, known_cutoff, valid_time):
        if event["target_policy_version_id"] == policy_version_id:
            replacement = event["payload"].get("replacement_policy_version_id")
            if replacement in registered:
                return "SUPERSEDED"
    return "ACTIVE"


def governance_keyhole(policy_records, events, *, known_cutoff, valid_time):
    index = _policy_index(policy_records)
    registered = policy_visibility(policy_records, events, known_cutoff)

    active = []
    statuses = {}
    for pid in registered:
        status = policy_status_at(
            pid,
            policy_records,
            events,
            known_cutoff=known_cutoff,
            valid_time=valid_time,
        )
        statuses[pid] = status
        if status in {"ACTIVE"}:
            active.append(index[pid])

    emergency = [p for p in active if p["policy_kind"] == "EMERGENCY"]
    normal = [p for p in active if p["policy_kind"] == "NORMAL"]
    pool = emergency if emergency else normal
    selected = None
    if pool:
        selected = sorted(
            pool,
            key=lambda p: (p["priority"], p["revision"], p["policy_version_id"]),
            reverse=True,
        )[0]

    view = {
        "experiment": "NBG-T11",
        "version": VERSION,
        "known_cutoff": int(known_cutoff),
        "valid_time": int(valid_time),
        "visible_event_ids": [e["event_id"] for e in visible_events(events, known_cutoff)],
        "ledger_head": ledger_head_at(events, known_cutoff),
        "visible_policy_version_ids": registered,
        "policy_statuses": dict(sorted(statuses.items())),
        "selected_policy_version_id": selected["policy_version_id"] if selected else None,
        "selected_policy_record_hash": selected["record_hash"] if selected else None,
        "selected_t10_policy_sha256": selected["t10_policy"]["policy_sha256"] if selected else None,
    }
    view["keyhole_hash"] = sha256_obj(view)
    return view


def resolve_keyhole(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    events,
    capture_id,
    known_cutoff,
    valid_time,
):
    keyhole = governance_keyhole(
        policy_records,
        events,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
    )
    pid = keyhole["selected_policy_version_id"]
    if pid is None:
        raise ValueError("no active governance policy at keyhole")
    row = _policy_index(policy_records)[pid]

    inner = t10.resolve_conflict(
        bundle=bundle,
        capture_id=capture_id,
        reviewer_registry=reviewer_registry,
        policy=row["t10_policy"],
        known_time=known_cutoff,
        expected_manifest_hash=bundle["manifest"]["manifest_hash"],
        expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
    )
    receipt = {
        "experiment": "NBG-T11",
        "version": VERSION,
        "receipt_type": "TEMPORAL_GOVERNANCE_RESOLUTION",
        "capture_id": capture_id,
        "known_cutoff": int(known_cutoff),
        "valid_time": int(valid_time),
        "policy_version_id": pid,
        "policy_record_hash": row["record_hash"],
        "policy_ledger_head": keyhole["ledger_head"],
        "keyhole_hash": keyhole["keyhole_hash"],
        "t10_resolution_receipt": inner,
        "truth_claim": "NONE_TEMPORAL_POLICY_OUTCOME_IS_OBJECTIVE_TRUTH",
    }
    receipt["receipt_hash"] = sha256_obj(receipt)
    return receipt


def replay_keyhole_receipt(
    receipt,
    *,
    bundle,
    reviewer_registry,
    policy_records,
    events,
):
    frozen = deepcopy(receipt)
    expected = frozen.pop("receipt_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("temporal governance receipt hash mismatch")
    rebuilt = resolve_keyhole(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=events,
        capture_id=receipt["capture_id"],
        known_cutoff=receipt["known_cutoff"],
        valid_time=receipt["valid_time"],
    )
    if canonical(rebuilt) != canonical(receipt):
        raise ValueError("temporal governance receipt replay mismatch")
    return deepcopy(receipt)


def keyhole_comparison(policy_records, events, left, right):
    a = governance_keyhole(
        policy_records,
        events,
        known_cutoff=left["known_cutoff"],
        valid_time=left["valid_time"],
    )
    b = governance_keyhole(
        policy_records,
        events,
        known_cutoff=right["known_cutoff"],
        valid_time=right["valid_time"],
    )
    return {
        "left": a,
        "right": b,
        "selected_policy_changed": a["selected_policy_version_id"] != b["selected_policy_version_id"],
        "ledger_head_changed": a["ledger_head"] != b["ledger_head"],
    }


def build_governance_bundle(
    *,
    bundle_id,
    input_t9_manifest,
    reviewer_registry,
    policy_records,
    events,
    resolution_receipts,
):
    validate_policy_ledger(events)
    validate_reviewer_registry = t10.validate_reviewer_registry
    validate_reviewer_registry(reviewer_registry)
    for row in policy_records:
        validate_temporal_policy(row)
    for receipt in resolution_receipts:
        frozen = deepcopy(receipt)
        expected = frozen.pop("receipt_hash")
        if sha256_obj(frozen) != expected:
            raise ValueError("invalid resolution receipt in governance bundle")

    payload = {
        "input_t9_manifest": deepcopy(input_t9_manifest),
        "reviewer_registry": deepcopy(reviewer_registry),
        "policy_records": sorted(deepcopy(policy_records), key=lambda p: p["policy_version_id"]),
        "policy_ledger": deepcopy(events),
        "resolution_receipts": sorted(
            deepcopy(resolution_receipts),
            key=lambda r: (r["known_cutoff"], r["valid_time"], r["receipt_hash"]),
        ),
    }
    manifest = {
        "experiment": "NBG-T11",
        "version": VERSION,
        "bundle_id": bundle_id,
        "payload_sha256": sha256_obj(payload),
        "policy_ledger_head": validate_policy_ledger(events),
        "reviewer_registry_sha256": reviewer_registry["registry_sha256"],
        "input_t9_manifest_hash": input_t9_manifest["manifest_hash"],
    }
    manifest["manifest_hash"] = sha256_obj(manifest)
    return {"manifest": manifest, "payload": payload}


def validate_governance_bundle(bundle):
    manifest = deepcopy(bundle["manifest"])
    expected = manifest.pop("manifest_hash")
    if sha256_obj(manifest) != expected:
        raise ValueError("governance bundle manifest mismatch")
    if sha256_obj(bundle["payload"]) != bundle["manifest"]["payload_sha256"]:
        raise ValueError("governance bundle payload mismatch")
    if validate_policy_ledger(bundle["payload"]["policy_ledger"]) != bundle["manifest"]["policy_ledger_head"]:
        raise ValueError("governance bundle ledger head mismatch")
    if bundle["payload"]["reviewer_registry"]["registry_sha256"] != bundle["manifest"]["reviewer_registry_sha256"]:
        raise ValueError("governance bundle reviewer registry mismatch")
    if bundle["payload"]["input_t9_manifest"]["manifest_hash"] != bundle["manifest"]["input_t9_manifest_hash"]:
        raise ValueError("governance bundle input manifest mismatch")
    return True


def frozen_fixture():
    base_claim, input_bundle, reviewer_registry, _ = t10.frozen_fixture()

    normal_v1 = t10.make_policy(
        policy_id="NORMAL_GOVERNANCE",
        policy_version="1.0",
        mode="WEIGHTED_THRESHOLD",
        eligible_roles={"RESEARCHER", "AUDITOR"},
        min_participants=2,
        accept_threshold=2,
        reject_threshold=2,
        weight_mode="REVIEWER_AUTHORITY",
        effective_from=1,
        effective_until=30,
        description="Baseline authority-weighted governance.",
    )
    normal_v2 = t10.make_policy(
        policy_id="NORMAL_GOVERNANCE",
        policy_version="2.0",
        mode="UNANIMOUS",
        eligible_roles={"RESEARCHER", "AUDITOR"},
        min_participants=2,
        accept_threshold=1,
        reject_threshold=1,
        weight_mode="UNIT",
        effective_from=1,
        effective_until=30,
        description="Amended unanimity governance.",
    )
    emergency_v1 = t10.make_policy(
        policy_id="EMERGENCY_GOVERNANCE",
        policy_version="1.0",
        mode="WEIGHTED_THRESHOLD",
        eligible_roles={"AUDITOR"},
        min_participants=1,
        accept_threshold=1,
        reject_threshold=1,
        weight_mode="UNIT",
        effective_from=1,
        effective_until=30,
        description="Emergency auditor-only governance.",
    )

    policy_records = [
        make_temporal_policy(
            policy_version_id="NORMAL@1.0",
            family_id="NORMAL_GOVERNANCE",
            revision=1,
            policy_kind="NORMAL",
            valid_from=1,
            valid_until=30,
            known_at=2,
            priority=10,
            t10_policy=normal_v1,
        ),
        make_temporal_policy(
            policy_version_id="EMERGENCY@1.0",
            family_id="EMERGENCY_GOVERNANCE",
            revision=1,
            policy_kind="EMERGENCY",
            valid_from=6,
            valid_until=12,
            known_at=6,
            priority=100,
            t10_policy=emergency_v1,
        ),
        make_temporal_policy(
            policy_version_id="NORMAL@2.0",
            family_id="NORMAL_GOVERNANCE",
            revision=2,
            policy_kind="NORMAL",
            valid_from=7,
            valid_until=30,
            known_at=8,
            priority=10,
            t10_policy=normal_v2,
        ),
    ]

    event_specs = [
        {
            "event_id":"EV_REGISTER_NORMAL_1",
            "event_type":"REGISTER_POLICY",
            "known_time":2,
            "valid_time":1,
            "target_policy_version_id":"NORMAL@1.0",
            "payload":{"record_hash":policy_records[0]["record_hash"]},
        },
        {
            "event_id":"EV_REGISTER_EMERGENCY_1",
            "event_type":"REGISTER_POLICY",
            "known_time":6,
            "valid_time":6,
            "target_policy_version_id":"EMERGENCY@1.0",
            "payload":{"record_hash":policy_records[1]["record_hash"]},
        },
        {
            "event_id":"EV_ACTIVATE_EMERGENCY",
            "event_type":"ACTIVATE_EMERGENCY",
            "known_time":6,
            "valid_time":6,
            "target_policy_version_id":"EMERGENCY@1.0",
            "payload":{"reason":"synthetic incident window"},
        },
        {
            "event_id":"EV_REGISTER_NORMAL_2",
            "event_type":"REGISTER_POLICY",
            "known_time":8,
            "valid_time":7,
            "target_policy_version_id":"NORMAL@2.0",
            "payload":{"record_hash":policy_records[2]["record_hash"]},
        },
        {
            "event_id":"EV_SUPERSEDE_NORMAL_1",
            "event_type":"SUPERSEDE_POLICY",
            "known_time":8,
            "valid_time":7,
            "target_policy_version_id":"NORMAL@1.0",
            "payload":{"replacement_policy_version_id":"NORMAL@2.0"},
        },
        {
            "event_id":"EV_DEACTIVATE_EMERGENCY",
            "event_type":"DEACTIVATE_EMERGENCY",
            "known_time":9,
            "valid_time":9,
            "target_policy_version_id":"EMERGENCY@1.0",
            "payload":{"reason":"synthetic incident window closed"},
        },
    ]
    ledger = build_policy_ledger(event_specs)
    return base_claim, input_bundle, reviewer_registry, policy_records, ledger


def run_suite():
    base_claim, input_bundle, reviewer_registry, policy_records, ledger = frozen_fixture()

    k5 = governance_keyhole(policy_records, ledger, known_cutoff=5, valid_time=5)
    k7 = governance_keyhole(policy_records, ledger, known_cutoff=7, valid_time=7)
    k8 = governance_keyhole(policy_records, ledger, known_cutoff=8, valid_time=7)
    k10 = governance_keyhole(policy_records, ledger, known_cutoff=10, valid_time=10)
    historical_k7_late = governance_keyhole(policy_records, ledger, known_cutoff=10, valid_time=7)

    r5 = resolve_keyhole(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=5,
        valid_time=5,
    )
    r7 = resolve_keyhole(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=7,
        valid_time=7,
    )
    r10 = resolve_keyhole(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=10,
        valid_time=10,
    )

    old_receipt_bytes = canonical(r5)
    bundle = build_governance_bundle(
        bundle_id="GOV_BUNDLE_T11",
        input_t9_manifest=input_bundle["manifest"],
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=ledger,
        resolution_receipts=[r5, r7, r10],
    )
    old_receipt_after = canonical(bundle["payload"]["resolution_receipts"][0])

    comparison = keyhole_comparison(
        policy_records,
        ledger,
        {"known_cutoff":5,"valid_time":5},
        {"known_cutoff":10,"valid_time":10},
    )

    checks = [
        {"name":"ledger:valid_chain","pass":validate_policy_ledger(ledger)==ledger[-1]["event_hash"]},
        {"name":"ledger:append_only_event_count","pass":len(ledger)==6},
        {"name":"policy_records:all_valid","pass":all(validate_temporal_policy(p) for p in policy_records)},
        {"name":"bitemporal:k7_cannot_see_normal_v2","pass":"NORMAL@2.0" not in k7["visible_policy_version_ids"]},
        {"name":"bitemporal:k8_can_see_normal_v2","pass":"NORMAL@2.0" in k8["visible_policy_version_ids"]},
        {"name":"k5:baseline_selected","pass":k5["selected_policy_version_id"]=="NORMAL@1.0"},
        {"name":"k7:emergency_selected","pass":k7["selected_policy_version_id"]=="EMERGENCY@1.0"},
        {"name":"k8:emergency_still_selected","pass":k8["selected_policy_version_id"]=="EMERGENCY@1.0"},
        {"name":"k10:normal_v2_selected","pass":k10["selected_policy_version_id"]=="NORMAL@2.0"},
        {"name":"historical:k7_late_still_emergency","pass":historical_k7_late["selected_policy_version_id"]=="EMERGENCY@1.0"},
        {"name":"supersession:normal_v1_stale_at_k10","pass":policy_status_at("NORMAL@1.0",policy_records,ledger,known_cutoff=10,valid_time=10)=="SUPERSEDED"},
        {"name":"emergency:active_at_k7","pass":emergency_state("EMERGENCY@1.0",ledger,known_cutoff=7,valid_time=7)=="ACTIVE"},
        {"name":"emergency:inactive_at_k10","pass":emergency_state("EMERGENCY@1.0",ledger,known_cutoff=10,valid_time=10)=="INACTIVE"},
        {"name":"resolution:k5_rejected","pass":r5["t10_resolution_receipt"]["governance_outcome"]=="REJECTED"},
        {"name":"resolution:k7_rejected_emergency","pass":r7["t10_resolution_receipt"]["governance_outcome"]=="REJECTED"},
        {"name":"resolution:k10_abstain_conflict","pass":r10["t10_resolution_receipt"]["governance_outcome"]=="ABSTAIN_CONFLICT"},
        {"name":"resolution:pinned_policy_version","pass":r10["policy_version_id"]=="NORMAL@2.0" and r10["t10_resolution_receipt"]["policy_version"]=="2.0"},
        {"name":"resolution:pinned_ledger_head","pass":r7["policy_ledger_head"]==k7["ledger_head"]},
        {"name":"history:old_receipt_unchanged","pass":old_receipt_bytes==old_receipt_after},
        {"name":"history:source_status_immutable","pass":base_claim["source_status"]=="ALLEGED"},
        {"name":"comparison:selected_policy_changes","pass":comparison["selected_policy_changed"]},
        {"name":"comparison:ledger_head_changes","pass":comparison["ledger_head_changed"]},
        {"name":"bundle:valid","pass":validate_governance_bundle(bundle)},
        {"name":"bundle:input_manifest_pinned","pass":bundle["manifest"]["input_t9_manifest_hash"]==input_bundle["manifest"]["manifest_hash"]},
        {"name":"replay:r5_exact","pass":canonical(replay_keyhole_receipt(r5,bundle=input_bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,events=ledger))==canonical(r5)},
        {"name":"replay:r10_exact","pass":canonical(replay_keyhole_receipt(r10,bundle=input_bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,events=ledger))==canonical(r10)},
        {"name":"truth_boundary:explicit","pass":all(r["truth_claim"]=="NONE_TEMPORAL_POLICY_OUTCOME_IS_OBJECTIVE_TRUTH" for r in [r5,r7,r10])},
        {"name":"replay:deterministic_keyhole","pass":canonical(k10)==canonical(governance_keyhole(policy_records,ledger,known_cutoff=10,valid_time=10))},
    ]

    payload = {
        "experiment":"NBG-T11",
        "version":VERSION,
        "witness":{
            "k5_selected":k5["selected_policy_version_id"],
            "k7_selected":k7["selected_policy_version_id"],
            "k8_selected":k8["selected_policy_version_id"],
            "k10_selected":k10["selected_policy_version_id"],
            "historical_k7_late_selected":historical_k7_late["selected_policy_version_id"],
            "k5_outcome":r5["t10_resolution_receipt"]["governance_outcome"],
            "k7_outcome":r7["t10_resolution_receipt"]["governance_outcome"],
            "k10_outcome":r10["t10_resolution_receipt"]["governance_outcome"],
            "normal_v1_k10_status":policy_status_at("NORMAL@1.0",policy_records,ledger,known_cutoff=10,valid_time=10),
            "emergency_k10_state":emergency_state("EMERGENCY@1.0",ledger,known_cutoff=10,valid_time=10),
            "ledger_event_count":len(ledger),
        },
        "keyholes":{"k5":k5,"k7":k7,"k8":k8,"k10":k10,"historical_k7_late":historical_k7_late},
        "comparison":comparison,
        "receipts":{"k5":r5,"k7":r7,"k10":r10},
        "checks":checks,
        "checks_passed":sum(bool(c["pass"]) for c in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT11" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT11"
    payload["result_hash"]=sha256_obj(payload)
    return payload, {
        "policy_records":policy_records,
        "policy_ledger":ledger,
        "governance_bundle":bundle,
        "comparison":comparison,
        "k10_receipt":r10,
    }


def main():
    payload, artifacts = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    for name,obj in {
        "policy_records.json":artifacts["policy_records"],
        "policy_ledger.json":artifacts["policy_ledger"],
        "governance_bundle.json":artifacts["governance_bundle"],
        "keyhole_comparison.json":artifacts["comparison"],
        "k10_resolution_receipt.json":artifacts["k10_receipt"],
    }.items():
        (out/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "k5":payload["witness"]["k5_selected"],
        "k7":payload["witness"]["k7_selected"],
        "k10":payload["witness"]["k10_selected"],
        "k10_outcome":payload["witness"]["k10_outcome"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_NBGT11":
        raise SystemExit(1)


if __name__=="__main__":
    main()
