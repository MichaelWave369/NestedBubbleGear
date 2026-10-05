#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

CAPTURE_STATUSES = {"CAPTURED", "AMBIGUOUS", "FAILED"}
STANCES = {"SUPPORT", "OPPOSE", "UNKNOWN"}
DECISIONS = {"ACCEPT", "REJECT"}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def digest_obj(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def digest_bytes(data):
    return hashlib.sha256(data).hexdigest()


def validate_adapter(adapter):
    required = {
        "adapter_id",
        "provider",
        "adapter_version",
        "independence_group",
        "provenance",
    }
    missing = sorted(required - set(adapter))
    if missing:
        raise ValueError(f"missing adapter fields: {missing}")
    for key in ("adapter_id", "provider", "adapter_version", "independence_group"):
        if not isinstance(adapter[key], str) or not adapter[key]:
            raise ValueError(f"{key} must be a non-empty string")
    return True


def make_capture(
    adapter,
    *,
    capture_id,
    locator,
    retrieved_at,
    status,
    stance,
    content=None,
    network_used=True,
    note="",
):
    validate_adapter(adapter)
    if status not in CAPTURE_STATUSES:
        raise ValueError(f"unsupported capture status: {status}")
    if stance not in STANCES:
        raise ValueError(f"unsupported stance: {stance}")
    if status == "CAPTURED" and content is None:
        raise ValueError("CAPTURED receipt requires content")
    if status != "CAPTURED" and content is not None:
        raise ValueError("non-CAPTURED receipt must not smuggle content")

    content_bytes = content.encode("utf-8") if isinstance(content, str) else content
    content_sha256 = digest_bytes(content_bytes) if content_bytes is not None else None
    content_length = len(content_bytes) if content_bytes is not None else 0

    receipt = {
        "experiment": "NBG-T7",
        "version": VERSION,
        "capture_id": capture_id,
        "adapter": deepcopy(adapter),
        "locator": locator,
        "retrieved_at": retrieved_at,
        "retrieval_status": status,
        "evidence_stance": stance,
        "content_sha256": content_sha256,
        "content_length": content_length,
        "network_used": bool(network_used),
        "note": note,
    }
    receipt["receipt_hash"] = digest_obj(receipt)
    return receipt


def replay_capture(receipt):
    frozen = deepcopy(receipt)
    expected = frozen.pop("receipt_hash")
    actual = digest_obj(frozen)
    if expected != actual:
        raise ValueError("capture receipt hash mismatch")
    return deepcopy(receipt)


def validate_decision(decision):
    required = {
        "decision_id",
        "capture_id",
        "target_claim_id",
        "known_time",
        "reviewer_id",
        "decision",
        "reason",
        "provenance",
    }
    missing = sorted(required - set(decision))
    if missing:
        raise ValueError(f"missing decision fields: {missing}")
    if decision["decision"] not in DECISIONS:
        raise ValueError(f"unsupported decision: {decision['decision']}")
    return True


def accepted_capture_ids(captures, decisions, *, knowledge_cutoff):
    by_id = {capture["capture_id"]: capture for capture in captures}
    accepted = []
    for decision in sorted(decisions, key=lambda d: (d["known_time"], d["decision_id"])):
        validate_decision(decision)
        if decision["known_time"] > knowledge_cutoff:
            continue
        capture = by_id.get(decision["capture_id"])
        if capture is None:
            raise ValueError(f"decision references unknown capture: {decision['capture_id']}")
        if decision["decision"] != "ACCEPT":
            continue
        if capture["retrieval_status"] != "CAPTURED":
            raise ValueError("only CAPTURED receipts may be accepted")
        accepted.append(capture["capture_id"])
    return accepted


def derive_review_status(base_claim, captures, decisions, *, knowledge_cutoff):
    visible_captures = sorted(
        [
            deepcopy(capture)
            for capture in captures
            if capture["retrieved_at"] <= knowledge_cutoff
        ],
        key=lambda c: (c["retrieved_at"], c["capture_id"]),
    )
    accepted_ids = set(
        accepted_capture_ids(
            visible_captures,
            decisions,
            knowledge_cutoff=knowledge_cutoff,
        )
    )
    accepted = [c for c in visible_captures if c["capture_id"] in accepted_ids]

    support_groups = sorted(
        {
            c["adapter"]["independence_group"]
            for c in accepted
            if c["evidence_stance"] == "SUPPORT"
        }
    )
    oppose_groups = sorted(
        {
            c["adapter"]["independence_group"]
            for c in accepted
            if c["evidence_stance"] == "OPPOSE"
        }
    )

    if support_groups and oppose_groups:
        review_status = "DISPUTED"
    elif support_groups:
        review_status = "CORROBORATED"
    elif oppose_groups:
        review_status = "DISPUTED"
    else:
        review_status = base_claim["source_status"]

    return {
        "claim_id": base_claim["claim_id"],
        "source_status": base_claim["source_status"],
        "review_status": review_status,
        "visible_capture_ids": [c["capture_id"] for c in visible_captures],
        "accepted_capture_ids": sorted(accepted_ids),
        "independent_support_groups": support_groups,
        "independent_oppose_groups": oppose_groups,
    }


def detect_version_drift(captures):
    groups = {}
    for capture in captures:
        if capture["retrieval_status"] != "CAPTURED":
            continue
        key = (capture["adapter"]["adapter_id"], capture["locator"])
        groups.setdefault(key, []).append(capture)

    drift = []
    for (adapter_id, locator), rows in sorted(groups.items()):
        rows = sorted(rows, key=lambda r: (r["retrieved_at"], r["capture_id"]))
        for left, right in zip(rows, rows[1:]):
            if left["content_sha256"] != right["content_sha256"]:
                drift.append(
                    {
                        "adapter_id": adapter_id,
                        "locator": locator,
                        "from_capture_id": left["capture_id"],
                        "to_capture_id": right["capture_id"],
                        "from_sha256": left["content_sha256"],
                        "to_sha256": right["content_sha256"],
                        "status": "DRIFT_DETECTED",
                    }
                )
    return drift


def evidence_bundle(base_claim, captures, decisions, *, knowledge_cutoff):
    visible = [
        deepcopy(c)
        for c in captures
        if c["retrieved_at"] <= knowledge_cutoff
    ]
    decision_rows = [
        deepcopy(d)
        for d in decisions
        if d["known_time"] <= knowledge_cutoff
    ]
    derived = derive_review_status(
        base_claim,
        captures,
        decisions,
        knowledge_cutoff=knowledge_cutoff,
    )
    bundle = {
        "experiment": "NBG-T7",
        "version": VERSION,
        "knowledge_cutoff": knowledge_cutoff,
        "base_claim": deepcopy(base_claim),
        "captures": sorted(visible, key=lambda c: (c["retrieved_at"], c["capture_id"])),
        "review_decisions": sorted(
            decision_rows, key=lambda d: (d["known_time"], d["decision_id"])
        ),
        "drift": detect_version_drift(visible),
        "derived": derived,
    }
    bundle["bundle_hash"] = digest_obj(bundle)
    return bundle


def offline_replay(bundle):
    for receipt in bundle["captures"]:
        replay_capture(receipt)
    rebuilt = deepcopy(bundle)
    expected = rebuilt.pop("bundle_hash")
    actual = digest_obj(rebuilt)
    if expected != actual:
        raise ValueError("bundle hash mismatch")
    return deepcopy(bundle["derived"])


def frozen_fixture():
    base_claim = {
        "claim_id": "C1",
        "subject": "NODE_A",
        "relation": "ALLEGED_LINK",
        "object": "NODE_B",
        "source_status": "ALLEGED",
        "provenance": {
            "layer": "SOURCE_MAP",
            "locator": "qweb:p1:fixture-arrow-1",
            "lineage": "QWEB_ORIGINAL",
        },
    }

    archive = {
        "adapter_id": "SYNTH_ARCHIVE",
        "provider": "SYNTHETIC_ARCHIVE_PROVIDER",
        "adapter_version": "1.0",
        "independence_group": "EXT_G1",
        "provenance": "FROZEN_SYNTHETIC_ADAPTER",
    }
    register = {
        "adapter_id": "SYNTH_REGISTER",
        "provider": "SYNTHETIC_REGISTER_PROVIDER",
        "adapter_version": "1.0",
        "independence_group": "EXT_G2",
        "provenance": "FROZEN_SYNTHETIC_ADAPTER",
    }

    captures = [
        make_capture(
            archive,
            capture_id="CAP_SUPPORT_V1",
            locator="synthetic://archive/document-1",
            retrieved_at=5,
            status="CAPTURED",
            stance="SUPPORT",
            content="Synthetic archive document version one.",
            network_used=True,
        ),
        make_capture(
            archive,
            capture_id="CAP_SUPPORT_V2",
            locator="synthetic://archive/document-1",
            retrieved_at=7,
            status="CAPTURED",
            stance="SUPPORT",
            content="Synthetic archive document version two, revised.",
            network_used=True,
        ),
        make_capture(
            register,
            capture_id="CAP_OPPOSE",
            locator="synthetic://register/document-9",
            retrieved_at=8,
            status="CAPTURED",
            stance="OPPOSE",
            content="Synthetic independent opposition document.",
            network_used=True,
        ),
        make_capture(
            register,
            capture_id="CAP_AMBIGUOUS",
            locator="synthetic://register/ambiguous",
            retrieved_at=5,
            status="AMBIGUOUS",
            stance="UNKNOWN",
            network_used=True,
            note="Synthetic response cannot be matched to a stable document identity.",
        ),
        make_capture(
            archive,
            capture_id="CAP_FAILED",
            locator="synthetic://archive/missing",
            retrieved_at=5,
            status="FAILED",
            stance="UNKNOWN",
            network_used=True,
            note="Synthetic adapter returned a retrieval failure.",
        ),
    ]

    decisions = [
        {
            "decision_id": "DEC_SUPPORT",
            "capture_id": "CAP_SUPPORT_V1",
            "target_claim_id": "C1",
            "known_time": 6,
            "reviewer_id": "REVIEWER_1",
            "decision": "ACCEPT",
            "reason": "synthetic acceptance witness",
            "provenance": "review://nbgt7/DEC_SUPPORT",
        },
        {
            "decision_id": "DEC_OPPOSE",
            "capture_id": "CAP_OPPOSE",
            "target_claim_id": "C1",
            "known_time": 9,
            "reviewer_id": "REVIEWER_1",
            "decision": "ACCEPT",
            "reason": "synthetic contradiction witness",
            "provenance": "review://nbgt7/DEC_OPPOSE",
        },
    ]
    return base_claim, captures, decisions


def run_suite():
    base_claim, captures, decisions = frozen_fixture()

    k4 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=4)
    k5 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=5)
    k6 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=6)
    k7 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=7)
    k8 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=8)
    k9 = evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=9)

    support_v1 = next(c for c in captures if c["capture_id"] == "CAP_SUPPORT_V1")
    drift = detect_version_drift(captures)

    checks = [
        {
            "name": "capture:exact_locator",
            "pass": support_v1["locator"] == "synthetic://archive/document-1",
        },
        {
            "name": "capture:retrieval_time",
            "pass": support_v1["retrieved_at"] == 5,
        },
        {
            "name": "capture:content_digest_present",
            "pass": len(support_v1["content_sha256"]) == 64,
        },
        {
            "name": "capture:independence_group_explicit",
            "pass": support_v1["adapter"]["independence_group"] == "EXT_G1",
        },
        {
            "name": "capture:failure_state_preserved",
            "pass": any(
                c["capture_id"] == "CAP_FAILED" and c["retrieval_status"] == "FAILED"
                for c in k5["captures"]
            ),
        },
        {
            "name": "capture:ambiguity_state_preserved",
            "pass": any(
                c["capture_id"] == "CAP_AMBIGUOUS"
                and c["retrieval_status"] == "AMBIGUOUS"
                for c in k5["captures"]
            ),
        },
        {
            "name": "review:retrieval_alone_does_not_upgrade",
            "pass": k5["derived"]["review_status"] == "ALLEGED",
        },
        {
            "name": "review:explicit_acceptance_upgrades",
            "pass": k6["derived"]["review_status"] == "CORROBORATED",
        },
        {
            "name": "source:immutable_status",
            "pass": k9["base_claim"]["source_status"] == "ALLEGED"
            and k9["derived"]["source_status"] == "ALLEGED",
        },
        {
            "name": "drift:detected",
            "pass": len(drift) == 1
            and drift[0]["from_capture_id"] == "CAP_SUPPORT_V1"
            and drift[0]["to_capture_id"] == "CAP_SUPPORT_V2",
        },
        {
            "name": "drift:unaccepted_new_version_does_not_rewrite",
            "pass": k7["derived"]["review_status"] == "CORROBORATED"
            and k7["derived"]["accepted_capture_ids"] == ["CAP_SUPPORT_V1"],
        },
        {
            "name": "contradiction:retrieval_alone_not_applied",
            "pass": k8["derived"]["review_status"] == "CORROBORATED",
        },
        {
            "name": "contradiction:accepted_opposition_preserved",
            "pass": k9["derived"]["review_status"] == "DISPUTED"
            and k9["derived"]["independent_support_groups"] == ["EXT_G1"]
            and k9["derived"]["independent_oppose_groups"] == ["EXT_G2"],
        },
        {
            "name": "offline:receipt_replay_exact",
            "pass": offline_replay(k9) == k9["derived"],
        },
        {
            "name": "no_network:replay_uses_captured_receipts",
            "pass": all("network_used" in c for c in k9["captures"])
            and offline_replay(k6)["review_status"] == "CORROBORATED",
        },
        {
            "name": "no_hindsight:k4_unchanged",
            "pass": k4["derived"]["review_status"] == "ALLEGED"
            and k4["derived"]["visible_capture_ids"] == [],
        },
        {
            "name": "replay:exact",
            "pass": canonical(k9)
            == canonical(
                evidence_bundle(
                    base_claim, captures, decisions, knowledge_cutoff=9
                )
            ),
        },
        {
            "name": "order:canonical_bundle",
            "pass": canonical(k9)
            == canonical(
                evidence_bundle(
                    base_claim,
                    list(reversed(captures)),
                    list(reversed(decisions)),
                    knowledge_cutoff=9,
                )
            ),
        },
    ]

    payload = {
        "experiment": "NBG-T7",
        "version": VERSION,
        "witness": {
            "k4_status": k4["derived"]["review_status"],
            "k5_status": k5["derived"]["review_status"],
            "k6_status": k6["derived"]["review_status"],
            "k7_status": k7["derived"]["review_status"],
            "k8_status": k8["derived"]["review_status"],
            "k9_status": k9["derived"]["review_status"],
            "accepted_k6": k6["derived"]["accepted_capture_ids"],
            "accepted_k9": k9["derived"]["accepted_capture_ids"],
            "drift_count": len(drift),
            "support_groups_k9": k9["derived"]["independent_support_groups"],
            "oppose_groups_k9": k9["derived"]["independent_oppose_groups"],
        },
        "receipts": {
            "k4": k4,
            "k5": k5,
            "k6": k6,
            "k7": k7,
            "k8": k8,
            "k9": k9,
        },
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = (
        "PASS_NBGT7"
        if payload["checks_passed"] == payload["checks_total"]
        else "FAIL_NBGT7"
    )
    payload["result_hash"] = digest_obj(payload)
    return payload


def main():
    payload = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    base_claim, captures, decisions = frozen_fixture()

    (out / "base_claim.json").write_text(
        json.dumps(base_claim, indent=2, sort_keys=True) + "\n"
    )
    (out / "capture_receipts.json").write_text(
        json.dumps(captures, indent=2, sort_keys=True) + "\n"
    )
    (out / "review_decisions.json").write_text(
        json.dumps(decisions, indent=2, sort_keys=True) + "\n"
    )
    (out / "drift_report.json").write_text(
        json.dumps(detect_version_drift(captures), indent=2, sort_keys=True) + "\n"
    )

    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)

    print(
        json.dumps(
            {
                "verdict": payload["verdict"],
                "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
                "k5": payload["witness"]["k5_status"],
                "k6": payload["witness"]["k6_status"],
                "k9": payload["witness"]["k9_status"],
                "drift_count": payload["witness"]["drift_count"],
                "result_sha256": hashlib.sha256(data).hexdigest(),
            },
            indent=2,
        )
    )
    if payload["verdict"] != "PASS_NBGT7":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
