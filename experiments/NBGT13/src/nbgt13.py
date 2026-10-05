#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from itertools import combinations
from pathlib import Path
import hashlib
import importlib.util
import json
import sys

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

T12_PATH = ROOT.parent / "NBGT12" / "src" / "nbgt12.py"
_spec = importlib.util.spec_from_file_location("nbgt12_for_t13", T12_PATH)
t12 = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = t12
_spec.loader.exec_module(t12)

t11 = t12.t11
BOUNDARY = "SENSITIVITY_ATLAS_NOT_CAUSAL_ATTRIBUTION"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def frozen_intervention_specs():
    return [
        {
            "intervention_id": "I_REMOVE_DEACTIVATE",
            "operation": "REMOVE_EVENT",
            "target_event_id": "EV_DEACTIVATE_EMERGENCY",
            "patch": {},
            "reason": "Remove emergency deactivation.",
        },
        {
            "intervention_id": "I_DELAY_DEACTIVATE_11",
            "operation": "DELAY_EVENT",
            "target_event_id": "EV_DEACTIVATE_EMERGENCY",
            "patch": {"known_time": 11, "valid_time": 11},
            "reason": "Delay emergency deactivation to k11/t11.",
        },
        {
            "intervention_id": "I_ALTER_DEACTIVATE_VALID10",
            "operation": "ALTER_EVENT",
            "target_event_id": "EV_DEACTIVATE_EMERGENCY",
            "patch": {"valid_time": 10},
            "reason": "Keep deactivation known at k9 but valid only from t10.",
        },
        {
            "intervention_id": "I_REMOVE_SUPERSEDE_NORMAL1",
            "operation": "REMOVE_EVENT",
            "target_event_id": "EV_SUPERSEDE_NORMAL_1",
            "patch": {},
            "reason": "Remove explicit supersession of NORMAL@1.0.",
        },
        {
            "intervention_id": "I_DELAY_ACTIVATE_EMERGENCY_8",
            "operation": "DELAY_EVENT",
            "target_event_id": "EV_ACTIVATE_EMERGENCY",
            "patch": {"known_time": 8, "valid_time": 8},
            "reason": "Delay emergency activation to k8/t8.",
        },
        {
            "intervention_id": "I_REMOVE_REGISTER_NORMAL2",
            "operation": "REMOVE_EVENT",
            "target_event_id": "EV_REGISTER_NORMAL_2",
            "patch": {},
            "reason": "Remove registration of NORMAL@2.0.",
        },
        {
            "intervention_id": "I_DELAY_REGISTER_NORMAL2_11",
            "operation": "DELAY_EVENT",
            "target_event_id": "EV_REGISTER_NORMAL_2",
            "patch": {"known_time": 11, "valid_time": 11},
            "reason": "Delay NORMAL@2.0 registration to k11/t11.",
        },
        {
            "intervention_id": "I_REMOVE_REGISTER_EMERGENCY",
            "operation": "REMOVE_EVENT",
            "target_event_id": "EV_REGISTER_EMERGENCY_1",
            "patch": {},
            "reason": "Remove registration of EMERGENCY@1.0.",
        },
        {
            "intervention_id": "I_ALTER_DEACTIVATE_PAYLOAD_ONLY",
            "operation": "ALTER_EVENT",
            "target_event_id": "EV_DEACTIVATE_EMERGENCY",
            "patch": {"payload": {"reason": "synthetic annotation-only mutation"}},
            "reason": "Change ignored event payload only; semantic negative control.",
        },
    ]


def make_intervention_receipts(observed_ledger):
    receipts = []
    for spec in frozen_intervention_specs():
        receipt = t12.make_fork_receipt(
            branch_id=spec["intervention_id"],
            observed_ledger=observed_ledger,
            operation=spec["operation"],
            target_event_id=spec["target_event_id"],
            patch=spec["patch"],
            reason=spec["reason"],
        )
        receipt["intervention_id"] = spec["intervention_id"]
        # Rehash after adding the atlas identity so the receipt is self-contained.
        frozen = deepcopy(receipt)
        frozen.pop("fork_hash")
        receipt["fork_hash"] = sha256_obj(frozen)
        receipts.append(receipt)
    return receipts


def validate_intervention_receipt(receipt, observed_ledger):
    frozen = deepcopy(receipt)
    expected = frozen.pop("fork_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("intervention receipt hash mismatch")
    base = deepcopy(receipt)
    intervention_id = base.pop("intervention_id")
    base_frozen = deepcopy(base)
    base_frozen.pop("fork_hash")
    # Restore a T12-compatible fork hash for grammar validation.
    base["fork_hash"] = t12.sha256_obj(base_frozen)
    t12.validate_fork_receipt(base, observed_ledger)
    if intervention_id != receipt["branch_id"]:
        raise ValueError("intervention ID must match branch ID")
    return True


def _t12_compatible(receipt):
    base = deepcopy(receipt)
    base.pop("intervention_id")
    frozen = deepcopy(base)
    frozen.pop("fork_hash")
    base["fork_hash"] = t12.sha256_obj(frozen)
    return base


def build_single_branch(observed_ledger, receipt):
    validate_intervention_receipt(receipt, observed_ledger)
    base = _t12_compatible(receipt)
    branch = t12.apply_counterfactual_branch(observed_ledger, base)
    branch["branch_id"] = receipt["intervention_id"]
    branch["fork_hash"] = receipt["fork_hash"]
    branch["truth_claim"] = t12.COUNTERFACTUAL_TRUTH_BOUNDARY
    frozen = deepcopy(branch)
    frozen.pop("branch_hash")
    branch["branch_hash"] = sha256_obj(frozen)
    return branch


def validate_single_branch(branch, observed_ledger, receipt):
    validate_intervention_receipt(receipt, observed_ledger)
    frozen = deepcopy(branch)
    expected = frozen.pop("branch_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("atlas single branch hash mismatch")
    if branch["branch_id"] != receipt["intervention_id"]:
        raise ValueError("single branch intervention mismatch")
    if branch["observed_ledger_head"] != receipt["observed_ledger_head"]:
        raise ValueError("single branch observed head mismatch")
    if branch["branch_ledger_head"] != t11.validate_policy_ledger(branch["branch_ledger"]):
        raise ValueError("single branch ledger head mismatch")
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


def apply_intervention_set(observed_ledger, receipts):
    if not receipts:
        raise ValueError("intervention set cannot be empty")
    for receipt in receipts:
        validate_intervention_receipt(receipt, observed_ledger)
    ids = [r["intervention_id"] for r in receipts]
    if len(ids) != len(set(ids)):
        raise ValueError("duplicate intervention in set")
    targets = [r["target_event_id"] for r in receipts]
    if len(targets) != len(set(targets)):
        raise ValueError("multiple interventions on one event are not admissible")

    by_target = {r["target_event_id"]: r for r in receipts}
    observed_before = canonical(observed_ledger)
    specs = []
    for event in observed_ledger:
        receipt = by_target.get(event["event_id"])
        if receipt is None:
            specs.append(_event_spec(event))
            continue
        if receipt["operation"] == "REMOVE_EVENT":
            continue
        changed = _event_spec(event)
        for key, value in receipt["patch"].items():
            changed[key] = deepcopy(value)
        specs.append(changed)

    ledger = t11.build_policy_ledger(specs)
    if canonical(observed_ledger) != observed_before:
        raise AssertionError("observed ledger mutated during intervention-set construction")

    branch = {
        "experiment": "NBG-T13",
        "version": VERSION,
        "branch_kind": "COUNTERFACTUAL_SENSITIVITY_SET",
        "intervention_ids": sorted(ids),
        "intervention_fork_hashes": sorted(r["fork_hash"] for r in receipts),
        "observed_ledger_head": t11.validate_policy_ledger(observed_ledger),
        "branch_ledger": ledger,
        "branch_ledger_head": t11.validate_policy_ledger(ledger),
        "truth_claim": t12.COUNTERFACTUAL_TRUTH_BOUNDARY,
    }
    branch["branch_hash"] = sha256_obj(branch)
    return branch


def validate_intervention_set_branch(branch, observed_ledger):
    frozen = deepcopy(branch)
    expected = frozen.pop("branch_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("intervention-set branch hash mismatch")
    if branch["branch_kind"] != "COUNTERFACTUAL_SENSITIVITY_SET":
        raise ValueError("invalid sensitivity branch kind")
    if branch["truth_claim"] != t12.COUNTERFACTUAL_TRUTH_BOUNDARY:
        raise ValueError("counterfactual boundary missing")
    if branch["observed_ledger_head"] != t11.validate_policy_ledger(observed_ledger):
        raise ValueError("observed ledger head mismatch")
    if branch["branch_ledger_head"] != t11.validate_policy_ledger(branch["branch_ledger"]):
        raise ValueError("branch ledger head mismatch")
    return True


def selected_policy(policy_records, events, known_cutoff, valid_time):
    return t11.governance_keyhole(
        policy_records,
        events,
        known_cutoff=known_cutoff,
        valid_time=valid_time,
    )["selected_policy_version_id"]


def outcome_at(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    events,
    known_cutoff,
    valid_time,
    evidence_known_cutoff=10,
):
    receipt = t11.resolve_keyhole(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=events,
        capture_id="CAP_OPPOSE",
        known_cutoff=known_cutoff,
        valid_time=valid_time,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    return receipt["policy_version_id"], receipt["t10_resolution_receipt"]["governance_outcome"]


def first_policy_divergence(policy_records, observed_ledger, branch_ledger, *, max_known=12, max_valid=12):
    for known in range(1, max_known + 1):
        for valid in range(1, max_valid + 1):
            observed = selected_policy(policy_records, observed_ledger, known, valid)
            branch = selected_policy(policy_records, branch_ledger, known, valid)
            if observed != branch:
                return {
                    "known_cutoff": known,
                    "valid_time": valid,
                    "observed_policy": observed,
                    "counterfactual_policy": branch,
                }
    return None


def first_outcome_divergence(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    branch_ledger,
    max_known=12,
    max_valid=12,
    evidence_known_cutoff=10,
):
    for known in range(1, max_known + 1):
        for valid in range(1, max_valid + 1):
            try:
                _, observed = outcome_at(
                    bundle=bundle,
                    reviewer_registry=reviewer_registry,
                    policy_records=policy_records,
                    events=observed_ledger,
                    known_cutoff=known,
                    valid_time=valid,
                    evidence_known_cutoff=evidence_known_cutoff,
                )
                _, branch = outcome_at(
                    bundle=bundle,
                    reviewer_registry=reviewer_registry,
                    policy_records=policy_records,
                    events=branch_ledger,
                    known_cutoff=known,
                    valid_time=valid,
                    evidence_known_cutoff=evidence_known_cutoff,
                )
            except ValueError:
                continue
            if observed != branch:
                return {
                    "known_cutoff": known,
                    "valid_time": valid,
                    "observed_outcome": observed,
                    "counterfactual_outcome": branch,
                }
    return None


def classify_intervention(
    *,
    receipt,
    branch,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    target_known=10,
    target_valid=10,
    evidence_known_cutoff=10,
):
    validate_single_branch(branch, observed_ledger, receipt)
    observed_policy, observed_outcome = outcome_at(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=observed_ledger,
        known_cutoff=target_known,
        valid_time=target_valid,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    branch_policy, branch_outcome = outcome_at(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        events=branch["branch_ledger"],
        known_cutoff=target_known,
        valid_time=target_valid,
        evidence_known_cutoff=evidence_known_cutoff,
    )
    policy_changed = observed_policy != branch_policy
    outcome_changed = observed_outcome != branch_outcome

    first_policy = first_policy_divergence(
        policy_records,
        observed_ledger,
        branch["branch_ledger"],
    )
    first_outcome = first_outcome_divergence(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
        branch_ledger=branch["branch_ledger"],
        evidence_known_cutoff=evidence_known_cutoff,
    )

    if outcome_changed:
        target_class = "OUTCOME_CHANGING"
    elif policy_changed:
        target_class = "POLICY_CHANGING"
    else:
        target_class = "TARGET_INERT"

    if first_outcome is not None:
        temporal_class = "TEMPORAL_OUTCOME_LEVERAGE"
    elif first_policy is not None:
        temporal_class = "TEMPORAL_POLICY_LEVERAGE"
    else:
        temporal_class = "LEDGER_ONLY_INERT"

    row = {
        "intervention_id": receipt["intervention_id"],
        "operation": receipt["operation"],
        "target_event_id": receipt["target_event_id"],
        "fork_hash": receipt["fork_hash"],
        "branch_hash": branch["branch_hash"],
        "branch_ledger_head": branch["branch_ledger_head"],
        "target_query": {
            "known_cutoff": target_known,
            "valid_time": target_valid,
            "evidence_known_cutoff": evidence_known_cutoff,
        },
        "observed_policy": observed_policy,
        "counterfactual_policy": branch_policy,
        "observed_outcome": observed_outcome,
        "counterfactual_outcome": branch_outcome,
        "policy_changed": policy_changed,
        "outcome_changed": outcome_changed,
        "target_class": target_class,
        "temporal_class": temporal_class,
        "first_policy_divergence": first_policy,
        "first_outcome_divergence": first_outcome,
        "causal_claim": "NONE_SENSITIVITY_IS_NOT_CAUSAL_ATTRIBUTION",
    }
    row["row_hash"] = sha256_obj(row)
    return row


def build_atlas(
    *,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    target_known=10,
    target_valid=10,
    evidence_known_cutoff=10,
):
    receipts = make_intervention_receipts(observed_ledger)
    rows = []
    for receipt in receipts:
        branch = build_single_branch(observed_ledger, receipt)
        rows.append(
            classify_intervention(
                receipt=receipt,
                branch=branch,
                bundle=bundle,
                reviewer_registry=reviewer_registry,
                policy_records=policy_records,
                observed_ledger=observed_ledger,
                target_known=target_known,
                target_valid=target_valid,
                evidence_known_cutoff=evidence_known_cutoff,
            )
        )
    rows.sort(key=lambda row: row["intervention_id"])
    atlas = {
        "experiment": "NBG-T13",
        "version": VERSION,
        "atlas_kind": "GOVERNANCE_SENSITIVITY",
        "observed_ledger_head": t11.validate_policy_ledger(observed_ledger),
        "target_query": {
            "known_cutoff": target_known,
            "valid_time": target_valid,
            "evidence_known_cutoff": evidence_known_cutoff,
        },
        "rows": rows,
        "truth_claim": BOUNDARY,
    }
    atlas["atlas_hash"] = sha256_obj(atlas)
    return atlas


def validate_atlas(atlas, observed_ledger):
    frozen = deepcopy(atlas)
    expected = frozen.pop("atlas_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("sensitivity atlas hash mismatch")
    if atlas["atlas_kind"] != "GOVERNANCE_SENSITIVITY":
        raise ValueError("atlas kind mismatch")
    if atlas["truth_claim"] != BOUNDARY:
        raise ValueError("sensitivity truth boundary missing")
    if atlas["observed_ledger_head"] != t11.validate_policy_ledger(observed_ledger):
        raise ValueError("atlas observed head mismatch")
    if [r["intervention_id"] for r in atlas["rows"]] != sorted(r["intervention_id"] for r in atlas["rows"]):
        raise ValueError("atlas rows not canonical")
    for row in atlas["rows"]:
        frozen_row = deepcopy(row)
        expected_row = frozen_row.pop("row_hash")
        if sha256_obj(frozen_row) != expected_row:
            raise ValueError("atlas row hash mismatch")
    return True


def minimal_intervention_sets(
    *,
    receipts,
    desired_outcome,
    bundle,
    reviewer_registry,
    policy_records,
    observed_ledger,
    target_known=10,
    target_valid=10,
    evidence_known_cutoff=10,
    max_size=3,
):
    for size in range(1, min(max_size, len(receipts)) + 1):
        winners = []
        for combo in combinations(receipts, size):
            targets = [r["target_event_id"] for r in combo]
            if len(targets) != len(set(targets)):
                continue
            branch = apply_intervention_set(observed_ledger, combo)
            validate_intervention_set_branch(branch, observed_ledger)
            try:
                policy, outcome = outcome_at(
                    bundle=bundle,
                    reviewer_registry=reviewer_registry,
                    policy_records=policy_records,
                    events=branch["branch_ledger"],
                    known_cutoff=target_known,
                    valid_time=target_valid,
                    evidence_known_cutoff=evidence_known_cutoff,
                )
            except ValueError:
                continue
            if outcome == desired_outcome:
                winners.append({
                    "intervention_ids": branch["intervention_ids"],
                    "cardinality": size,
                    "selected_policy": policy,
                    "outcome": outcome,
                    "branch_hash": branch["branch_hash"],
                    "branch_ledger_head": branch["branch_ledger_head"],
                })
        if winners:
            winners.sort(key=lambda row: tuple(row["intervention_ids"]))
            result = {
                "desired_outcome": desired_outcome,
                "target_query": {
                    "known_cutoff": target_known,
                    "valid_time": target_valid,
                    "evidence_known_cutoff": evidence_known_cutoff,
                },
                "minimal_cardinality": size,
                "sets": winners,
                "causal_claim": "NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE",
            }
            result["result_hash"] = sha256_obj(result)
            return result
    result = {
        "desired_outcome": desired_outcome,
        "target_query": {
            "known_cutoff": target_known,
            "valid_time": target_valid,
            "evidence_known_cutoff": evidence_known_cutoff,
        },
        "minimal_cardinality": None,
        "sets": [],
        "causal_claim": "NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE",
    }
    result["result_hash"] = sha256_obj(result)
    return result


def run_suite():
    base_claim, bundle, reviewer_registry, policy_records, observed_ledger, *_ = t12.frozen_fixture()
    receipts = make_intervention_receipts(observed_ledger)
    by_id = {r["intervention_id"]: r for r in receipts}
    branches = {rid: build_single_branch(observed_ledger, receipt) for rid, receipt in by_id.items()}
    atlas = build_atlas(
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
    )
    atlas_by_id = {row["intervention_id"]: row for row in atlas["rows"]}

    minimal = minimal_intervention_sets(
        receipts=receipts,
        desired_outcome="REJECTED",
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policy_records=policy_records,
        observed_ledger=observed_ledger,
    )

    observed_before = canonical(observed_ledger)
    _ = [build_single_branch(observed_ledger, receipt) for receipt in receipts]
    observed_after = canonical(observed_ledger)

    payload_control = atlas_by_id["I_ALTER_DEACTIVATE_PAYLOAD_ONLY"]
    supersede_control = atlas_by_id["I_REMOVE_SUPERSEDE_NORMAL1"]
    activate = atlas_by_id["I_DELAY_ACTIVATE_EMERGENCY_8"]
    alter_t10 = atlas_by_id["I_ALTER_DEACTIVATE_VALID10"]

    expected_minimal = {
        "I_DELAY_DEACTIVATE_11",
        "I_DELAY_REGISTER_NORMAL2_11",
        "I_REMOVE_DEACTIVATE",
        "I_REMOVE_REGISTER_NORMAL2",
    }
    actual_minimal = {row["intervention_ids"][0] for row in minimal["sets"]}

    checks = [
        {"name":"grammar:nine_interventions","pass":len(receipts)==9},
        {"name":"grammar:all_receipts_valid","pass":all(validate_intervention_receipt(r,observed_ledger) for r in receipts)},
        {"name":"branches:all_valid","pass":all(validate_single_branch(branches[rid],observed_ledger,by_id[rid]) for rid in branches)},
        {"name":"observed:ledger_immutable","pass":observed_before==observed_after},
        {"name":"atlas:valid","pass":validate_atlas(atlas,observed_ledger)},
        {"name":"atlas:nine_rows","pass":len(atlas["rows"])==9},
        {"name":"atlas:canonical_order","pass":[r["intervention_id"] for r in atlas["rows"]]==sorted(r["intervention_id"] for r in atlas["rows"])},
        {"name":"target:observed_outcome_abstain","pass":all(r["observed_outcome"]=="ABSTAIN_CONFLICT" for r in atlas["rows"])},
        {"name":"remove_deactivate:outcome_changes","pass":atlas_by_id["I_REMOVE_DEACTIVATE"]["target_class"]=="OUTCOME_CHANGING"},
        {"name":"delay_deactivate:outcome_changes","pass":atlas_by_id["I_DELAY_DEACTIVATE_11"]["target_class"]=="OUTCOME_CHANGING"},
        {"name":"remove_register_normal2:outcome_changes","pass":atlas_by_id["I_REMOVE_REGISTER_NORMAL2"]["target_class"]=="OUTCOME_CHANGING"},
        {"name":"delay_register_normal2:outcome_changes","pass":atlas_by_id["I_DELAY_REGISTER_NORMAL2_11"]["target_class"]=="OUTCOME_CHANGING"},
        {"name":"alter_valid10:target_inert","pass":alter_t10["target_class"]=="TARGET_INERT"},
        {"name":"alter_valid10:temporal_outcome_leverage","pass":alter_t10["temporal_class"]=="TEMPORAL_OUTCOME_LEVERAGE"},
        {"name":"alter_valid10:first_outcome_k9_t9","pass":alter_t10["first_outcome_divergence"]["known_cutoff"]==9 and alter_t10["first_outcome_divergence"]["valid_time"]==9},
        {"name":"delay_activate:target_inert","pass":activate["target_class"]=="TARGET_INERT"},
        {"name":"delay_activate:temporal_policy_leverage","pass":activate["temporal_class"]=="TEMPORAL_POLICY_LEVERAGE"},
        {"name":"delay_activate:no_outcome_divergence","pass":activate["first_outcome_divergence"] is None},
        {"name":"payload_control:target_inert","pass":payload_control["target_class"]=="TARGET_INERT"},
        {"name":"payload_control:ledger_only","pass":payload_control["temporal_class"]=="LEDGER_ONLY_INERT"},
        {"name":"payload_control:branch_head_differs","pass":payload_control["branch_ledger_head"]!=t11.validate_policy_ledger(observed_ledger)},
        {"name":"supersede_control:target_inert","pass":supersede_control["target_class"]=="TARGET_INERT"},
        {"name":"supersede_control:ledger_only","pass":supersede_control["temporal_class"]=="LEDGER_ONLY_INERT"},
        {"name":"minimal:desired_rejected","pass":minimal["desired_outcome"]=="REJECTED"},
        {"name":"minimal:cardinality_one","pass":minimal["minimal_cardinality"]==1},
        {"name":"minimal:four_singletons","pass":len(minimal["sets"])==4},
        {"name":"minimal:expected_singletons","pass":actual_minimal==expected_minimal},
        {"name":"minimal:no_payload_control","pass":"I_ALTER_DEACTIVATE_PAYLOAD_ONLY" not in actual_minimal},
        {"name":"minimal:no_supersede_control","pass":"I_REMOVE_SUPERSEDE_NORMAL1" not in actual_minimal},
        {"name":"minimal:causal_boundary","pass":minimal["causal_claim"]=="NONE_MINIMAL_INTERVENTION_SET_IS_NOT_TRUE_CAUSE"},
        {"name":"atlas:causal_boundary","pass":atlas["truth_claim"]==BOUNDARY},
        {"name":"rows:no_causal_attribution","pass":all(r["causal_claim"]=="NONE_SENSITIVITY_IS_NOT_CAUSAL_ATTRIBUTION" for r in atlas["rows"])},
        {"name":"source:status_immutable","pass":base_claim["source_status"]=="ALLEGED"},
        {"name":"replay:atlas_deterministic","pass":canonical(atlas)==canonical(build_atlas(bundle=bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,observed_ledger=observed_ledger))},
        {"name":"replay:minimal_deterministic","pass":canonical(minimal)==canonical(minimal_intervention_sets(receipts=receipts,desired_outcome="REJECTED",bundle=bundle,reviewer_registry=reviewer_registry,policy_records=policy_records,observed_ledger=observed_ledger))},
        {"name":"negative_controls:two_frozen","pass":sum(1 for r in atlas["rows"] if r["temporal_class"]=="LEDGER_ONLY_INERT")>=2},
    ]

    payload = {
        "experiment":"NBG-T13",
        "version":VERSION,
        "witness":{
            "atlas_rows":len(atlas["rows"]),
            "target_known":10,
            "target_valid":10,
            "observed_outcome":"ABSTAIN_CONFLICT",
            "outcome_changing_count":sum(1 for r in atlas["rows"] if r["target_class"]=="OUTCOME_CHANGING"),
            "target_inert_count":sum(1 for r in atlas["rows"] if r["target_class"]=="TARGET_INERT"),
            "ledger_only_inert_count":sum(1 for r in atlas["rows"] if r["temporal_class"]=="LEDGER_ONLY_INERT"),
            "minimal_cardinality":minimal["minimal_cardinality"],
            "minimal_set_count":len(minimal["sets"]),
            "minimal_singletons":sorted(actual_minimal),
            "payload_control_class":payload_control["temporal_class"],
            "alter_valid10_first_divergence":alter_t10["first_outcome_divergence"],
        },
        "atlas":atlas,
        "minimal_intervention_sets":minimal,
        "checks":checks,
        "checks_passed":sum(bool(c["pass"]) for c in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT13" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT13"
    payload["result_hash"]=sha256_obj(payload)
    return payload, {
        "atlas":atlas,
        "intervention_receipts":receipts,
        "minimal_intervention_sets":minimal,
        "payload_negative_control":payload_control,
        "alter_valid10_row":alter_t10,
    }


def main():
    payload, artifacts = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    for name,obj in {
        "sensitivity_atlas.json":artifacts["atlas"],
        "intervention_receipts.json":artifacts["intervention_receipts"],
        "minimal_intervention_sets.json":artifacts["minimal_intervention_sets"],
        "payload_negative_control.json":artifacts["payload_negative_control"],
        "alter_valid10_row.json":artifacts["alter_valid10_row"],
    }.items():
        (out/name).write_text(json.dumps(obj,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "atlas_rows":payload["witness"]["atlas_rows"],
        "outcome_changing":payload["witness"]["outcome_changing_count"],
        "ledger_only_inert":payload["witness"]["ledger_only_inert_count"],
        "minimal_cardinality":payload["witness"]["minimal_cardinality"],
        "minimal_sets":payload["witness"]["minimal_set_count"],
        "failed_checks":[row["name"] for row in payload["checks"] if not row["pass"]],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_NBGT13":
        raise SystemExit(1)


if __name__=="__main__":
    main()
