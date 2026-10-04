#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]

ALLOWED_RELATIONS = {
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

ALLOWED_EVIDENCE = {
    "OBSERVED",
    "CORROBORATED",
    "INFERRED",
    "DISPUTED",
    "ALLEGED",
    "REFUTED",
    "UNKNOWN",
}

SOURCE_ORIGINS = {"SOURCE_MAP", "ANALYST_HYPOTHESIS"}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()


def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()


def normalize_label(value):
    if value is None:
        return None
    value = " ".join(str(value).split()).strip()
    return value if value else None


def normalize_relation(record):
    hint = record.get("relation_hint")
    if hint == "CONNECTION_OF_INTEREST":
        return "ALLEGED_LINK"
    if hint == "TIMELINE_SEQUENCE":
        return "OCCURRED_BEFORE"
    if hint == "ADJACENT_ONLY":
        return None
    return hint


def validate_common(record):
    required = {"record_id", "origin_kind", "source_locator", "source_lineage", "subject_label", "relation_hint", "object_label"}
    missing = sorted(required - set(record))
    if missing:
        raise ValueError(f"missing record fields: {missing}")
    if record["origin_kind"] not in SOURCE_ORIGINS:
        raise ValueError(f"unsupported origin_kind: {record['origin_kind']}")
    return True


def ingest(records):
    for record in records:
        validate_common(record)

    accepted = []
    disputed = []
    ambiguous = []
    rejected = []
    no_edge = []
    hypotheses = []

    ordered = sorted((deepcopy(r) for r in records), key=lambda r: r["record_id"])

    for record in ordered:
        rid = record["record_id"]
        subject = normalize_label(record.get("subject_label"))
        obj = normalize_label(record.get("object_label"))
        relation = normalize_relation(record)
        locator = normalize_label(record.get("source_locator"))
        lineage = normalize_label(record.get("source_lineage"))
        evidence = record.get("evidence_status") or ("ALLEGED" if record["origin_kind"] == "SOURCE_MAP" else "UNKNOWN")

        if record["origin_kind"] == "ANALYST_HYPOTHESIS":
            hypotheses.append({
                "record_id": rid,
                "subject": subject or "UNKNOWN",
                "relation": relation or "UNKNOWN",
                "object": obj or "UNKNOWN",
                "status": evidence if evidence in ALLOWED_EVIDENCE else "UNKNOWN",
                "provenance": {
                    "origin_kind": record["origin_kind"],
                    "source_locator": locator,
                    "source_lineage": lineage,
                },
            })
            continue

        if not locator or not lineage:
            rejected.append({"record_id": rid, "reason": "MISSING_PROVENANCE"})
            continue

        if record.get("readability") == "AMBIGUOUS" or not subject or not obj:
            ambiguous.append({
                "record_id": rid,
                "reason": "AMBIGUOUS_LABEL",
                "subject": subject or "UNKNOWN",
                "object": obj or "UNKNOWN",
                "source_locator": locator,
            })
            continue

        if record["relation_hint"] == "ADJACENT_ONLY":
            no_edge.append({
                "record_id": rid,
                "reason": "ADJACENCY_IS_NOT_AN_EDGE",
                "subject": subject,
                "object": obj,
                "source_locator": locator,
            })
            continue

        if relation not in ALLOWED_RELATIONS:
            rejected.append({
                "record_id": rid,
                "reason": "UNSUPPORTED_RELATION",
                "relation_hint": record.get("relation_hint"),
                "source_locator": locator,
            })
            continue

        if evidence not in ALLOWED_EVIDENCE:
            rejected.append({
                "record_id": rid,
                "reason": "UNSUPPORTED_EVIDENCE_STATUS",
                "evidence_status": evidence,
                "source_locator": locator,
            })
            continue

        claim = {
            "record_id": rid,
            "subject": subject,
            "relation": relation,
            "object": obj,
            "evidence_status": evidence,
            "provenance": {
                "origin_kind": "SOURCE_MAP",
                "source_locator": locator,
                "source_lineage": lineage,
            },
        }
        if relation == "OCCURRED_BEFORE":
            claim["causal_inference"] = "NONE"
        if record.get("relation_hint") == "CONNECTION_OF_INTEREST":
            claim["mapping_note"] = "CONNECTION_OF_INTEREST_COARSENED_TO_ALLEGED_LINK"

        if evidence == "DISPUTED" or relation == "CONTRADICTS":
            disputed.append(claim)
        else:
            accepted.append(claim)

    all_claims = accepted + disputed
    groups = {}
    for claim in all_claims:
        key = (claim["subject"], claim["relation"], claim["object"])
        g = groups.setdefault(key, {"record_ids": [], "lineages": set()})
        g["record_ids"].append(claim["record_id"])
        g["lineages"].add(claim["provenance"]["source_lineage"])

    duplicate_groups = []
    for key, g in sorted(groups.items()):
        if len(g["record_ids"]) > len(g["lineages"]):
            duplicate_groups.append({
                "claim": {"subject": key[0], "relation": key[1], "object": key[2]},
                "record_ids": sorted(g["record_ids"]),
                "independent_lineage_count": len(g["lineages"]),
            })

    def sort_records(items):
        return sorted(items, key=lambda x: x["record_id"])

    audit = {
        "accepted": sort_records(accepted),
        "disputed": sort_records(disputed),
        "ambiguous": sort_records(ambiguous),
        "rejected": sort_records(rejected),
        "no_edge": sort_records(no_edge),
        "analyst_hypotheses": sort_records(hypotheses),
        "duplicate_groups": duplicate_groups,
    }
    audit["counts"] = {k: len(audit[k]) for k in ("accepted", "disputed", "ambiguous", "rejected", "no_edge", "analyst_hypotheses", "duplicate_groups")}
    audit["experiment"] = "NBG-T4"
    audit["version"] = VERSION
    audit["audit_hash"] = digest(audit)
    return audit


def frozen_fixture(extra_density=0):
    records = [
        {"record_id":"R01","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:fixture-arrow-1","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_A","relation_hint":"CONNECTION_OF_INTEREST","object_label":"NODE_B"},
        {"record_id":"R02","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:fixture-arrow-1-mirror","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_A","relation_hint":"CONNECTION_OF_INTEREST","object_label":"NODE_B"},
        {"record_id":"R03","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:center-timeline-1","source_lineage":"QWEB_ORIGINAL","subject_label":"EVENT_1","relation_hint":"TIMELINE_SEQUENCE","object_label":"EVENT_2","evidence_status":"OBSERVED"},
        {"record_id":"R04","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:adjacent-1","source_lineage":"QWEB_ORIGINAL","subject_label":"TOPIC_A","relation_hint":"ADJACENT_ONLY","object_label":"TOPIC_B"},
        {"record_id":"R05","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:tiny-label-1","source_lineage":"QWEB_ORIGINAL","subject_label":None,"relation_hint":"CONNECTION_OF_INTEREST","object_label":"NODE_C","readability":"AMBIGUOUS"},
        {"record_id":"R06","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:unsupported-1","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_D","relation_hint":"CAUSES","object_label":"NODE_E"},
        {"record_id":"R07","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:disputed-1","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_F","relation_hint":"ALLEGED_LINK","object_label":"NODE_G","evidence_status":"DISPUTED"},
        {"record_id":"R08","origin_kind":"SOURCE_MAP","source_locator":"qweb:p1:contradiction-1","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_H","relation_hint":"CONTRADICTS","object_label":"NODE_I","evidence_status":"DISPUTED"},
        {"record_id":"R09","origin_kind":"SOURCE_MAP","source_locator":"","source_lineage":"QWEB_ORIGINAL","subject_label":"NODE_J","relation_hint":"ALLEGED_LINK","object_label":"NODE_K"},
        {"record_id":"H01","origin_kind":"ANALYST_HYPOTHESIS","source_locator":"analyst://nbgt4/hypothesis-1","source_lineage":"ANALYST_SESSION_1","subject_label":"NODE_A","relation_hint":"INFERRED_INFLUENCE","object_label":"NODE_C","evidence_status":"INFERRED"},
    ]
    for i in range(extra_density):
        records.append({
            "record_id":f"D{i:03d}","origin_kind":"SOURCE_MAP",
            "source_locator":f"qweb:p1:density-{i}","source_lineage":"QWEB_ORIGINAL",
            "subject_label":f"DENSE_{i}","relation_hint":"CONNECTION_OF_INTEREST","object_label":f"DENSE_{i+1}",
        })
    return records


def run_suite():
    base = ingest(frozen_fixture())
    dense = ingest(frozen_fixture(extra_density=64))
    reversed_input = ingest(list(reversed(frozen_fixture())))

    base_r1 = next(x for x in base["accepted"] if x["record_id"] == "R01")
    base_r3 = next(x for x in base["accepted"] if x["record_id"] == "R03")
    checks = [
        {"name":"arrow:generic_connection_becomes_alleged_link","pass":base_r1["relation"]=="ALLEGED_LINK" and base_r1["evidence_status"]=="ALLEGED"},
        {"name":"provenance:accepted_claim_has_exact_locator","pass":base_r1["provenance"]["source_locator"]=="qweb:p1:fixture-arrow-1"},
        {"name":"ambiguity:unreadable_label_not_guessed","pass":base["ambiguous"][0]["record_id"]=="R05" and base["ambiguous"][0]["subject"]=="UNKNOWN"},
        {"name":"relation:unsupported_refused","pass":any(x["record_id"]=="R06" and x["reason"]=="UNSUPPORTED_RELATION" for x in base["rejected"])},
        {"name":"provenance:missing_locator_refused","pass":any(x["record_id"]=="R09" and x["reason"]=="MISSING_PROVENANCE" for x in base["rejected"])},
        {"name":"adjacency:not_promoted_to_edge","pass":base["no_edge"]==[{"record_id":"R04","reason":"ADJACENCY_IS_NOT_AN_EDGE","subject":"TOPIC_A","object":"TOPIC_B","source_locator":"qweb:p1:adjacent-1"}]},
        {"name":"chronology:not_causal","pass":base_r3["relation"]=="OCCURRED_BEFORE" and base_r3["causal_inference"]=="NONE"},
        {"name":"duplicates:lineage_not_independence","pass":base["duplicate_groups"]==[{"claim":{"subject":"NODE_A","relation":"ALLEGED_LINK","object":"NODE_B"},"record_ids":["R01","R02"],"independent_lineage_count":1}]},
        {"name":"contradiction:inspectable","pass":any(x["record_id"]=="R08" and x["relation"]=="CONTRADICTS" for x in base["disputed"])},
        {"name":"dispute:not_erased","pass":any(x["record_id"]=="R07" and x["evidence_status"]=="DISPUTED" for x in base["disputed"])},
        {"name":"hypothesis:separate_from_observed","pass":base["analyst_hypotheses"][0]["record_id"]=="H01" and all(x["record_id"]!="H01" for x in base["accepted"]+base["disputed"])},
        {"name":"audit:all_buckets_present","pass":all(k in base for k in ("accepted","disputed","ambiguous","rejected","no_edge","analyst_hypotheses","duplicate_groups"))},
        {"name":"density:semantics_invariant","pass":next(x for x in dense["accepted"] if x["record_id"]=="R01")["relation"]==base_r1["relation"] and next(x for x in dense["accepted"] if x["record_id"]=="R03")["causal_inference"]=="NONE"},
        {"name":"order:canonical_output_invariant","pass":canonical(base)==canonical(reversed_input)},
        {"name":"replay:exact","pass":canonical(base)==canonical(ingest(frozen_fixture()))},
    ]
    payload={
        "experiment":"NBG-T4","version":VERSION,
        "fixture_basis":"SMALL_SYNTHETIC_DERIVATIVE_OF_QWEB_FAILURE_MODES",
        "witness":{
            "base_counts":base["counts"],
            "generic_arrow_relation":base_r1["relation"],
            "timeline_relation":base_r3["relation"],
            "timeline_causal_inference":base_r3["causal_inference"],
            "ambiguous_record_ids":[x["record_id"] for x in base["ambiguous"]],
            "rejected_record_ids":[x["record_id"] for x in base["rejected"]],
            "hypothesis_record_ids":[x["record_id"] for x in base["analyst_hypotheses"]],
            "dense_extra_records":64,
        },
        "audit":base,
        "checks":checks,
        "checks_passed":sum(bool(x["pass"]) for x in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT4" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT4"
    payload["result_hash"]=digest(payload)
    return payload


def main():
    payload=run_suite()
    out=ROOT/"results"; out.mkdir(parents=True,exist_ok=True)
    fixture=frozen_fixture()
    (out/"fixture.json").write_text(json.dumps(fixture,indent=2,sort_keys=True)+"\n")
    (out/"audit.json").write_text(json.dumps(payload["audit"],indent=2,sort_keys=True)+"\n")
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "counts":payload["witness"]["base_counts"],
        "generic_arrow_relation":payload["witness"]["generic_arrow_relation"],
        "timeline_relation":payload["witness"]["timeline_relation"],
        "timeline_causal_inference":payload["witness"]["timeline_causal_inference"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_NBGT4": raise SystemExit(1)

if __name__=="__main__":
    main()
