#!/usr/bin/env python3
from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import hashlib
import json

VERSION = "0.1.0"
ROOT = Path(__file__).resolve().parents[1]
STANCES = {"SUPPORT", "OPPOSE"}
REFUTATION_AUTHORITY = "FROZEN_NBGT3_REFUTATION_AUTHORITY"

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":")).encode()

def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()

def validate_source(s):
    required={"source_id","lineage_id","independence_group","locator","provenance"}
    missing=sorted(required-set(s))
    if missing: raise ValueError(f"missing source fields: {missing}")
    for key in ("source_id","lineage_id","independence_group"):
        if not isinstance(s[key],str) or not s[key]:
            raise ValueError(f"{key} must be a non-empty string")
    return True

def validate_evidence(e, source_ids):
    required={"evidence_id","claim_id","source_id","stance","valid_time","known_time","excerpt_digest","provenance"}
    missing=sorted(required-set(e))
    if missing: raise ValueError(f"missing evidence fields: {missing}")
    if e["source_id"] not in source_ids: raise ValueError(f"unknown source: {e['source_id']}")
    if e["stance"] not in STANCES: raise ValueError(f"unsupported stance: {e['stance']}")
    if not isinstance(e["valid_time"],int) or not isinstance(e["known_time"],int):
        raise ValueError("times must be integers")
    if e["known_time"] < e["valid_time"]:
        raise ValueError("known_time must be >= valid_time")
    return True

def validate_decision(d):
    required={"decision_id","claim_id","kind","valid_time","known_time","authority","provenance"}
    missing=sorted(required-set(d))
    if missing: raise ValueError(f"missing decision fields: {missing}")
    if d["kind"]!="REFUTATION_DECISION":
        raise ValueError(f"unsupported decision kind: {d['kind']}")
    if d["known_time"] < d["valid_time"]:
        raise ValueError("known_time must be >= valid_time")
    return True

def visible(record, world_cutoff, knowledge_cutoff):
    return record["valid_time"]<=world_cutoff and record["known_time"]<=knowledge_cutoff

def reconcile(claim,sources,evidence,decisions=(),*,world_cutoff,knowledge_cutoff,exclude_source_ids=()):
    smap={}
    for s in sources:
        validate_source(s)
        if s["source_id"] in smap: raise ValueError(f"duplicate source_id: {s['source_id']}")
        smap[s["source_id"]]=deepcopy(s)
    for e in evidence: validate_evidence(e,smap)
    for d in decisions: validate_decision(d)

    excluded=tuple(sorted(set(exclude_source_ids)))
    selected=[
        deepcopy(e) for e in evidence
        if e["claim_id"]==claim["claim_id"]
        and e["source_id"] not in excluded
        and visible(e,world_cutoff,knowledge_cutoff)
    ]
    selected.sort(key=lambda e:(e["known_time"],e["valid_time"],e["evidence_id"]))
    dsel=[
        deepcopy(d) for d in decisions
        if d["claim_id"]==claim["claim_id"] and visible(d,world_cutoff,knowledge_cutoff)
    ]
    dsel.sort(key=lambda d:(d["known_time"],d["valid_time"],d["decision_id"]))

    ledger=[]
    for e in selected:
        s=smap[e["source_id"]]
        ledger.append({
            **e,
            "source":{
                "source_id":s["source_id"],
                "lineage_id":s["lineage_id"],
                "independence_group":s["independence_group"],
                "locator":s["locator"],
                "provenance":s["provenance"],
            },
        })

    support=sorted({x["source"]["independence_group"] for x in ledger if x["stance"]=="SUPPORT"})
    oppose=sorted({x["source"]["independence_group"] for x in ledger if x["stance"]=="OPPOSE"})

    seen=set(); duplicates=[]
    for x in ledger:
        key=(x["claim_id"],x["stance"],x["source"]["lineage_id"])
        if key in seen: duplicates.append(x["evidence_id"])
        else: seen.add(key)

    explicit_refutation=any(d["authority"]==REFUTATION_AUTHORITY for d in dsel)

    if support and oppose:
        status="DISPUTED"
    elif support:
        status="CORROBORATED" if len(support)>=2 else "OBSERVED"
    elif oppose:
        status="REFUTED" if explicit_refutation and len(oppose)>=2 else "DISPUTED"
    else:
        status="UNKNOWN"

    summary={
        "status":status,
        "independent_support_groups":support,
        "independent_oppose_groups":oppose,
        "independent_support_count":len(support),
        "independent_oppose_count":len(oppose),
        "evidence_record_count":len(ledger),
        "duplicate_evidence_ids":sorted(duplicates),
        "explicit_refutation_present":explicit_refutation,
    }
    receipt={
        "experiment":"NBG-T3",
        "version":VERSION,
        "mode":"COUNTERFACTUAL" if excluded else "OBSERVED",
        "claim":deepcopy(claim),
        "world_cutoff":world_cutoff,
        "knowledge_cutoff":knowledge_cutoff,
        "excluded_source_ids":list(excluded),
        "evidence_ledger":ledger,
        "decision_ledger":dsel,
        "summary":summary,
    }
    receipt["receipt_hash"]=digest(receipt)
    return receipt

def frozen_fixture():
    disputed={"claim_id":"C_DISPUTED","subject":"ORG_X","predicate":"DOCUMENTED_INTERACTION","object":"ORG_Y"}
    refutable={"claim_id":"C_REFUTABLE","subject":"PROGRAM_Q","predicate":"OPERATED_BY","object":"ORG_Z"}
    sources=[
        {"source_id":"S1","lineage_id":"L1","independence_group":"G1","locator":"synthetic://archive/original","provenance":"SYNTHETIC_PRIMARY"},
        {"source_id":"S1_MIRROR","lineage_id":"L1","independence_group":"G1","locator":"synthetic://mirror/copy","provenance":"SYNTHETIC_MIRROR"},
        {"source_id":"S2","lineage_id":"L2","independence_group":"G2","locator":"synthetic://independent/opposition","provenance":"SYNTHETIC_INDEPENDENT"},
        {"source_id":"S3","lineage_id":"L3","independence_group":"G3","locator":"synthetic://late/support","provenance":"SYNTHETIC_LATE"},
        {"source_id":"S3_REPRINT","lineage_id":"L3","independence_group":"G3","locator":"synthetic://late/reprint","provenance":"SYNTHETIC_REPRINT"},
        {"source_id":"R1","lineage_id":"RL1","independence_group":"RG1","locator":"synthetic://refute/one","provenance":"SYNTHETIC_REFUTE"},
        {"source_id":"R2","lineage_id":"RL2","independence_group":"RG2","locator":"synthetic://refute/two","provenance":"SYNTHETIC_REFUTE"},
        {"source_id":"R2_COPY","lineage_id":"RL2","independence_group":"RG2","locator":"synthetic://refute/two-copy","provenance":"SYNTHETIC_REPRINT"},
    ]
    evidence=[
        {"evidence_id":"E1_SUPPORT","claim_id":"C_DISPUTED","source_id":"S1","stance":"SUPPORT","valid_time":1,"known_time":1,"excerpt_digest":"D_SUPPORT_1","provenance":"SYNTHETIC_EVIDENCE"},
        {"evidence_id":"E1_SUPPORT_COPY","claim_id":"C_DISPUTED","source_id":"S1_MIRROR","stance":"SUPPORT","valid_time":1,"known_time":1,"excerpt_digest":"D_SUPPORT_1","provenance":"SYNTHETIC_EVIDENCE_COPY"},
        {"evidence_id":"E2_OPPOSE","claim_id":"C_DISPUTED","source_id":"S2","stance":"OPPOSE","valid_time":2,"known_time":2,"excerpt_digest":"D_OPPOSE_1","provenance":"SYNTHETIC_EVIDENCE"},
        {"evidence_id":"E3_LATE_SUPPORT","claim_id":"C_DISPUTED","source_id":"S3","stance":"SUPPORT","valid_time":2,"known_time":4,"excerpt_digest":"D_SUPPORT_2","provenance":"SYNTHETIC_LATE_EVIDENCE"},
        {"evidence_id":"E3_LATE_SUPPORT_REPRINT","claim_id":"C_DISPUTED","source_id":"S3_REPRINT","stance":"SUPPORT","valid_time":2,"known_time":4,"excerpt_digest":"D_SUPPORT_2","provenance":"SYNTHETIC_LATE_REPRINT"},
        {"evidence_id":"R1_OPPOSE","claim_id":"C_REFUTABLE","source_id":"R1","stance":"OPPOSE","valid_time":1,"known_time":1,"excerpt_digest":"D_REFUTE_1","provenance":"SYNTHETIC_REFUTE_EVIDENCE"},
        {"evidence_id":"R2_OPPOSE","claim_id":"C_REFUTABLE","source_id":"R2","stance":"OPPOSE","valid_time":1,"known_time":2,"excerpt_digest":"D_REFUTE_2","provenance":"SYNTHETIC_REFUTE_EVIDENCE"},
        {"evidence_id":"R2_OPPOSE_COPY","claim_id":"C_REFUTABLE","source_id":"R2_COPY","stance":"OPPOSE","valid_time":1,"known_time":2,"excerpt_digest":"D_REFUTE_2","provenance":"SYNTHETIC_REFUTE_COPY"},
    ]
    decisions=[{"decision_id":"D_REFUTE","claim_id":"C_REFUTABLE","kind":"REFUTATION_DECISION","valid_time":2,"known_time":4,"authority":REFUTATION_AUTHORITY,"provenance":"FROZEN_SYNTHETIC_POLICY"}]
    return disputed,refutable,sources,evidence,decisions

def run_suite():
    disputed,refutable,sources,evidence,decisions=frozen_fixture()
    def rec(c,k,exclude=()):
        return reconcile(c,sources,evidence,decisions,world_cutoff=4,knowledge_cutoff=k,exclude_source_ids=exclude)
    k1,k2,k4=rec(disputed,1),rec(disputed,2),rec(disputed,4)
    r2,r4=rec(refutable,2),rec(refutable,4)
    cf=rec(disputed,4,("S2",))
    rev=reconcile(disputed,list(reversed(sources)),list(reversed(evidence)),list(reversed(decisions)),world_cutoff=4,knowledge_cutoff=4)

    checks=[
        {"name":"duplicate:mirror_not_independent","pass":k1["summary"]["independent_support_count"]==1 and k1["summary"]["duplicate_evidence_ids"]==["E1_SUPPORT_COPY"]},
        {"name":"independence:explicit_groups","pass":k4["summary"]["independent_support_groups"]==["G1","G3"]},
        {"name":"status:single_support_observed","pass":k1["summary"]["status"]=="OBSERVED"},
        {"name":"status:support_and_oppose_disputed","pass":k2["summary"]["status"]=="DISPUTED"},
        {"name":"status:majority_does_not_erase_conflict","pass":k4["summary"]["status"]=="DISPUTED" and k4["summary"]["independent_support_count"]==2 and k4["summary"]["independent_oppose_count"]==1},
        {"name":"bitemporal:late_hidden","pass":"E3_LATE_SUPPORT" not in [x["evidence_id"] for x in k2["evidence_ledger"]]},
        {"name":"bitemporal:late_visible","pass":"E3_LATE_SUPPORT" in [x["evidence_id"] for x in k4["evidence_ledger"]]},
        {"name":"provenance:retained","pass":all(x["source"]["provenance"] and x["provenance"] for x in k4["evidence_ledger"])},
        {"name":"view:ledger_retained","pass":len(k4["evidence_ledger"])==5 and k4["summary"]["evidence_record_count"]==5},
        {"name":"refutation:opposition_not_enough","pass":r2["summary"]["status"]=="DISPUTED" and r2["summary"]["independent_oppose_count"]==2},
        {"name":"refutation:explicit_gate","pass":r4["summary"]["status"]=="REFUTED" and r4["summary"]["explicit_refutation_present"] is True},
        {"name":"counterfactual:separate","pass":cf["mode"]=="COUNTERFACTUAL" and cf["summary"]["status"]=="CORROBORATED" and k4["mode"]=="OBSERVED" and k4["summary"]["status"]=="DISPUTED"},
        {"name":"canonical:order_invariant","pass":canonical(k4)==canonical(rev)},
        {"name":"replay:exact","pass":canonical(k4)==canonical(rec(disputed,4))},
    ]
    payload={
        "experiment":"NBG-T3","version":VERSION,
        "witness":{
            "k1_status":k1["summary"]["status"],
            "k2_status":k2["summary"]["status"],
            "k4_status":k4["summary"]["status"],
            "k4_support_groups":k4["summary"]["independent_support_groups"],
            "k4_oppose_groups":k4["summary"]["independent_oppose_groups"],
            "k4_duplicate_ids":k4["summary"]["duplicate_evidence_ids"],
            "refute_without_decision":r2["summary"]["status"],
            "refute_with_decision":r4["summary"]["status"],
            "counterfactual_without_S2":cf["summary"]["status"],
        },
        "receipts":{"disputed_k1":k1,"disputed_k2":k2,"disputed_k4":k4,"refutable_k2":r2,"refutable_k4":r4,"counterfactual_without_S2":cf},
        "checks":checks,
        "checks_passed":sum(bool(x["pass"]) for x in checks),
        "checks_total":len(checks),
    }
    payload["verdict"]="PASS_NBGT3" if payload["checks_passed"]==payload["checks_total"] else "FAIL_NBGT3"
    payload["result_hash"]=digest(payload)
    return payload

def main():
    payload=run_suite()
    out=ROOT/"results"; out.mkdir(parents=True,exist_ok=True)
    disputed,refutable,sources,evidence,decisions=frozen_fixture()
    (out/"sources.json").write_text(json.dumps(sources,indent=2,sort_keys=True)+"\n")
    (out/"evidence.json").write_text(json.dumps(evidence,indent=2,sort_keys=True)+"\n")
    (out/"decisions.json").write_text(json.dumps(decisions,indent=2,sort_keys=True)+"\n")
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{payload['checks_passed']}/{payload['checks_total']}",
        "k1_status":payload["witness"]["k1_status"],
        "k2_status":payload["witness"]["k2_status"],
        "k4_status":payload["witness"]["k4_status"],
        "refute_without_decision":payload["witness"]["refute_without_decision"],
        "refute_with_decision":payload["witness"]["refute_with_decision"],
        "counterfactual_without_S2":payload["witness"]["counterfactual_without_S2"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_NBGT3": raise SystemExit(1)

if __name__=="__main__":
    main()
