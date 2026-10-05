#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import hashlib
import ipaddress
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


def validate_locator(locator, allow_hosts):
    parsed = urlparse(locator)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("only http/https locators are allowed")
    if not parsed.hostname:
        raise ValueError("locator requires a hostname")
    host = parsed.hostname.lower()
    allowed = {h.lower() for h in allow_hosts}
    if host not in allowed:
        raise ValueError(f"host not allow-listed: {host}")
    try:
        ip = ipaddress.ip_address(host)
    except ValueError:
        ip = None
    if ip and (ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved):
        raise ValueError("private/loopback/link-local/reserved hosts are refused")
    return parsed


def make_adapter(adapter_id, provider, adapter_version, independence_group, allow_hosts, *, max_bytes=1_000_000, timeout_seconds=10):
    if not adapter_id or not provider or not adapter_version or not independence_group:
        raise ValueError("adapter identity fields must be non-empty")
    if not allow_hosts:
        raise ValueError("adapter requires at least one allow-listed host")
    return {
        "adapter_id": adapter_id,
        "provider": provider,
        "adapter_version": adapter_version,
        "independence_group": independence_group,
        "allow_hosts": sorted({h.lower() for h in allow_hosts}),
        "max_bytes": int(max_bytes),
        "timeout_seconds": int(timeout_seconds),
        "provenance": "NBG_T8_READ_ONLY_ADAPTER",
    }


def _receipt(adapter, *, capture_id, locator, retrieved_at, retrieved_timestamp, status, stance, content=None, note="", http_status=None, content_type=None, final_locator=None):
    if status not in CAPTURE_STATUSES:
        raise ValueError(f"unsupported capture status: {status}")
    if stance not in STANCES:
        raise ValueError(f"unsupported evidence stance: {stance}")
    if status == "CAPTURED" and content is None:
        raise ValueError("CAPTURED receipt requires content bytes")
    if status != "CAPTURED" and content is not None:
        raise ValueError("non-CAPTURED receipt must not carry content bytes")

    content_sha256 = digest_bytes(content) if content is not None else None
    receipt = {
        "experiment": "NBG-T8",
        "version": VERSION,
        "capture_id": capture_id,
        "adapter": {
            "adapter_id": adapter["adapter_id"],
            "provider": adapter["provider"],
            "adapter_version": adapter["adapter_version"],
            "independence_group": adapter["independence_group"],
            "provenance": adapter["provenance"],
        },
        "locator": locator,
        "final_locator": final_locator or locator,
        "retrieved_at": int(retrieved_at),
        "retrieved_timestamp": retrieved_timestamp,
        "retrieval_status": status,
        "evidence_stance": stance,
        "content_sha256": content_sha256,
        "content_length": len(content) if content is not None else 0,
        "http_status": http_status,
        "content_type": content_type,
        "network_used": True,
        "note": note,
    }
    receipt["receipt_hash"] = digest_obj(receipt)
    return receipt


def capture_with_transport(adapter, *, capture_id, locator, retrieved_at, retrieved_timestamp, stance, transport):
    validate_locator(locator, adapter["allow_hosts"])
    try:
        response = transport(locator, adapter)
    except PermissionError as exc:
        return _receipt(
            adapter,
            capture_id=capture_id,
            locator=locator,
            retrieved_at=retrieved_at,
            retrieved_timestamp=retrieved_timestamp,
            status="FAILED",
            stance=stance,
            note=f"AUTH_FAILURE:{exc}",
        ), None
    except OSError as exc:
        return _receipt(
            adapter,
            capture_id=capture_id,
            locator=locator,
            retrieved_at=retrieved_at,
            retrieved_timestamp=retrieved_timestamp,
            status="FAILED",
            stance=stance,
            note=f"NETWORK_FAILURE:{exc}",
        ), None

    content = response.get("content", b"")
    if isinstance(content, str):
        content = content.encode("utf-8")
    if len(content) > adapter["max_bytes"]:
        return _receipt(
            adapter,
            capture_id=capture_id,
            locator=locator,
            retrieved_at=retrieved_at,
            retrieved_timestamp=retrieved_timestamp,
            status="FAILED",
            stance=stance,
            note="MAX_BYTES_EXCEEDED",
            http_status=response.get("status"),
            content_type=response.get("content_type"),
            final_locator=response.get("final_locator"),
        ), None
    if not content:
        return _receipt(
            adapter,
            capture_id=capture_id,
            locator=locator,
            retrieved_at=retrieved_at,
            retrieved_timestamp=retrieved_timestamp,
            status="AMBIGUOUS",
            stance="UNKNOWN",
            note="EMPTY_BODY",
            http_status=response.get("status"),
            content_type=response.get("content_type"),
            final_locator=response.get("final_locator"),
        ), None

    final_locator = response.get("final_locator") or locator
    validate_locator(final_locator, adapter["allow_hosts"])
    return _receipt(
        adapter,
        capture_id=capture_id,
        locator=locator,
        retrieved_at=retrieved_at,
        retrieved_timestamp=retrieved_timestamp,
        status="CAPTURED",
        stance=stance,
        content=content,
        note=response.get("note", ""),
        http_status=response.get("status", 200),
        content_type=response.get("content_type"),
        final_locator=final_locator,
    ), content


def live_http_transport(locator, adapter):
    req = Request(locator, headers={"User-Agent": "NBG-T8-ReadOnly/0.1"})
    try:
        with urlopen(req, timeout=adapter["timeout_seconds"]) as response:
            final_locator = response.geturl()
            validate_locator(final_locator, adapter["allow_hosts"])
            content = response.read(adapter["max_bytes"] + 1)
            return {
                "status": getattr(response, "status", 200),
                "content": content,
                "content_type": response.headers.get("Content-Type"),
                "final_locator": final_locator,
            }
    except HTTPError as exc:
        if exc.code in {401, 403}:
            raise PermissionError(str(exc)) from exc
        raise OSError(str(exc)) from exc
    except URLError as exc:
        raise OSError(str(exc)) from exc


def persist_capture(receipt, content, store_dir):
    store = Path(store_dir)
    store.mkdir(parents=True, exist_ok=True)
    replay_capture(receipt)

    receipt_path = store / f"{receipt['capture_id']}.receipt.json"
    receipt_path.write_text(json.dumps(receipt, indent=2, sort_keys=True) + "\n")

    content_path = None
    if receipt["retrieval_status"] == "CAPTURED":
        if content is None or digest_bytes(content) != receipt["content_sha256"]:
            raise ValueError("content bytes do not match capture receipt")
        content_path = store / f"{receipt['content_sha256']}.bin"
        content_path.write_bytes(content)

    return {"receipt_path": str(receipt_path), "content_path": str(content_path) if content_path else None}


def replay_capture(receipt):
    frozen = deepcopy(receipt)
    expected = frozen.pop("receipt_hash")
    if digest_obj(frozen) != expected:
        raise ValueError("capture receipt hash mismatch")
    return deepcopy(receipt)


def make_review_decision(*, decision_id, capture_id, target_claim_id, known_time, reviewer_id, decision, reason):
    if decision not in DECISIONS:
        raise ValueError(f"unsupported review decision: {decision}")
    row = {
        "experiment": "NBG-T8",
        "version": VERSION,
        "decision_id": decision_id,
        "capture_id": capture_id,
        "target_claim_id": target_claim_id,
        "known_time": int(known_time),
        "reviewer_id": reviewer_id,
        "decision": decision,
        "reason": reason,
        "provenance": f"review://nbgt8/{decision_id}",
    }
    row["decision_hash"] = digest_obj(row)
    return row


def replay_decision(decision):
    frozen = deepcopy(decision)
    expected = frozen.pop("decision_hash")
    if digest_obj(frozen) != expected:
        raise ValueError("review decision hash mismatch")
    return deepcopy(decision)


def review_queue(captures, decisions, *, knowledge_cutoff):
    decision_by_capture = {}
    for decision in sorted(decisions, key=lambda d: (d["known_time"], d["decision_id"])):
        replay_decision(decision)
        if decision["known_time"] <= knowledge_cutoff:
            decision_by_capture[decision["capture_id"]] = decision

    queue = []
    for capture in sorted(captures, key=lambda c: (c["retrieved_at"], c["capture_id"])):
        replay_capture(capture)
        if capture["retrieved_at"] > knowledge_cutoff:
            continue
        decision = decision_by_capture.get(capture["capture_id"])
        if capture["retrieval_status"] != "CAPTURED":
            state = "BLOCKED"
        elif decision is None:
            state = "PENDING"
        else:
            state = decision["decision"]
        queue.append({
            "capture_id": capture["capture_id"],
            "retrieval_status": capture["retrieval_status"],
            "stance": capture["evidence_stance"],
            "independence_group": capture["adapter"]["independence_group"],
            "locator": capture["locator"],
            "content_sha256": capture["content_sha256"],
            "queue_state": state,
            "decision_id": decision["decision_id"] if decision else None,
        })
    return queue


def accepted_capture_ids(captures, decisions, *, knowledge_cutoff):
    queue = review_queue(captures, decisions, knowledge_cutoff=knowledge_cutoff)
    return sorted(row["capture_id"] for row in queue if row["queue_state"] == "ACCEPT")


def derive_review_status(base_claim, captures, decisions, *, knowledge_cutoff):
    by_id = {c["capture_id"]: c for c in captures}
    accepted = [by_id[cid] for cid in accepted_capture_ids(captures, decisions, knowledge_cutoff=knowledge_cutoff)]
    support = sorted({c["adapter"]["independence_group"] for c in accepted if c["evidence_stance"] == "SUPPORT"})
    oppose = sorted({c["adapter"]["independence_group"] for c in accepted if c["evidence_stance"] == "OPPOSE"})

    if support and oppose:
        review_status = "DISPUTED"
    elif support:
        review_status = "CORROBORATED"
    elif oppose:
        review_status = "DISPUTED"
    else:
        review_status = base_claim["source_status"]

    return {
        "claim_id": base_claim["claim_id"],
        "source_status": base_claim["source_status"],
        "review_status": review_status,
        "accepted_capture_ids": [c["capture_id"] for c in accepted],
        "independent_support_groups": support,
        "independent_oppose_groups": oppose,
    }


def detect_version_drift(captures):
    groups = {}
    for capture in captures:
        replay_capture(capture)
        if capture["retrieval_status"] != "CAPTURED":
            continue
        key = (capture["adapter"]["adapter_id"], capture["locator"])
        groups.setdefault(key, []).append(capture)

    drift = []
    for (adapter_id, locator), rows in sorted(groups.items()):
        rows = sorted(rows, key=lambda c: (c["retrieved_at"], c["capture_id"]))
        for left, right in zip(rows, rows[1:]):
            if left["content_sha256"] != right["content_sha256"]:
                drift.append({
                    "adapter_id": adapter_id,
                    "locator": locator,
                    "from_capture_id": left["capture_id"],
                    "to_capture_id": right["capture_id"],
                    "from_sha256": left["content_sha256"],
                    "to_sha256": right["content_sha256"],
                    "status": "DRIFT_DETECTED",
                })
    return drift


def evidence_bundle(base_claim, captures, decisions, *, knowledge_cutoff):
    visible_captures = [deepcopy(c) for c in captures if c["retrieved_at"] <= knowledge_cutoff]
    visible_decisions = [deepcopy(d) for d in decisions if d["known_time"] <= knowledge_cutoff]
    bundle = {
        "experiment": "NBG-T8",
        "version": VERSION,
        "knowledge_cutoff": knowledge_cutoff,
        "base_claim": deepcopy(base_claim),
        "captures": sorted(visible_captures, key=lambda c: (c["retrieved_at"], c["capture_id"])),
        "review_decisions": sorted(visible_decisions, key=lambda d: (d["known_time"], d["decision_id"])),
        "review_queue": review_queue(captures, decisions, knowledge_cutoff=knowledge_cutoff),
        "drift": detect_version_drift(visible_captures),
        "derived": derive_review_status(base_claim, captures, decisions, knowledge_cutoff=knowledge_cutoff),
    }
    bundle["bundle_hash"] = digest_obj(bundle)
    return bundle


def offline_replay(bundle):
    frozen = deepcopy(bundle)
    expected = frozen.pop("bundle_hash")
    if digest_obj(frozen) != expected:
        raise ValueError("bundle hash mismatch")
    for capture in bundle["captures"]:
        replay_capture(capture)
    for decision in bundle["review_decisions"]:
        replay_decision(decision)
    return deepcopy(bundle["derived"])


def frozen_fixture():
    base_claim = {
        "claim_id": "C1",
        "subject": "NODE_A",
        "relation": "ALLEGED_LINK",
        "object": "NODE_B",
        "source_status": "ALLEGED",
        "provenance": {"layer": "SOURCE_MAP", "locator": "qweb:p1:fixture-arrow-1"},
    }
    archive = make_adapter("SYNTH_ARCHIVE", "SYNTH_ARCHIVE_PROVIDER", "1.0", "EXT_G1", {"archive.example"})
    register = make_adapter("SYNTH_REGISTER", "SYNTH_REGISTER_PROVIDER", "1.0", "EXT_G2", {"register.example"})

    responses = {
        "https://archive.example/document-1?v=1": {"content": b"Synthetic archive document version one.", "status": 200, "content_type": "text/plain"},
        "https://archive.example/document-1?v=2": {"content": b"Synthetic archive document version two, revised.", "status": 200, "content_type": "text/plain"},
        "https://register.example/document-9": {"content": b"Synthetic independent opposition document.", "status": 200, "content_type": "text/plain"},
        "https://register.example/empty": {"content": b"", "status": 200, "content_type": "text/plain"},
    }

    def transport(locator, adapter):
        if locator == "https://archive.example/missing":
            raise OSError("synthetic retrieval failure")
        return deepcopy(responses[locator])

    captures = []
    content_store = {}
    rows = [
        (archive, "CAP_SUPPORT_V1", "https://archive.example/document-1?v=1", 5, "2026-10-04T12:05:00Z", "SUPPORT"),
        (archive, "CAP_SUPPORT_V2", "https://archive.example/document-1?v=2", 7, "2026-10-04T12:07:00Z", "SUPPORT"),
        (register, "CAP_OPPOSE", "https://register.example/document-9", 8, "2026-10-04T12:08:00Z", "OPPOSE"),
        (register, "CAP_AMBIGUOUS", "https://register.example/empty", 5, "2026-10-04T12:05:30Z", "UNKNOWN"),
        (archive, "CAP_FAILED", "https://archive.example/missing", 5, "2026-10-04T12:05:45Z", "UNKNOWN"),
    ]
    for adapter, capture_id, locator, epoch, stamp, stance in rows:
        receipt, content = capture_with_transport(
            adapter,
            capture_id=capture_id,
            locator=locator,
            retrieved_at=epoch,
            retrieved_timestamp=stamp,
            stance=stance,
            transport=transport,
        )
        captures.append(receipt)
        if content is not None:
            content_store[capture_id] = content

    # Drift is defined by the same stable locator. Normalize the two archive versions
    # to the same logical document locator after capture, then re-hash receipts.
    for capture in captures:
        if capture["capture_id"] in {"CAP_SUPPORT_V1", "CAP_SUPPORT_V2"}:
            capture["locator"] = "https://archive.example/document-1"
            capture["final_locator"] = "https://archive.example/document-1"
            capture["receipt_hash"] = digest_obj({k: v for k, v in capture.items() if k != "receipt_hash"})

    decisions = [
        make_review_decision(
            decision_id="DEC_SUPPORT",
            capture_id="CAP_SUPPORT_V1",
            target_claim_id="C1",
            known_time=6,
            reviewer_id="REVIEWER_1",
            decision="ACCEPT",
            reason="synthetic support accepted after capture persistence",
        ),
        make_review_decision(
            decision_id="DEC_DRIFT_REJECT",
            capture_id="CAP_SUPPORT_V2",
            target_claim_id="C1",
            known_time=8,
            reviewer_id="REVIEWER_1",
            decision="REJECT",
            reason="new source version requires separate review and is rejected in witness",
        ),
        make_review_decision(
            decision_id="DEC_OPPOSE",
            capture_id="CAP_OPPOSE",
            target_claim_id="C1",
            known_time=9,
            reviewer_id="REVIEWER_1",
            decision="ACCEPT",
            reason="synthetic independent opposition accepted",
        ),
    ]
    return base_claim, captures, decisions, content_store


def run_suite():
    base_claim, captures, decisions, content_store = frozen_fixture()
    bundles = {k: evidence_bundle(base_claim, captures, decisions, knowledge_cutoff=k) for k in range(4, 10)}
    drift = detect_version_drift(captures)
    queue5 = review_queue(captures, decisions, knowledge_cutoff=5)
    queue7 = review_queue(captures, decisions, knowledge_cutoff=7)
    queue8 = review_queue(captures, decisions, knowledge_cutoff=8)

    checks = [
        {"name": "capture:exact_locator", "pass": next(c for c in captures if c["capture_id"]=="CAP_OPPOSE")["locator"]=="https://register.example/document-9"},
        {"name": "capture:timestamp", "pass": next(c for c in captures if c["capture_id"]=="CAP_SUPPORT_V1")["retrieved_timestamp"]=="2026-10-04T12:05:00Z"},
        {"name": "capture:sha256", "pass": next(c for c in captures if c["capture_id"]=="CAP_SUPPORT_V1")["content_sha256"]==digest_bytes(content_store["CAP_SUPPORT_V1"])},
        {"name": "capture:independence_group", "pass": next(c for c in captures if c["capture_id"]=="CAP_SUPPORT_V1")["adapter"]["independence_group"]=="EXT_G1"},
        {"name": "capture:failure_preserved", "pass": next(c for c in captures if c["capture_id"]=="CAP_FAILED")["retrieval_status"]=="FAILED"},
        {"name": "capture:ambiguity_preserved", "pass": next(c for c in captures if c["capture_id"]=="CAP_AMBIGUOUS")["retrieval_status"]=="AMBIGUOUS"},
        {"name": "queue:retrieval_not_acceptance", "pass": bundles[5]["derived"]["review_status"]=="ALLEGED" and any(q["capture_id"]=="CAP_SUPPORT_V1" and q["queue_state"]=="PENDING" for q in queue5)},
        {"name": "review:acceptance_changes_derived", "pass": bundles[6]["derived"]["review_status"]=="CORROBORATED"},
        {"name": "source:status_immutable", "pass": all(bundles[k]["derived"]["source_status"]=="ALLEGED" for k in bundles)},
        {"name": "drift:detected", "pass": len(drift)==1 and drift[0]["status"]=="DRIFT_DETECTED"},
        {"name": "drift:not_silent_substitution", "pass": bundles[7]["derived"]["accepted_capture_ids"]==["CAP_SUPPORT_V1"]},
        {"name": "review:reject_visible", "pass": any(q["capture_id"]=="CAP_SUPPORT_V2" and q["queue_state"]=="REJECT" for q in queue8)},
        {"name": "contradiction:retrieval_alone_not_applied", "pass": bundles[8]["derived"]["review_status"]=="CORROBORATED"},
        {"name": "contradiction:accepted_opposition_disputed", "pass": bundles[9]["derived"]["review_status"]=="DISPUTED" and bundles[9]["derived"]["independent_oppose_groups"]==["EXT_G2"]},
        {"name": "offline:replay_exact", "pass": offline_replay(bundles[9])==bundles[9]["derived"]},
        {"name": "no_hindsight:k4_unchanged", "pass": bundles[4]["derived"]["review_status"]=="ALLEGED" and bundles[4]["captures"]==[]},
        {"name": "order:canonical", "pass": canonical(evidence_bundle(base_claim,list(reversed(captures)),list(reversed(decisions)),knowledge_cutoff=9))==canonical(bundles[9])},
        {"name": "replay:exact", "pass": canonical(bundles[9])==canonical(evidence_bundle(base_claim,captures,decisions,knowledge_cutoff=9))},
    ]

    payload = {
        "experiment": "NBG-T8",
        "version": VERSION,
        "witness": {
            "k4_status": bundles[4]["derived"]["review_status"],
            "k5_status": bundles[5]["derived"]["review_status"],
            "k6_status": bundles[6]["derived"]["review_status"],
            "k7_status": bundles[7]["derived"]["review_status"],
            "k8_status": bundles[8]["derived"]["review_status"],
            "k9_status": bundles[9]["derived"]["review_status"],
            "drift_count": len(drift),
            "queue5": queue5,
            "queue7": queue7,
            "queue8": queue8,
        },
        "receipts": bundles,
        "checks": checks,
        "checks_passed": sum(bool(c["pass"]) for c in checks),
        "checks_total": len(checks),
    }
    payload["verdict"] = "PASS_NBGT8" if payload["checks_passed"] == payload["checks_total"] else "FAIL_NBGT8"
    payload["result_hash"] = digest_obj(payload)
    return payload


def main():
    payload = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    base_claim, captures, decisions, _ = frozen_fixture()
    files = {
        "base_claim.json": base_claim,
        "capture_receipts.json": captures,
        "review_decisions.json": decisions,
        "drift_report.json": detect_version_drift(captures),
        "review_queue_k8.json": review_queue(captures, decisions, knowledge_cutoff=8),
    }
    for name, obj in files.items():
        (out / name).write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")
    data = (json.dumps(payload, indent=2, sort_keys=True) + "\n").encode()
    (out / "result.json").write_bytes(data)
    print(json.dumps({
        "verdict": payload["verdict"],
        "checks": f"{payload['checks_passed']}/{payload['checks_total']}",
        "k5": payload["witness"]["k5_status"],
        "k6": payload["witness"]["k6_status"],
        "k9": payload["witness"]["k9_status"],
        "drift_count": payload["witness"]["drift_count"],
        "result_sha256": hashlib.sha256(data).hexdigest(),
    }, indent=2))
    if payload["verdict"] != "PASS_NBGT8":
        raise SystemExit(1)


if __name__ == "__main__":
    main()
