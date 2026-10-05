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
T9_PATH = ROOT.parent / "NBGT9" / "src" / "nbgt9.py"

_spec = importlib.util.spec_from_file_location("nbgt9_for_t10", T9_PATH)
t9 = importlib.util.module_from_spec(_spec)
sys.modules[_spec.name] = t9
_spec.loader.exec_module(t9)


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def make_reviewer_registry(reviewers):
    by_id = {}
    for reviewer in reviewers:
        required = {"reviewer_id", "role", "authority", "active"}
        missing = required - set(reviewer)
        if missing:
            raise ValueError(f"reviewer missing fields: {sorted(missing)}")
        rid = reviewer["reviewer_id"]
        if rid in by_id:
            raise ValueError(f"duplicate reviewer_id: {rid}")
        if not isinstance(reviewer["authority"], int) or reviewer["authority"] < 0:
            raise ValueError("reviewer authority must be a non-negative integer")
        by_id[rid] = deepcopy(reviewer)
    registry = {
        "experiment": "NBG-T10",
        "version": VERSION,
        "reviewers": sorted(by_id.values(), key=lambda r: r["reviewer_id"]),
    }
    registry["registry_sha256"] = sha256_obj(registry)
    return registry


def validate_reviewer_registry(registry):
    frozen = deepcopy(registry)
    expected = frozen.pop("registry_sha256")
    if sha256_obj(frozen) != expected:
        raise ValueError("reviewer registry hash mismatch")
    make_reviewer_registry(frozen["reviewers"])
    return True


def make_policy(
    *,
    policy_id,
    policy_version,
    mode,
    eligible_roles,
    min_participants,
    accept_threshold,
    reject_threshold,
    weight_mode,
    effective_from,
    effective_until,
    description,
):
    if mode not in {"WEIGHTED_THRESHOLD", "UNANIMOUS"}:
        raise ValueError("unsupported policy mode")
    if weight_mode not in {"UNIT", "REVIEWER_AUTHORITY"}:
        raise ValueError("unsupported weight mode")
    if not eligible_roles:
        raise ValueError("policy requires eligible roles")
    if min_participants < 1:
        raise ValueError("min_participants must be positive")
    if effective_until < effective_from:
        raise ValueError("invalid policy time window")
    policy = {
        "policy_id": policy_id,
        "policy_version": policy_version,
        "mode": mode,
        "eligible_roles": sorted(set(eligible_roles)),
        "min_participants": int(min_participants),
        "accept_threshold": int(accept_threshold),
        "reject_threshold": int(reject_threshold),
        "weight_mode": weight_mode,
        "effective_from": int(effective_from),
        "effective_until": int(effective_until),
        "description": description,
        "truth_claim": "NONE_POLICY_IS_GOVERNANCE_NOT_TRUTH",
    }
    policy["policy_sha256"] = sha256_obj(policy)
    return policy


def validate_policy(policy, *, known_time):
    frozen = deepcopy(policy)
    expected = frozen.pop("policy_sha256")
    if sha256_obj(frozen) != expected:
        raise ValueError("policy hash mismatch")
    if not (policy["effective_from"] <= known_time <= policy["effective_until"]):
        raise ValueError("policy is stale or not yet effective")
    return True


def reviewer_index(registry):
    validate_reviewer_registry(registry)
    return {r["reviewer_id"]: deepcopy(r) for r in registry["reviewers"]}


def decisions_for_capture(bundle, capture_id):
    t9.validate_bundle(bundle)
    return sorted(
        [deepcopy(d) for d in bundle["payload"]["decisions"] if d["capture_id"] == capture_id],
        key=lambda d: (d["known_time"], d["decision_id"]),
    )


def _weight(policy, reviewer):
    return 1 if policy["weight_mode"] == "UNIT" else reviewer["authority"]


def resolve_conflict(
    *,
    bundle,
    capture_id,
    reviewer_registry,
    policy,
    known_time,
    expected_manifest_hash,
    expected_reviewer_registry_hash,
):
    t9.validate_bundle(bundle)
    validate_reviewer_registry(reviewer_registry)
    validate_policy(policy, known_time=known_time)

    if bundle["manifest"]["manifest_hash"] != expected_manifest_hash:
        raise ValueError("bundle manifest hash mismatch against operator expectation")
    if reviewer_registry["registry_sha256"] != expected_reviewer_registry_hash:
        raise ValueError("reviewer registry hash mismatch against operator expectation")

    all_decisions = decisions_for_capture(bundle, capture_id)
    reviewers = reviewer_index(reviewer_registry)

    visible = [d for d in all_decisions if d["known_time"] <= known_time]
    eligible = []
    for decision in visible:
        reviewer = reviewers.get(decision["reviewer_id"])
        if reviewer is None:
            raise ValueError(f"unknown reviewer: {decision['reviewer_id']}")
        if not reviewer["active"]:
            continue
        if reviewer["role"] not in policy["eligible_roles"]:
            continue
        eligible.append((decision, reviewer))

    participants = sorted({d["reviewer_id"] for d, _ in eligible})
    accept_score = sum(_weight(policy, r) for d, r in eligible if d["decision"] == "ACCEPT")
    reject_score = sum(_weight(policy, r) for d, r in eligible if d["decision"] == "REJECT")

    if len(participants) < policy["min_participants"]:
        outcome = "INSUFFICIENT_AUTHORITY"
        reason = "eligible participant quorum not met"
    elif policy["mode"] == "UNANIMOUS":
        votes = {d["decision"] for d, _ in eligible}
        if votes == {"ACCEPT"}:
            outcome = "ACCEPTED"
            reason = "all eligible participants accepted"
        elif votes == {"REJECT"}:
            outcome = "REJECTED"
            reason = "all eligible participants rejected"
        else:
            outcome = "ABSTAIN_CONFLICT"
            reason = "eligible participants disagree under unanimity policy"
    else:
        accept_met = accept_score >= policy["accept_threshold"]
        reject_met = reject_score >= policy["reject_threshold"]
        if accept_met and reject_met:
            outcome = "ABSTAIN_CONFLICT"
            reason = "both policy thresholds met"
        elif accept_met:
            outcome = "ACCEPTED"
            reason = "accept threshold met"
        elif reject_met:
            outcome = "REJECTED"
            reason = "reject threshold met"
        else:
            outcome = "ABSTAIN"
            reason = "no policy threshold met"

    input_hashes = sorted(d["decision_hash"] for d in visible)
    receipt = {
        "experiment": "NBG-T10",
        "version": VERSION,
        "receipt_type": "CONFLICT_RESOLUTION",
        "capture_id": capture_id,
        "known_time": int(known_time),
        "bundle_manifest_hash": bundle["manifest"]["manifest_hash"],
        "reviewer_registry_sha256": reviewer_registry["registry_sha256"],
        "policy_id": policy["policy_id"],
        "policy_version": policy["policy_version"],
        "policy_sha256": policy["policy_sha256"],
        "input_decision_hashes": input_hashes,
        "eligible_reviewer_ids": participants,
        "accept_score": accept_score,
        "reject_score": reject_score,
        "governance_outcome": outcome,
        "reason": reason,
        "truth_claim": "NONE_POLICY_OUTCOME_IS_NOT_OBJECTIVE_TRUTH",
    }
    receipt["receipt_hash"] = sha256_obj(receipt)
    return receipt


def replay_receipt(receipt, *, bundle, reviewer_registry, policies):
    frozen = deepcopy(receipt)
    expected = frozen.pop("receipt_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("resolution receipt hash mismatch")
    key = (receipt["policy_id"], receipt["policy_version"])
    policy = policies.get(key)
    if policy is None:
        raise ValueError("resolution policy unavailable")
    rebuilt = resolve_conflict(
        bundle=bundle,
        capture_id=receipt["capture_id"],
        reviewer_registry=reviewer_registry,
        policy=policy,
        known_time=receipt["known_time"],
        expected_manifest_hash=receipt["bundle_manifest_hash"],
        expected_reviewer_registry_hash=receipt["reviewer_registry_sha256"],
    )
    if canonical(rebuilt) != canonical(receipt):
        raise ValueError("resolution replay mismatch")
    return deepcopy(receipt)


def policy_comparison(*, bundle, capture_id, reviewer_registry, policies, known_time):
    rows = []
    for policy in sorted(policies, key=lambda p: (p["policy_id"], p["policy_version"])):
        receipt = resolve_conflict(
            bundle=bundle,
            capture_id=capture_id,
            reviewer_registry=reviewer_registry,
            policy=policy,
            known_time=known_time,
            expected_manifest_hash=bundle["manifest"]["manifest_hash"],
            expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
        )
        rows.append({
            "policy_id": policy["policy_id"],
            "policy_version": policy["policy_version"],
            "outcome": receipt["governance_outcome"],
            "receipt_hash": receipt["receipt_hash"],
            "input_decision_hashes": receipt["input_decision_hashes"],
        })
    return rows


def frozen_fixture():
    base_claim, source_registry, captures, objects, a, b, c = t9.frozen_fixture()
    merged = t9.merge_bundles(
        [a, b, c],
        merged_bundle_id="T10_INPUT_BUNDLE",
        created_at="2026-10-04T19:25:00Z",
    )

    reviewer_registry = make_reviewer_registry([
        {"reviewer_id": "ALICE", "role": "RESEARCHER", "authority": 1, "active": True},
        {"reviewer_id": "BOB", "role": "RESEARCHER", "authority": 1, "active": True},
        {"reviewer_id": "CAROL", "role": "AUDITOR", "authority": 2, "active": True},
        {"reviewer_id": "DAVE", "role": "OBSERVER", "authority": 0, "active": True},
    ])

    policies = [
        make_policy(
            policy_id="POLICY_WEIGHTED_AUTHORITY",
            policy_version="1.0",
            mode="WEIGHTED_THRESHOLD",
            eligible_roles={"RESEARCHER", "AUDITOR"},
            min_participants=2,
            accept_threshold=2,
            reject_threshold=2,
            weight_mode="REVIEWER_AUTHORITY",
            effective_from=1,
            effective_until=20,
            description="Authority-weighted threshold policy.",
        ),
        make_policy(
            policy_id="POLICY_UNANIMOUS",
            policy_version="1.0",
            mode="UNANIMOUS",
            eligible_roles={"RESEARCHER", "AUDITOR"},
            min_participants=2,
            accept_threshold=1,
            reject_threshold=1,
            weight_mode="UNIT",
            effective_from=1,
            effective_until=20,
            description="All eligible reviewers must agree.",
        ),
        make_policy(
            policy_id="POLICY_RESEARCHER_QUORUM",
            policy_version="1.0",
            mode="WEIGHTED_THRESHOLD",
            eligible_roles={"RESEARCHER"},
            min_participants=2,
            accept_threshold=2,
            reject_threshold=2,
            weight_mode="UNIT",
            effective_from=1,
            effective_until=20,
            description="Two-researcher quorum.",
        ),
        make_policy(
            policy_id="POLICY_SINGLE_RESEARCHER",
            policy_version="1.0",
            mode="WEIGHTED_THRESHOLD",
            eligible_roles={"RESEARCHER"},
            min_participants=1,
            accept_threshold=1,
            reject_threshold=1,
            weight_mode="UNIT",
            effective_from=1,
            effective_until=20,
            description="Single active researcher may resolve.",
        ),
    ]
    return base_claim, merged, reviewer_registry, policies


def run_suite():
    base_claim, bundle, reviewer_registry, policies = frozen_fixture()
    pmap = {(p["policy_id"], p["policy_version"]): p for p in policies}
    weighted, unanimous, research_quorum, single = policies

    weighted_receipt = resolve_conflict(
        bundle=bundle,
        capture_id="CAP_OPPOSE",
        reviewer_registry=reviewer_registry,
        policy=weighted,
        known_time=10,
        expected_manifest_hash=bundle["manifest"]["manifest_hash"],
        expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
    )
    unanimous_receipt = resolve_conflict(
        bundle=bundle,
        capture_id="CAP_OPPOSE",
        reviewer_registry=reviewer_registry,
        policy=unanimous,
        known_time=10,
        expected_manifest_hash=bundle["manifest"]["manifest_hash"],
        expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
    )
    quorum_receipt = resolve_conflict(
        bundle=bundle,
        capture_id="CAP_OPPOSE",
        reviewer_registry=reviewer_registry,
        policy=research_quorum,
        known_time=10,
        expected_manifest_hash=bundle["manifest"]["manifest_hash"],
        expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
    )
    support_receipt = resolve_conflict(
        bundle=bundle,
        capture_id="CAP_A_V1",
        reviewer_registry=reviewer_registry,
        policy=single,
        known_time=10,
        expected_manifest_hash=bundle["manifest"]["manifest_hash"],
        expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
    )
    comparison = policy_comparison(
        bundle=bundle,
        capture_id="CAP_OPPOSE",
        reviewer_registry=reviewer_registry,
        policies=[weighted, unanimous, research_quorum],
        known_time=10,
    )
    decisions_before = canonical(bundle["payload"]["decisions"])
    replayed = replay_receipt(
        weighted_receipt,
        bundle=bundle,
        reviewer_registry=reviewer_registry,
        policies=pmap,
    )
    decisions_after = canonical(bundle["payload"]["decisions"])

    stale_policy = make_policy(
        policy_id="POLICY_STALE",
        policy_version="1.0",
        mode="WEIGHTED_THRESHOLD",
        eligible_roles={"RESEARCHER"},
        min_participants=1,
        accept_threshold=1,
        reject_threshold=1,
        weight_mode="UNIT",
        effective_from=1,
        effective_until=5,
        description="Expired witness policy.",
    )
    stale_blocked = False
    try:
        resolve_conflict(
            bundle=bundle,
            capture_id="CAP_OPPOSE",
            reviewer_registry=reviewer_registry,
            policy=stale_policy,
            known_time=10,
            expected_manifest_hash=bundle["manifest"]["manifest_hash"],
            expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
        )
    except ValueError:
        stale_blocked = True

    manifest_mismatch_blocked = False
    try:
        resolve_conflict(
            bundle=bundle,
            capture_id="CAP_OPPOSE",
            reviewer_registry=reviewer_registry,
            policy=weighted,
            known_time=10,
            expected_manifest_hash="0" * 64,
            expected_reviewer_registry_hash=reviewer_registry["registry_sha256"],
        )
    except ValueError:
        manifest_mismatch_blocked = True

    registry_mismatch_blocked = False
    try:
        resolve_conflict(
            bundle=bundle,
            capture_id="CAP_OPPOSE",
            reviewer_registry=reviewer_registry,
            policy=weighted,
            known_time=10,
            expected_manifest_hash=bundle["manifest"]["manifest_hash"],
            expected_reviewer_registry_hash="f" * 64,
        )
    except ValueError:
        registry_mismatch_blocked = True

    checks = [
        {"name":"registry:valid","pass":validate_reviewer_registry(reviewer_registry)},
        {"name":"registry:roles_explicit","pass":{r["role"] for r in reviewer_registry["reviewers"]}=={"RESEARCHER","AUDITOR","OBSERVER"}},
        {"name":"policy:data_hashed","pass":all(len(p["policy_sha256"])==64 for p in policies)},
        {"name":"policy:truth_claim_none","pass":all(p["truth_claim"]=="NONE_POLICY_IS_GOVERNANCE_NOT_TRUTH" for p in policies)},
        {"name":"weighted:rejects_conflict","pass":weighted_receipt["governance_outcome"]=="REJECTED"},
        {"name":"weighted:scores_preserved","pass":weighted_receipt["accept_score"]==1 and weighted_receipt["reject_score"]==2},
        {"name":"unanimous:abstains_on_conflict","pass":unanimous_receipt["governance_outcome"]=="ABSTAIN_CONFLICT"},
        {"name":"quorum:insufficient_authority","pass":quorum_receipt["governance_outcome"]=="INSUFFICIENT_AUTHORITY"},
        {"name":"single_researcher:accepts_support","pass":support_receipt["governance_outcome"]=="ACCEPTED"},
        {"name":"receipt:policy_id","pass":weighted_receipt["policy_id"]=="POLICY_WEIGHTED_AUTHORITY"},
        {"name":"receipt:inputs_preserved","pass":len(weighted_receipt["input_decision_hashes"])==2},
        {"name":"receipt:hash_present","pass":len(weighted_receipt["receipt_hash"])==64},
        {"name":"receipt:truth_boundary","pass":weighted_receipt["truth_claim"]=="NONE_POLICY_OUTCOME_IS_NOT_OBJECTIVE_TRUTH"},
        {"name":"history:decisions_immutable","pass":decisions_before==decisions_after},
        {"name":"comparison:same_inputs_multiple_outcomes","pass":{row["outcome"] for row in comparison}=={"REJECTED","ABSTAIN_CONFLICT","INSUFFICIENT_AUTHORITY"}},
        {"name":"comparison:input_hashes_same","pass":len({tuple(row["input_decision_hashes"]) for row in comparison})==1},
        {"name":"stale_policy:blocked","pass":stale_blocked},
        {"name":"bundle_expectation:mismatch_blocked","pass":manifest_mismatch_blocked},
        {"name":"registry_expectation:mismatch_blocked","pass":registry_mismatch_blocked},
        {"name":"replay:receipt_exact","pass":canonical(replayed)==canonical(weighted_receipt)},
        {"name":"t9_input:conflict_preserved","pass":t9.merged_review_state("CAP_OPPOSE",bundle["payload"]["decisions"])=="REVIEW_CONFLICT"},
        {"name":"source:status_immutable","pass":base_claim["source_status"]=="ALLEGED"},
        {"name":"policy_versions:explicit","pass":all(p["policy_version"]=="1.0" for p in policies)},
        {"name":"replay:deterministic","pass":canonical(weighted_receipt)==canonical(resolve_conflict(bundle=bundle,capture_id="CAP_OPPOSE",reviewer_registry=reviewer_registry,policy=weighted,known_time=10,expected_manifest_hash=bundle["manifest"]["manifest_hash"],expected_reviewer_registry_hash=reviewer_registry["registry_sha256"]))},
    ]

    payload = {
        "experiment": "NBG-T10",
        "version": VERSION,
        "witness": {
            "input_manifest_hash": bundle["manifest"]["manifest_hash"],
            "reviewer_registry_sha256": reviewer_registry["registry_sha256"],
            "input_review_state": t9.merged_review_state("CAP_OPPOSE", bundle["payload"]["decisions"]),
            "weighted_outcome": weighted_receipt["governance_outcome"],
            "unanimous_outcome": unanimous_receipt["governance_outcome"],
            "researcher_quorum_outcome": quorum_receipt["governance_outcome"],
            "support_outcome": support_receipt["governance_outcome"],
            "stale_policy_blocked": stale_blocked,
            "manifest_mismatch_blocked": manifest_mismatch_blocked,
            "registry_mismatch_blocked": registry_mismatch_blocked,
        },
        "receipts": {
            "weighted": weighted_receipt,
            "unanimous": unanimous_receipt,
            "researcher_quorum": quorum_receipt,
            "support": support_receipt,
        },
        "comparison": comparison,
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = "PASS_NBGT10" if payload["checks_passed"] == payload["checks_total"] else "FAIL_NBGT10"
    payload["result_hash"] = sha256_obj(payload)
    return payload, {
        "reviewer_registry": reviewer_registry,
        "policies": policies,
        "policy_comparison": comparison,
        "weighted_receipt": weighted_receipt,
        "input_bundle_manifest": bundle["manifest"],
    }


def main():
    payload, artifacts = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    for name, obj in {
        "reviewer_registry.json": artifacts["reviewer_registry"],
        "policies.json": artifacts["policies"],
        "policy_comparison.json": artifacts["policy_comparison"],
        "weighted_resolution_receipt.json": artifacts["weighted_receipt"],
        "input_bundle_manifest.json": artifacts["input_bundle_manifest"],
    }.items():
        (out / name).write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")
    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)
    print(json.dumps({
        "verdict": payload["verdict"],
        "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
        "input_review_state": payload["witness"]["input_review_state"],
        "weighted": payload["witness"]["weighted_outcome"],
        "unanimous": payload["witness"]["unanimous_outcome"],
        "researcher_quorum": payload["witness"]["researcher_quorum_outcome"],
        "result_sha256": hashlib.sha256(data).hexdigest(),
    }, indent=2))
    if payload["verdict"] != "PASS_NBGT10":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
