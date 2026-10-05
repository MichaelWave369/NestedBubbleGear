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

T11_PATH = ROOT.parent / "NBGT11" / "src" / "nbgt11.py"
_spec = importlib.util.spec_from_file_location("nbgt11_for_t12", T11_PATH)
t11 = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = t11
_spec.loader.exec_module(t11)

COUNTERFACTUAL_TRUTH_BOUNDARY = "COUNTERFACTUAL_BRANCH_NOT_OBSERVED_HISTORY"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def make_fork_receipt(
    *,
    branch_id,
    observed_ledger,
    operation,
    target_event_id,
    patch=None,
    reason,
):
    t11.validate_policy_ledger(observed_ledger)
    if operation not in {"REMOVE_EVENT", "DELAY_EVENT", "ALTER_EVENT"}:
        raise ValueError("unsupported counterfactual operation")
    target = next((e for e in observed_ledger if e["event_id"] == target_event_id), None)
    if target is None:
        raise ValueError("counterfactual target event not found")
    patch = deepcopy(patch or {})
    forbidden = {"event_id", "event_type", "event_hash", "prev_hash", "experiment", "version"}
    if forbidden.intersection(patch):
        raise ValueError("counterfactual patch attempts to rewrite event identity")
    if operation == "REMOVE_EVENT" and patch:
        raise ValueError("remove-event fork may not carry a patch")
    if operation == "DELAY_EVENT":
        allowed = {"known_time", "valid_time"}
        if not patch or not set(patch).issubset(allowed):
            raise ValueError("delay-event fork requires only known_time/valid_time")
        if "known_time" in patch and int(patch["known_time"]) < int(target["known_time"]):
            raise ValueError("delay-event cannot move known time earlier")
        if "valid_time" in patch and int(patch["valid_time"]) < int(target["valid_time"]):
            raise ValueError("delay-event cannot move valid time earlier")
    if operation == "ALTER_EVENT":
        allowed = {"known_time", "valid_time", "target_policy_version_id", "payload"}
        if not patch or not set(patch).issubset(allowed):
            raise ValueError("alter-event patch contains unsupported fields")

    receipt = {
        "experiment": "NBG-T12",
        "version": VERSION,
        "receipt_type": "COUNTERFACTUAL_GOVERNANCE_FORK",
        "branch_id": branch_id,
        "branch_kind": "COUNTERFACTUAL",
        "observed_ledger_head": observed_ledger[-1]["event_hash"] if observed_ledger else t11.GENESIS,
        "target_event_id": target_event_id,
        "target_event_hash": target["event_hash"],
        "operation": operation,
        "patch": patch,
        "reason": reason,
        "truth_claim": COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    receipt["fork_hash"] = sha256_obj(receipt)
    return receipt


def validate_fork_receipt(receipt, observed_ledger):
    t11.validate_policy_ledger(observed_ledger)
    frozen = deepcopy(receipt)
    expected = frozen.pop("fork_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("counterfactual fork receipt hash mismatch")
    if receipt["branch_kind"] != "COUNTERFACTUAL":
        raise ValueError("fork receipt must remain counterfactual")
    if receipt["truth_claim"] != COUNTERFACTUAL_TRUTH_BOUNDARY:
        raise ValueError("counterfactual truth boundary missing")
    observed_head = observed_ledger[-1]["event_hash"] if observed_ledger else t11.GENESIS
    if receipt["observed_ledger_head"] != observed_head:
        raise ValueError("fork receipt observed-ledger head mismatch")
    target = next((e for e in observed_ledger if e["event_id"] == receipt["target_event_id"]), None)
    if target is None or target["event_hash"] != receipt["target_event_hash"]:
        raise ValueError("fork receipt target-event mismatch")
    return True


def _event_spec(event):
    return {
        "event_id": event["event_id"],
        "event_type": event["event_type"],
        "known_time": event["known_time"],
        "valid_time": event["valid_time"],
        "target_policy_version_id": event["target_policy_version_id"],
        "payload": deepcopy(event["payload"]),
    }


def apply_counterfactual_branch(observed_ledger, fork_receipt):
    validate_fork_receipt(fork_receipt, observed_ledger)
    observed_before = canonical(observed_ledger)
    specs = []
    for event in observed_ledger:
        if event["event_id"] != fork_receipt["target_event_id"]:
            specs.append(_event_spec(event))
            continue
        if fork_receipt["operation"] == "REMOVE_EVENT":
            continue
        changed = _event_spec(event)
        for key, value in fork_receipt["patch"].items():
            changed[key] = deepcopy(value)
        specs.append(changed)

    branch_ledger = t11.build_policy_ledger(specs)
    if canonical(observed_ledger) != observed_before:
        raise AssertionError("observed ledger mutated during branch construction")

    branch = {
        "experiment": "NBG-T12",
        "version": VERSION,
        "branch_id": fork_receipt["branch_id"],
        "branch_kind": "COUNTERFACTUAL",
        "observed_ledger_head": fork_receipt["observed_ledger_head"],
        "fork_hash": fork_receipt["fork_hash"],
        "operation": fork_receipt["operation"],
        "target_event_id": fork_receipt["target_event_id"],
        "branch_ledger": branch_ledger,
        "branch_ledger_head": branch_ledger[-1]["event_hash"] if branch_ledger else t11.GENESIS,
        "truth_claim": COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    branch["branch_hash"] = sha256_obj(branch)
    return branch


def validate_counterfactual_branch(branch, observed_ledger, fork_receipt):
    validate_fork_receipt(fork_receipt, observed_ledger)
    frozen = deepcopy(branch)
    expected = frozen.pop("branch_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("counterfactual branch hash mismatch")
    if branch["branch_kind"] != "COUNTERFACTUAL":
        raise ValueError("branch kind mismatch")
    if branch["truth_claim"] != COUNTERFACTUAL_TRUTH_BOUNDARY:
        raise ValueError("branch truth boundary missing")
    if branch["fork_hash"] != fork_receipt["fork_hash"]:
        raise ValueError("branch fork hash mismatch")
    if branch["observed_ledger_head"] != fork_receipt["observed_ledger_head"]:
        raise ValueError("branch observed head mismatch")
    if branch["branch_ledger_head"] != t11.validate_policy_ledger(branch["branch_ledger"]):
        raise ValueError("branch ledger head mismatch")
    return True


def resolve_observed(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    capture_id,
    known_cutoff,
    valid_time,
    evidence_known_cutoff=10,
):
    return t11.resolve_keyhole(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=observed_ledger,
        capture_id=capture_id,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
        evidence_known_cutoff=evidence_known_cutoff,
    )


def resolve_counterfactual(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    branch,
    fork_receipt,
    observed_ledger,
    capture_id,
    known_cutoff,
    valid_time,
    evidence_known_cutoff=10,
):
    validate_counterfactual_branch(branch, observed_ledger, fork_receipt)
    inner = t11.resolve_keyhole(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=branch["branch_ledger"],
        capture_id=capture_id,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    receipt = {
        "experiment": "NBG-T12",
        "version": VERSION,
        "receipt_type": "COUNTERFACTUAL_GOVERNANCE_RESOLUTION",
        "branch_id": branch["branch_id"],
        "branch_hash": branch["branch_hash"],
        "fork_hash": fork_receipt["fork_hash"],
        "observed_ledger_head": branch["observed_ledger_head"],
        "branch_ledger_head": branch["branch_ledger_head"],
        "capture_id": capture_id,
        "known_cutoff": int(known_cutoff),
        "valid_time": int(valid_time),
        "evidence_known_cutoff": int(evidence_known_cutoff),
        "counterfactual_t11_receipt": inner,
        "truth_claim": COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    receipt["receipt_hash"] = sha256_obj(receipt)
    return receipt


def replay_counterfactual_receipt(
    receipt,
    *,
    bundle,
    reviewer_registry,
    policy_records,
    branch,
    fork_receipt,
    observed_ledger,
):
    frozen = deepcopy(receipt)
    expected = frozen.pop("receipt_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("counterfactual resolution receipt hash mismatch")
    rebuilt = resolve_counterfactual(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branch=branch,
        fork_receipt=fork_receipt,
        observed_ledger=observed_ledger,
        capture_id=receipt["capture_id"],
        known_cutoff=receipt["known_cutoff"],
        valid_time=receipt["valid_time"],
        evidence_known_cutoff=receipt["evidence_known_cutoff"],
    )
    if canonical(rebuilt) != canonical(receipt):
        raise ValueError("counterfactual resolution receipt replay mismatch")
    return deepcopy(receipt)


def compare_keyhole(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    branch,
    fork_receipt,
    known_cutoff,
    valid_time,
    capture_id="CAP_OPPOSE",
    evidence_known_cutoff=10,
):
    observed = resolve_observed(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        capture_id=capture_id,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    counterfactual = resolve_counterfactual(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branch=branch,
        fork_receipt=fork_receipt,
        observed_ledger=observed_ledger,
        capture_id=capture_id,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    observed_outcome = observed["t10_resolution_receipt"]["governance_outcome"]
    branch_outcome = counterfactual["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"]
    row = {
        "known_cutoff": int(known_cutoff),
        "valid_time": int(valid_time),
        "observed_policy_version_id": observed["policy_version_id"],
        "counterfactual_policy_version_id": counterfactual["counterfactual_t11_receipt"]["policy_version_id"],
        "observed_outcome": observed_outcome,
        "counterfactual_outcome": branch_outcome,
        "policy_changed": observed["policy_version_id"] != counterfactual["counterfactual_t11_receipt"]["policy_version_id"],
        "outcome_changed": observed_outcome != branch_outcome,
        "observed_receipt_hash": observed["receipt_hash"],
        "counterfactual_receipt_hash": counterfactual["receipt_hash"],
    }
    row["comparison_hash"] = sha256_obj(row)
    return row


def divergence_summary(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    branch,
    fork_receipt,
    max_known=12,
    max_valid=12,
    evidence_known_cutoff=10,
):
    validate_counterfactual_branch(branch, observed_ledger, fork_receipt)
    first = None
    for known_cutoff in range(1, max_known + 1):
        for valid_time in range(1, max_valid + 1):
            try:
                row = compare_keyhole(
                    bundle=bundle,
                    reviewer_registry=reviewer_registry,
                    policy_records=policy_records,
                    observed_ledger=observed_ledger,
                    branch=branch,
                    fork_receipt=fork_receipt,
                    known_cutoff=known_cutoff,
                    valid_time=valid_time,
                    evidence_known_cutoff=evidence_known_cutoff,
                )
            except ValueError:
                continue
            if row["outcome_changed"]:
                first = row
                break
        if first is not None:
            break

    target = next(e for e in observed_ledger if e["event_id"] == fork_receipt["target_event_id"])
    summary = {
        "branch_id": branch["branch_id"],
        "altered_event_id": fork_receipt["target_event_id"],
        "altered_event_hash": target["event_hash"],
        "altered_event_known_time": target["known_time"],
        "altered_event_valid_time": target["valid_time"],
        "operation": fork_receipt["operation"],
        "first_outcome_divergence": first,
        "truth_claim": COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    summary["summary_hash"] = sha256_obj(summary)
    return summary


def build_counterfactual_bundle(
    *,
    bundle_id,
    input_t9_manifest,
    reviewer_registry,
    policy_records,
    observed_ledger,
    fork_receipt,
    branch,
    counterfactual_receipts,
    divergence,
):
    validate_counterfactual_branch(branch, observed_ledger, fork_receipt)
    for receipt in counterfactual_receipts:
        frozen = deepcopy(receipt)
        expected = frozen.pop("receipt_hash")
        if sha256_obj(frozen) != expected:
            raise ValueError("invalid counterfactual receipt in bundle")
    div = deepcopy(divergence)
    expected_div = div.pop("summary_hash")
    if sha256_obj(div) != expected_div:
        raise ValueError("invalid divergence summary")

    payload = {
        "branch_kind": "COUNTERFACTUAL",
        "input_t9_manifest": deepcopy(input_t9_manifest),
        "reviewer_registry": deepcopy(reviewer_registry),
        "policy_records": deepcopy(policy_records),
        "observed_policy_ledger": deepcopy(observed_ledger),
        "fork_receipt": deepcopy(fork_receipt),
        "counterfactual_branch": deepcopy(branch),
        "counterfactual_receipts": sorted(
            deepcopy(counterfactual_receipts),
            key=lambda r: (r["known_cutoff"], r["valid_time"], r["receipt_hash"]),
        ),
        "divergence_summary": deepcopy(divergence),
        "truth_claim": COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    manifest = {
        "experiment": "NBG-T12",
        "version": VERSION,
        "bundle_id": bundle_id,
        "bundle_kind": "COUNTERFACTUAL_GOVERNANCE",
        "payload_sha256": sha256_obj(payload),
        "input_t9_manifest_hash": input_t9_manifest["manifest_hash"],
        "reviewer_registry_sha256": reviewer_registry["registry_sha256"],
        "observed_ledger_head": t11.validate_policy_ledger(observed_ledger),
        "branch_ledger_head": branch["branch_ledger_head"],
        "fork_hash": fork_receipt["fork_hash"],
    }
    manifest["manifest_hash"] = sha256_obj(manifest)
    return {"manifest": manifest, "payload": payload}


def validate_counterfactual_bundle(bundle):
    manifest = deepcopy(bundle["manifest"])
    expected = manifest.pop("manifest_hash")
    if sha256_obj(manifest) != expected:
        raise ValueError("counterfactual bundle manifest mismatch")
    if sha256_obj(bundle["payload"]) != bundle["manifest"]["payload_sha256"]:
        raise ValueError("counterfactual bundle payload mismatch")
    payload = bundle["payload"]
    if payload["branch_kind"] != "COUNTERFACTUAL" or payload["truth_claim"] != COUNTERFACTUAL_TRUTH_BOUNDARY:
        raise ValueError("counterfactual bundle boundary missing")
    if payload["input_t9_manifest"]["manifest_hash"] != bundle["manifest"]["input_t9_manifest_hash"]:
        raise ValueError("counterfactual bundle input manifest mismatch")
    if payload["reviewer_registry"]["registry_sha256"] != bundle["manifest"]["reviewer_registry_sha256"]:
        raise ValueError("counterfactual bundle reviewer registry mismatch")
    if t11.validate_policy_ledger(payload["observed_policy_ledger"]) != bundle["manifest"]["observed_ledger_head"]:
        raise ValueError("counterfactual bundle observed head mismatch")
    if t11.validate_policy_ledger(payload["counterfactual_branch"]["branch_ledger"]) != bundle["manifest"]["branch_ledger_head"]:
        raise ValueError("counterfactual bundle branch head mismatch")
    if payload["fork_receipt"]["fork_hash"] != bundle["manifest"]["fork_hash"]:
        raise ValueError("counterfactual bundle fork mismatch")
    return True


def portable_export(bundle):
    validate_counterfactual_bundle(bundle)
    return deepcopy(bundle)


def portable_import(exported):
    bundle = deepcopy(exported)
    validate_counterfactual_bundle(bundle)
    return bundle


def frozen_fixture():
    base_claim, input_bundle, reviewer_registry, policy_records, observed_ledger = t11.frozen_fixture()

    remove_fork = make_fork_receipt(
        branch_id="CF_REMOVE_DEACTIVATE",
        observed_ledger=observed_ledger,
        operation="REMOVE_EVENT",
        target_event_id="EV_DEACTIVATE_EMERGENCY",
        reason="Synthetic branch: emergency deactivation never occurs.",
    )
    delay_fork = make_fork_receipt(
        branch_id="CF_DELAY_DEACTIVATE",
        observed_ledger=observed_ledger,
        operation="DELAY_EVENT",
        target_event_id="EV_DEACTIVATE_EMERGENCY",
        patch={"known_time": 11, "valid_time": 11},
        reason="Synthetic branch: emergency deactivation is delayed to k11/t11.",
    )
    alter_fork = make_fork_receipt(
        branch_id="CF_ALTER_DEACTIVATE",
        observed_ledger=observed_ledger,
        operation="ALTER_EVENT",
        target_event_id="EV_DEACTIVATE_EMERGENCY",
        patch={"valid_time": 10},
        reason="Synthetic branch: deactivation is known at k9 but valid only from t10.",
    )

    return (
        base_claim,
        input_bundle,
        reviewer_registry,
        policy_records,
        observed_ledger,
        remove_fork,
        delay_fork,
        alter_fork,
    )


def run_suite():
    (
        base_claim,
        input_bundle,
        reviewer_registry,
        policy_records,
        observed_ledger,
        remove_fork,
        delay_fork,
        alter_fork,
    ) = frozen_fixture()

    observed_before = canonical(observed_ledger)
    remove_branch = apply_counterfactual_branch(observed_ledger, remove_fork)
    delay_branch = apply_counterfactual_branch(observed_ledger, delay_fork)
    alter_branch = apply_counterfactual_branch(observed_ledger, alter_fork)
    observed_after = canonical(observed_ledger)

    observed_k10 = resolve_observed(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=10,
        valid_time=10,
    )
    remove_k10 = resolve_counterfactual(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branch=remove_branch,
        fork_receipt=remove_fork,
        observed_ledger=observed_ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=10,
        valid_time=10,
    )
    delay_k10 = resolve_counterfactual(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branch=delay_branch,
        fork_receipt=delay_fork,
        observed_ledger=observed_ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=10,
        valid_time=10,
    )
    alter_k9 = resolve_counterfactual(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        branch=alter_branch,
        fork_receipt=alter_fork,
        observed_ledger=observed_ledger,
        capture_id="CAP_OPPOSE",
        known_cutoff=9,
        valid_time=9,
    )

    remove_div = divergence_summary(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        branch=remove_branch,
        fork_receipt=remove_fork,
    )
    delay_div = divergence_summary(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        branch=delay_branch,
        fork_receipt=delay_fork,
    )
    alter_div = divergence_summary(
        bundle=input_bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        branch=alter_branch,
        fork_receipt=alter_fork,
    )

    bundle = build_counterfactual_bundle(
        bundle_id="T12_REMOVE_DEACTIVATE_BUNDLE",
        input_t9_manifest=input_bundle["manifest"],
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        fork_receipt=remove_fork,
        branch=remove_branch,
        counterfactual_receipts=[remove_k10],
        divergence=remove_div,
    )
    roundtrip = portable_import(portable_export(bundle))

    observed_outcome = observed_k10["t10_resolution_receipt"]["governance_outcome"]
    remove_outcome = remove_k10["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"]
    delay_outcome = delay_k10["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"]
    alter_outcome_k9 = alter_k9["counterfactual_t11_receipt"]["t10_resolution_receipt"]["governance_outcome"]

    checks = [
        {"name":"observed:ledger_immutable","pass":observed_before==observed_after},
        {"name":"observed:ledger_valid","pass":t11.validate_policy_ledger(observed_ledger)==observed_ledger[-1]["event_hash"]},
        {"name":"fork:remove_valid","pass":validate_fork_receipt(remove_fork,observed_ledger)},
        {"name":"fork:delay_valid","pass":validate_fork_receipt(delay_fork,observed_ledger)},
        {"name":"fork:alter_valid","pass":validate_fork_receipt(alter_fork,observed_ledger)},
        {"name":"branch:remove_valid","pass":validate_counterfactual_branch(remove_branch,observed_ledger,remove_fork)},
        {"name":"branch:delay_valid","pass":validate_counterfactual_branch(delay_branch,observed_ledger,delay_fork)},
        {"name":"branch:alter_valid","pass":validate_counterfactual_branch(alter_branch,observed_ledger,alter_fork)},
        {"name":"branch:remove_has_five_events","pass":len(remove_branch["branch_ledger"])==5},
        {"name":"branch:delay_has_six_events","pass":len(delay_branch["branch_ledger"])==6},
        {"name":"branch:alter_has_six_events","pass":len(alter_branch["branch_ledger"])==6},
        {"name":"separation:observed_head_differs_remove","pass":remove_branch["branch_ledger_head"]!=remove_branch["observed_ledger_head"]},
        {"name":"separation:counterfactual_marker","pass":all(b["branch_kind"]=="COUNTERFACTUAL" for b in [remove_branch,delay_branch,alter_branch])},
        {"name":"truth_boundary:forks","pass":all(f["truth_claim"]==COUNTERFACTUAL_TRUTH_BOUNDARY for f in [remove_fork,delay_fork,alter_fork])},
        {"name":"observed:k10_abstain_conflict","pass":observed_outcome=="ABSTAIN_CONFLICT"},
        {"name":"remove:k10_rejected","pass":remove_outcome=="REJECTED"},
        {"name":"delay:k10_rejected","pass":delay_outcome=="REJECTED"},
        {"name":"alter:k9_rejected","pass":alter_outcome_k9=="REJECTED"},
        {"name":"remove:selected_emergency","pass":remove_k10["counterfactual_t11_receipt"]["policy_version_id"]=="EMERGENCY@1.0"},
        {"name":"delay:selected_emergency","pass":delay_k10["counterfactual_t11_receipt"]["policy_version_id"]=="EMERGENCY@1.0"},
        {"name":"divergence:remove_at_k9_t9","pass":remove_div["first_outcome_divergence"]["known_cutoff"]==9 and remove_div["first_outcome_divergence"]["valid_time"]==9},
        {"name":"divergence:delay_at_k9_t9","pass":delay_div["first_outcome_divergence"]["known_cutoff"]==9 and delay_div["first_outcome_divergence"]["valid_time"]==9},
        {"name":"divergence:alter_at_k9_t9","pass":alter_div["first_outcome_divergence"]["known_cutoff"]==9 and alter_div["first_outcome_divergence"]["valid_time"]==9},
        {"name":"divergence:target_event_named","pass":remove_div["altered_event_id"]=="EV_DEACTIVATE_EMERGENCY"},
        {"name":"receipts:branch_specific","pass":remove_k10["branch_id"]=="CF_REMOVE_DEACTIVATE" and delay_k10["branch_id"]=="CF_DELAY_DEACTIVATE"},
        {"name":"receipts:truth_boundary","pass":remove_k10["truth_claim"]==COUNTERFACTUAL_TRUTH_BOUNDARY},
        {"name":"receipts:replay_exact","pass":canonical(replay_counterfactual_receipt(remove_k10,bundle=input_bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,branch=remove_branch,fork_receipt=remove_fork,observed_ledger=observed_ledger))==canonical(remove_k10)},
        {"name":"bundle:valid","pass":validate_counterfactual_bundle(bundle)},
        {"name":"bundle:roundtrip_exact","pass":canonical(roundtrip)==canonical(bundle)},
        {"name":"source:status_immutable","pass":base_claim["source_status"]=="ALLEGED"},
        {"name":"replay:branch_deterministic","pass":canonical(apply_counterfactual_branch(observed_ledger,remove_fork))==canonical(remove_branch)},
        {"name":"replay:divergence_deterministic","pass":canonical(divergence_summary(bundle=input_bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,observed_ledger=observed_ledger,branch=remove_branch,fork_receipt=remove_fork))==canonical(remove_div)},
    ]

    payload = {
        "experiment":"NBG-T12",
        "version":VERSION,
        "witness":{
            "observed_k10_policy":observed_k10["policy_version_id"],
            "observed_k10_outcome":observed_outcome,
            "remove_k10_policy":remove_k10["counterfactual_t11_receipt"]["policy_version_id"],
            "remove_k10_outcome":remove_outcome,
            "delay_k10_policy":delay_k10["counterfactual_t11_receipt"]["policy_version_id"],
            "delay_k10_outcome":delay_outcome,
            "alter_k9_policy":alter_k9["counterfactual_t11_receipt"]["policy_version_id"],
            "alter_k9_outcome":alter_outcome_k9,
            "first_divergence_known":remove_div["first_outcome_divergence"]["known_cutoff"],
            "first_divergence_valid":remove_div["first_outcome_divergence"]["valid_time"],
            "altered_event_id":remove_div["altered_event_id"],
            "observed_ledger_event_count":len(observed_ledger),
            "remove_branch_event_count":len(remove_branch["branch_ledger"]),
        },
        "forks":{"remove":remove_fork,"delay":delay_fork,"alter":alter_fork},
        "branches":{"remove":remove_branch,"delay":delay_branch,"alter":alter_branch},
        "divergence":{"remove":remove_div,"delay":delay_div,"alter":alter_div},
        "checks":checks,
        "checks_passed":sum(bool(c["pass"]) for c in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT12" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT12"
    payload["result_hash"]=sha256_obj(payload)
    return payload, {
        "observed_policy_ledger":observed_ledger,
        "remove_fork":remove_fork,
        "remove_branch":remove_branch,
        "remove_divergence":remove_div,
        "counterfactual_bundle":bundle,
        "observed_k10_receipt":observed_k10,
        "remove_k10_receipt":remove_k10,
    }


def main():
    payload, artifacts = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    for name,obj in {
        "observed_policy_ledger.json":artifacts["observed_policy_ledger"],
        "remove_fork_receipt.json":artifacts["remove_fork"],
        "remove_branch.json":artifacts["remove_branch"],
        "remove_divergence.json":artifacts["remove_divergence"],
        "counterfactual_bundle.json":artifacts["counterfactual_bundle"],
        "observed_k10_receipt.json":artifacts["observed_k10_receipt"],
        "remove_k10_receipt.json":artifacts["remove_k10_receipt"],
    }.items():
        (out/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "observed_k10":payload["witness"]["observed_k10_outcome"],
        "remove_k10":payload["witness"]["remove_k10_outcome"],
        "first_divergence":f"k{payload['witness']['first_divergence_known']}/t{payload['witness']['first_divergence_valid']}",
        "altered_event":payload["witness"]["altered_event_id"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_NBGT12":
        raise SystemExit(1)


if __name__=="__main__":
    main()
