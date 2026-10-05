#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]
GENESIS = "GENESIS"


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def sha256_bytes(data):
    return hashlib.sha256(data).hexdigest()


def sha256_obj(obj):
    return sha256_bytes(canonical(obj))


def make_source_registry(sources):
    by_id = {}
    for source in sources:
        required = {"source_id", "label", "independence_group", "locator", "source_kind"}
        missing = required - set(source)
        if missing:
            raise ValueError(f"source missing fields: {sorted(missing)}")
        sid = source["source_id"]
        if sid in by_id:
            raise ValueError(f"duplicate source_id: {sid}")
        if not source["independence_group"]:
            raise ValueError("independence_group must be explicit")
        by_id[sid] = deepcopy(source)
    registry = {
        "experiment": "NBG-T9",
        "version": VERSION,
        "sources": sorted(by_id.values(), key=lambda s: s["source_id"]),
    }
    registry["registry_sha256"] = sha256_obj(registry)
    return registry


def validate_source_registry(registry):
    frozen = deepcopy(registry)
    expected = frozen.pop("registry_sha256")
    if sha256_obj(frozen) != expected:
        raise ValueError("source registry hash mismatch")
    make_source_registry(frozen["sources"])
    return True


def make_capture(*, capture_id, source_id, target_claim_id, retrieved_at, stance, content):
    if isinstance(content, str):
        content = content.encode("utf-8")
    row = {
        "capture_id": capture_id,
        "source_id": source_id,
        "target_claim_id": target_claim_id,
        "retrieved_at": int(retrieved_at),
        "stance": stance,
        "content_sha256": sha256_bytes(content),
        "content_length": len(content),
    }
    row["capture_hash"] = sha256_obj(row)
    return row, content


def validate_capture(capture, objects):
    frozen = deepcopy(capture)
    expected = frozen.pop("capture_hash")
    if sha256_obj(frozen) != expected:
        raise ValueError("capture hash mismatch")
    content = objects.get(capture["content_sha256"])
    if content is None:
        raise ValueError("content-addressed object missing")
    if sha256_bytes(content) != capture["content_sha256"]:
        raise ValueError("content object digest mismatch")
    if len(content) != capture["content_length"]:
        raise ValueError("content length mismatch")
    return True


def make_decision(*, decision_id, reviewer_id, capture_id, target_claim_id, known_time, decision, reason, prev_decision_hash=GENESIS):
    if decision not in {"ACCEPT", "REJECT"}:
        raise ValueError(f"unsupported decision: {decision}")
    row = {
        "decision_id": decision_id,
        "reviewer_id": reviewer_id,
        "capture_id": capture_id,
        "target_claim_id": target_claim_id,
        "known_time": int(known_time),
        "decision": decision,
        "reason": reason,
        "prev_decision_hash": prev_decision_hash,
    }
    row["decision_hash"] = sha256_obj(row)
    return row


def rebuild_decision_chain(decisions):
    rows = []
    prev = GENESIS
    for item in sorted(decisions, key=lambda d: (d["known_time"], d["decision_id"])):
        row = make_decision(
            decision_id=item["decision_id"],
            reviewer_id=item["reviewer_id"],
            capture_id=item["capture_id"],
            target_claim_id=item["target_claim_id"],
            known_time=item["known_time"],
            decision=item["decision"],
            reason=item["reason"],
            prev_decision_hash=prev,
        )
        rows.append(row)
        prev = row["decision_hash"]
    return rows


def validate_decision_chain(decisions):
    rows = sorted(decisions, key=lambda d: (d["known_time"], d["decision_id"]))
    prev = GENESIS
    for row in rows:
        frozen = deepcopy(row)
        expected = frozen.pop("decision_hash")
        if sha256_obj(frozen) != expected:
            raise ValueError("decision hash mismatch")
        if row["prev_decision_hash"] != prev:
            raise ValueError("decision chain break")
        prev = row["decision_hash"]
    return prev


def build_bundle(*, bundle_id, created_at, registry, captures, decisions, objects, parent_manifest_hash=GENESIS):
    validate_source_registry(registry)
    source_ids = {s["source_id"] for s in registry["sources"]}
    capture_ids = set()
    object_manifest = []
    for capture in sorted(captures, key=lambda c: c["capture_id"]):
        if capture["source_id"] not in source_ids:
            raise ValueError("capture references unknown source")
        if capture["capture_id"] in capture_ids:
            raise ValueError("duplicate capture_id")
        capture_ids.add(capture["capture_id"])
        validate_capture(capture, objects)
        object_manifest.append({
            "sha256": capture["content_sha256"],
            "length": capture["content_length"],
        })

    validate_decision_chain(decisions)
    for decision in decisions:
        if decision["capture_id"] not in capture_ids:
            raise ValueError("decision references unknown capture")

    payload = {
        "registry": deepcopy(registry),
        "captures": sorted(deepcopy(captures), key=lambda c: c["capture_id"]),
        "decisions": sorted(deepcopy(decisions), key=lambda d: (d["known_time"], d["decision_id"])),
        "objects": sorted(
            {row["sha256"]: row for row in object_manifest}.values(),
            key=lambda row: row["sha256"],
        ),
    }
    manifest = {
        "experiment": "NBG-T9",
        "version": VERSION,
        "bundle_id": bundle_id,
        "created_at": created_at,
        "parent_manifest_hash": parent_manifest_hash,
        "payload_sha256": sha256_obj(payload),
        "registry_sha256": registry["registry_sha256"],
        "decision_head": validate_decision_chain(decisions),
        "object_count": len(payload["objects"]),
    }
    manifest["manifest_hash"] = sha256_obj(manifest)
    return {
        "manifest": manifest,
        "payload": payload,
        "object_bytes": {k: bytes(v) for k, v in objects.items()},
    }


def validate_bundle(bundle):
    manifest = deepcopy(bundle["manifest"])
    expected_manifest_hash = manifest.pop("manifest_hash")
    if sha256_obj(manifest) != expected_manifest_hash:
        raise ValueError("manifest hash mismatch")
    payload = bundle["payload"]
    if sha256_obj(payload) != bundle["manifest"]["payload_sha256"]:
        raise ValueError("payload hash mismatch")
    if payload["registry"]["registry_sha256"] != bundle["manifest"]["registry_sha256"]:
        raise ValueError("registry digest mismatch")
    validate_source_registry(payload["registry"])
    objects = bundle["object_bytes"]
    for obj in payload["objects"]:
        content = objects.get(obj["sha256"])
        if content is None:
            raise ValueError("bundle object missing")
        if len(content) != obj["length"] or sha256_bytes(content) != obj["sha256"]:
            raise ValueError("bundle object mismatch")
    for capture in payload["captures"]:
        validate_capture(capture, objects)
    if validate_decision_chain(payload["decisions"]) != bundle["manifest"]["decision_head"]:
        raise ValueError("decision head mismatch")
    return True


def source_index(registry):
    validate_source_registry(registry)
    return {s["source_id"]: deepcopy(s) for s in registry["sources"]}


def duplicate_clusters(captures):
    by_hash = {}
    for capture in captures:
        by_hash.setdefault(capture["content_sha256"], []).append(capture)
    return [
        {
            "content_sha256": digest,
            "capture_ids": sorted(r["capture_id"] for r in rows),
            "source_ids": sorted({r["source_id"] for r in rows}),
            "duplicate": True,
        }
        for digest, rows in sorted(by_hash.items())
        if len(rows) > 1
    ]


def mirror_clusters(registry, captures):
    sources = source_index(registry)
    rows = []
    for cluster in duplicate_clusters(captures):
        groups = sorted({sources[sid]["independence_group"] for sid in cluster["source_ids"]})
        rows.append({
            **cluster,
            "independence_groups": groups,
            "independent_count": len(groups),
            "counts_as_multiple_independent_sources": len(groups) > 1,
        })
    return rows


def drift_history(captures):
    by_source = {}
    for capture in captures:
        by_source.setdefault(capture["source_id"], []).append(capture)
    out = []
    for source_id, rows in sorted(by_source.items()):
        rows = sorted(rows, key=lambda c: (c["retrieved_at"], c["capture_id"]))
        for left, right in zip(rows, rows[1:]):
            if left["content_sha256"] != right["content_sha256"]:
                out.append({
                    "source_id": source_id,
                    "from_capture_id": left["capture_id"],
                    "to_capture_id": right["capture_id"],
                    "from_sha256": left["content_sha256"],
                    "to_sha256": right["content_sha256"],
                    "status": "DRIFT_DETECTED",
                })
    return out


def merged_review_state(capture_id, decisions):
    votes = {d["decision"] for d in decisions if d["capture_id"] == capture_id}
    if votes == {"ACCEPT"}:
        return "ACCEPTED"
    if votes == {"REJECT"}:
        return "REJECTED"
    if votes == {"ACCEPT", "REJECT"}:
        return "REVIEW_CONFLICT"
    return "UNREVIEWED"


def derive_claim_state(base_claim, registry, captures, decisions):
    sources = source_index(registry)
    support_groups, oppose_groups, review_states = set(), set(), {}
    for capture in captures:
        state = merged_review_state(capture["capture_id"], decisions)
        review_states[capture["capture_id"]] = state
        if state != "ACCEPTED":
            continue
        group = sources[capture["source_id"]]["independence_group"]
        if capture["stance"] == "SUPPORT":
            support_groups.add(group)
        elif capture["stance"] == "OPPOSE":
            oppose_groups.add(group)
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
        "support_groups": sorted(support_groups),
        "oppose_groups": sorted(oppose_groups),
        "capture_review_states": dict(sorted(review_states.items())),
    }


def merge_registries(registries):
    by_id = {}
    for registry in registries:
        validate_source_registry(registry)
        for source in registry["sources"]:
            sid = source["source_id"]
            if sid in by_id and canonical(by_id[sid]) != canonical(source):
                raise ValueError(f"source registry conflict for {sid}")
            by_id[sid] = deepcopy(source)
    return make_source_registry(list(by_id.values()))


def merge_bundles(bundles, *, merged_bundle_id, created_at):
    for bundle in bundles:
        validate_bundle(bundle)
    registry = merge_registries([b["payload"]["registry"] for b in bundles])
    captures_by_id, decisions_by_hash, objects = {}, {}, {}
    for bundle in bundles:
        for capture in bundle["payload"]["captures"]:
            cid = capture["capture_id"]
            if cid in captures_by_id and canonical(captures_by_id[cid]) != canonical(capture):
                raise ValueError(f"capture conflict for {cid}")
            captures_by_id[cid] = deepcopy(capture)
        for decision in bundle["payload"]["decisions"]:
            decisions_by_hash[decision["decision_hash"]] = deepcopy(decision)
        for digest, content in bundle["object_bytes"].items():
            if digest in objects and objects[digest] != content:
                raise ValueError("content-addressed object collision")
            objects[digest] = bytes(content)

    material = []
    for d in decisions_by_hash.values():
        material.append({k: v for k, v in d.items() if k not in {"decision_hash", "prev_decision_hash"}})
    decisions = rebuild_decision_chain(material)
    return build_bundle(
        bundle_id=merged_bundle_id,
        created_at=created_at,
        registry=registry,
        captures=list(captures_by_id.values()),
        decisions=decisions,
        objects=objects,
    )


def import_bundle(bundle, content_store):
    validate_bundle(bundle)
    added = reused = 0
    for digest, content in sorted(bundle["object_bytes"].items()):
        if digest in content_store:
            if content_store[digest] != content:
                raise ValueError("content-addressed object collision")
            reused += 1
        else:
            content_store[digest] = bytes(content)
            added += 1
    return {
        "bundle_id": bundle["manifest"]["bundle_id"],
        "manifest_hash": bundle["manifest"]["manifest_hash"],
        "objects_added": added,
        "objects_reused": reused,
        "trust_state": "REVIEW_REQUIRED",
    }


def portable_export(bundle):
    validate_bundle(bundle)
    return {
        "manifest": deepcopy(bundle["manifest"]),
        "payload": deepcopy(bundle["payload"]),
        "objects_hex": {k: v.hex() for k, v in sorted(bundle["object_bytes"].items())},
    }


def portable_import(exported):
    bundle = {
        "manifest": deepcopy(exported["manifest"]),
        "payload": deepcopy(exported["payload"]),
        "object_bytes": {k: bytes.fromhex(v) for k, v in exported["objects_hex"].items()},
    }
    validate_bundle(bundle)
    return bundle


def frozen_fixture():
    base_claim = {
        "claim_id": "C1",
        "subject": "NODE_A",
        "relation": "ALLEGED_LINK",
        "object": "NODE_B",
        "source_status": "ALLEGED",
    }
    registry = make_source_registry([
        {"source_id":"SRC_ARCHIVE","label":"Synthetic Archive","independence_group":"EXT_G1","locator":"synthetic://archive/document-1","source_kind":"PRIMARY_ARCHIVE"},
        {"source_id":"SRC_MIRROR","label":"Synthetic Mirror","independence_group":"EXT_G1","locator":"synthetic://mirror/document-1","source_kind":"MIRROR","mirror_of":"SRC_ARCHIVE"},
        {"source_id":"SRC_REGISTER","label":"Synthetic Register","independence_group":"EXT_G2","locator":"synthetic://register/document-9","source_kind":"INDEPENDENT_REGISTER"},
    ])
    objects = {}
    capture_specs = [
        ("CAP_A_V1","SRC_ARCHIVE",5,"SUPPORT",b"Synthetic archive document version one."),
        ("CAP_MIRROR_V1","SRC_MIRROR",6,"SUPPORT",b"Synthetic archive document version one."),
        ("CAP_A_V2","SRC_ARCHIVE",7,"SUPPORT",b"Synthetic archive document version two, revised."),
        ("CAP_OPPOSE","SRC_REGISTER",8,"OPPOSE",b"Synthetic independent opposition document."),
    ]
    captures = []
    for capture_id, source_id, epoch, stance, content in capture_specs:
        capture, raw = make_capture(
            capture_id=capture_id,
            source_id=source_id,
            target_claim_id="C1",
            retrieved_at=epoch,
            stance=stance,
            content=content,
        )
        captures.append(capture)
        objects[capture["content_sha256"]] = raw

    alice = rebuild_decision_chain([
        {"decision_id":"ALICE_ACCEPT_A1","reviewer_id":"ALICE","capture_id":"CAP_A_V1","target_claim_id":"C1","known_time":6,"decision":"ACCEPT","reason":"synthetic support acceptance"},
        {"decision_id":"ALICE_REJECT_A2","reviewer_id":"ALICE","capture_id":"CAP_A_V2","target_claim_id":"C1","known_time":8,"decision":"REJECT","reason":"drifted version requires separate support"},
    ])
    bob = rebuild_decision_chain([
        {"decision_id":"BOB_ACCEPT_OPPOSE","reviewer_id":"BOB","capture_id":"CAP_OPPOSE","target_claim_id":"C1","known_time":9,"decision":"ACCEPT","reason":"synthetic independent opposition acceptance"},
    ])
    carol = rebuild_decision_chain([
        {"decision_id":"CAROL_REJECT_OPPOSE","reviewer_id":"CAROL","capture_id":"CAP_OPPOSE","target_claim_id":"C1","known_time":9,"decision":"REJECT","reason":"synthetic reviewer disagreement"},
    ])

    a = build_bundle(bundle_id="BUNDLE_ALICE",created_at="2026-10-04T18:20:00Z",registry=registry,captures=captures,decisions=alice,objects=objects)
    b = build_bundle(bundle_id="BUNDLE_BOB",created_at="2026-10-04T18:21:00Z",registry=registry,captures=captures,decisions=bob,objects=objects,parent_manifest_hash=a["manifest"]["manifest_hash"])
    c = build_bundle(bundle_id="BUNDLE_CAROL",created_at="2026-10-04T18:22:00Z",registry=registry,captures=captures,decisions=carol,objects=objects,parent_manifest_hash=b["manifest"]["manifest_hash"])
    return base_claim, registry, captures, objects, a, b, c


def run_suite():
    base_claim, registry, captures, objects, a, b, c = frozen_fixture()
    merged = merge_bundles([a,b,c], merged_bundle_id="MERGED_REVIEW", created_at="2026-10-04T18:25:00Z")
    decisions = merged["payload"]["decisions"]
    state = derive_claim_state(base_claim, registry, captures, decisions)
    duplicates = mirror_clusters(registry, captures)
    drift = drift_history(captures)
    store = {}
    import_a = import_bundle(a, store)
    import_b = import_bundle(b, store)
    roundtrip = portable_import(portable_export(merged))
    checks = [
        {"name":"registry:stable_ids_unique","pass":len(registry["sources"])==3 and len({s["source_id"] for s in registry["sources"]})==3},
        {"name":"registry:independence_explicit","pass":all(s["independence_group"] for s in registry["sources"])},
        {"name":"manifest:bundle_a_valid","pass":validate_bundle(a)},
        {"name":"manifest:chain_links_export_history","pass":b["manifest"]["parent_manifest_hash"]==a["manifest"]["manifest_hash"] and c["manifest"]["parent_manifest_hash"]==b["manifest"]["manifest_hash"]},
        {"name":"import:well_formed_not_trusted","pass":import_a["trust_state"]=="REVIEW_REQUIRED"},
        {"name":"cas:first_import_adds_objects","pass":import_a["objects_added"]==3 and import_a["objects_reused"]==0},
        {"name":"cas:second_import_reuses_objects","pass":import_b["objects_added"]==0 and import_b["objects_reused"]==3},
        {"name":"duplicate:mirror_detected","pass":len(duplicates)==1 and set(duplicates[0]["capture_ids"])=={"CAP_A_V1","CAP_MIRROR_V1"}},
        {"name":"duplicate:mirror_not_independent","pass":duplicates[0]["independent_count"]==1 and not duplicates[0]["counts_as_multiple_independent_sources"]},
        {"name":"drift:stable_source_history","pass":len(drift)==1 and drift[0]["source_id"]=="SRC_ARCHIVE"},
        {"name":"review:attribution_preserved","pass":{d["reviewer_id"] for d in decisions}=={"ALICE","BOB","CAROL"}},
        {"name":"review:conflict_preserved","pass":merged_review_state("CAP_OPPOSE", decisions)=="REVIEW_CONFLICT"},
        {"name":"review:no_last_write_wins","pass":state["review_status"]=="CORROBORATED" and state["capture_review_states"]["CAP_OPPOSE"]=="REVIEW_CONFLICT"},
        {"name":"source:status_immutable","pass":state["source_status"]=="ALLEGED"},
        {"name":"merge:all_unique_decisions_preserved","pass":len(decisions)==4},
        {"name":"merge:canonical_chain_valid","pass":validate_decision_chain(decisions)==merged["manifest"]["decision_head"]},
        {"name":"roundtrip:manifest_exact","pass":canonical(roundtrip["manifest"])==canonical(merged["manifest"])},
        {"name":"roundtrip:payload_exact","pass":canonical(roundtrip["payload"])==canonical(merged["payload"])},
        {"name":"roundtrip:object_bytes_exact","pass":roundtrip["object_bytes"]==merged["object_bytes"]},
        {"name":"offline:replay_deterministic","pass":derive_claim_state(base_claim,roundtrip["payload"]["registry"],roundtrip["payload"]["captures"],roundtrip["payload"]["decisions"])==state},
        {"name":"order:merge_canonical","pass":canonical(merge_bundles([c,a,b],merged_bundle_id="MERGED_REVIEW",created_at="2026-10-04T18:25:00Z")["payload"])==canonical(merged["payload"])},
        {"name":"replay:exact","pass":canonical(portable_export(merged))==canonical(portable_export(merge_bundles([a,b,c],merged_bundle_id="MERGED_REVIEW",created_at="2026-10-04T18:25:00Z")))},
    ]
    payload = {
        "experiment":"NBG-T9",
        "version":VERSION,
        "witness":{
            "source_count":len(registry["sources"]),
            "duplicate_cluster_count":len(duplicates),
            "drift_count":len(drift),
            "merged_decision_count":len(decisions),
            "oppose_review_state":merged_review_state("CAP_OPPOSE", decisions),
            "claim_source_status":state["source_status"],
            "claim_review_status":state["review_status"],
            "first_import_added":import_a["objects_added"],
            "second_import_reused":import_b["objects_reused"],
            "import_trust_state":import_a["trust_state"],
        },
        "checks":checks,
        "checks_passed":sum(bool(c["pass"]) for c in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT9" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT9"
    payload["result_hash"]=sha256_obj(payload)
    return payload, {"registry":registry,"duplicates":duplicates,"drift":drift,"merged_bundle":portable_export(merged),"merged_claim_state":state}


def main():
    payload, artifacts = run_suite()
    out = ROOT / "results"
    out.mkdir(parents=True, exist_ok=True)
    for name, obj in {
        "source_registry.json": artifacts["registry"],
        "duplicate_clusters.json": artifacts["duplicates"],
        "drift_history.json": artifacts["drift"],
        "merged_bundle.json": artifacts["merged_bundle"],
        "merged_claim_state.json": artifacts["merged_claim_state"],
    }.items():
        (out / name).write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n")
    data=(json.dumps(payload, indent=2, sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "review_state":payload["witness"]["oppose_review_state"],
        "claim_review_status":payload["witness"]["claim_review_status"],
        "duplicates":payload["witness"]["duplicate_cluster_count"],
        "drift":payload["witness"]["drift_count"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    }, indent=2))
    if payload["verdict"]!="PASS_NBGT9":
        raise SystemExit(1)


if __name__=="__main__":
    main()
