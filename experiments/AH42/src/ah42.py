#!/usr/bin/env python3
from __future__ import annotations
from itertools import combinations
from pathlib import Path
import hashlib, json

VERSION="0.1.0"

SEATS=("A","B","C")
PRINCIPALS=("PRINCIPAL_A","PRINCIPAL_B","PRINCIPAL_C")
SEAT_OWNER={
    "PRINCIPAL_A":"A",
    "PRINCIPAL_B":"B",
    "PRINCIPAL_C":"C",
}
P_FAIL=0.1

SCENARIOS={
    "S1_CERTIFIED_INDEPENDENT":{
        "actual":{
            "PRINCIPAL_A":"ROOT_A",
            "PRINCIPAL_B":"ROOT_B",
            "PRINCIPAL_C":"ROOT_C",
        },
        "declared":{
            "PRINCIPAL_A":"DECL_A",
            "PRINCIPAL_B":"DECL_B",
            "PRINCIPAL_C":"DECL_C",
        },
        "observed":{
            "PRINCIPAL_A":"ROOT_A",
            "PRINCIPAL_B":"ROOT_B",
            "PRINCIPAL_C":"ROOT_C",
        },
    },
    "S2_SHARED_AB_OBSERVED":{
        "actual":{
            "PRINCIPAL_A":"ROOT_AB",
            "PRINCIPAL_B":"ROOT_AB",
            "PRINCIPAL_C":"ROOT_C",
        },
        "declared":{
            "PRINCIPAL_A":"DECL_A",
            "PRINCIPAL_B":"DECL_B",
            "PRINCIPAL_C":"DECL_C",
        },
        "observed":{
            "PRINCIPAL_A":"ROOT_AB",
            "PRINCIPAL_B":"ROOT_AB",
            "PRINCIPAL_C":"ROOT_C",
        },
    },
    "S3_INDEPENDENT_BUT_UNVERIFIED":{
        "actual":{
            "PRINCIPAL_A":"ROOT_A",
            "PRINCIPAL_B":"ROOT_B",
            "PRINCIPAL_C":"ROOT_C",
        },
        "declared":{
            "PRINCIPAL_A":"DECL_A",
            "PRINCIPAL_B":"DECL_B",
            "PRINCIPAL_C":"DECL_C",
        },
        "observed":{
            "PRINCIPAL_A":"ROOT_A",
            "PRINCIPAL_B":None,
            "PRINCIPAL_C":None,
        },
    },
    "S4_HIDDEN_SHARED_UNVERIFIED":{
        "actual":{
            "PRINCIPAL_A":"ROOT_AB",
            "PRINCIPAL_B":"ROOT_AB",
            "PRINCIPAL_C":"ROOT_C",
        },
        "declared":{
            "PRINCIPAL_A":"DECL_A",
            "PRINCIPAL_B":"DECL_B",
            "PRINCIPAL_C":"DECL_C",
        },
        "observed":{
            "PRINCIPAL_A":None,
            "PRINCIPAL_B":None,
            "PRINCIPAL_C":"ROOT_C",
        },
    },
}

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def unique_actual_roots(actual):
    return tuple(sorted(set(actual.values())))

def root_coalitions(actual):
    roots=unique_actual_roots(actual)
    return tuple(
        c for n in range(len(roots)+1) for c in combinations(roots,n)
    )

def controlled_principals(root_coalition,actual):
    roots=set(root_coalition)
    return tuple(p for p in PRINCIPALS if actual[p] in roots)

def controlled_seats(root_coalition,actual):
    ps=controlled_principals(root_coalition,actual)
    return tuple(s for s in SEATS if any(SEAT_OWNER[p]==s for p in ps))

def capable(root_coalition,actual,threshold):
    return len(controlled_seats(root_coalition,actual))>=threshold

def minimal_capable(actual,threshold):
    good=[c for c in root_coalitions(actual) if capable(c,actual,threshold)]
    return tuple(
        c for c in good if not any(set(d)<set(c) for d in good)
    )

def available(down_roots,actual,threshold):
    roots=set(unique_actual_roots(actual))-set(down_roots)
    return capable(tuple(sorted(roots)),actual,threshold)

def minimal_failure_cuts(actual,threshold):
    roots=unique_actual_roots(actual)
    bad=[
        c for n in range(len(roots)+1) for c in combinations(roots,n)
        if not available(c,actual,threshold)
    ]
    return tuple(
        c for c in bad if not any(set(d)<set(c) for d in bad)
    )

def reliability(actual,threshold,p=P_FAIL):
    roots=unique_actual_roots(actual)
    total=0.0
    for n in range(len(roots)+1):
        for down in combinations(roots,n):
            prob=(p**n)*((1-p)**(len(roots)-n))
            if available(down,actual,threshold):
                total+=prob
    return total

def certification(declared,observed):
    complete=all(observed[p] is not None for p in PRINCIPALS)
    known=[observed[p] for p in PRINCIPALS if observed[p] is not None]

    if not complete:
        return {
            "status":"INDEPENDENCE_UNVERIFIED",
            "complete_evidence":False,
            "advertise_independent_quorum":False,
            "verified_control_domain_count":None,
            "contradiction_status":"NO_COMPLETE_CONTROL_DOMAIN_EVIDENCE",
            "advertised_independent_verification_threshold":None,
            "advertised_independent_declassification_threshold":None,
            "effective_verified_root_threshold_VERIFY":None,
            "effective_verified_root_threshold_DECLASSIFY":None,
        }

    unique_count=len(set(known))
    shared=unique_count<len(PRINCIPALS)

    if not shared:
        return {
            "status":"CERTIFIED_INDEPENDENT",
            "complete_evidence":True,
            "advertise_independent_quorum":True,
            "verified_control_domain_count":3,
            "contradiction_status":"NONE",
            "advertised_independent_verification_threshold":2,
            "advertised_independent_declassification_threshold":3,
            "effective_verified_root_threshold_VERIFY":2,
            "effective_verified_root_threshold_DECLASSIFY":3,
        }

    # In this frozen model declarations use three different labels, so observed sharing
    # contradicts the declared separation.
    return {
        "status":"SHARED_CONTROL_OBSERVED",
        "complete_evidence":True,
        "advertise_independent_quorum":False,
        "verified_control_domain_count":unique_count,
        "contradiction_status":"DECLARATION_CONTRADICTED_BY_SHARED_CONTROL_EVIDENCE",
        "advertised_independent_verification_threshold":None,
        "advertised_independent_declassification_threshold":None,
        "effective_verified_root_threshold_VERIFY":1,
        "effective_verified_root_threshold_DECLASSIFY":2,
    }

def scenario_receipt(scenario_id,scenario):
    actual=scenario["actual"]
    cert=certification(scenario["declared"],scenario["observed"])
    verify_min=minimal_capable(actual,2)
    declass_min=minimal_capable(actual,3)
    body={
        "version":VERSION,
        "scenario_id":scenario_id,
        "logical_seat_count":len(SEATS),
        "named_principal_count":len(PRINCIPALS),
        "actual_root_domain_count":len(unique_actual_roots(actual)),
        "actual_root_map":actual,
        "declared_roots":scenario["declared"],
        "observed_roots":scenario["observed"],
        **cert,
        "actual_verification_root_threshold":min(map(len,verify_min)),
        "actual_declassification_root_threshold":min(map(len,declass_min)),
        "minimal_verification_capable_root_coalitions":[list(x) for x in verify_min],
        "minimal_declassification_capable_root_coalitions":[list(x) for x in declass_min],
        "verification_failure_cuts":[list(x) for x in minimal_failure_cuts(actual,2)],
        "declassification_failure_cuts":[list(x) for x in minimal_failure_cuts(actual,3)],
        "verification_reliability_p0_1":reliability(actual,2),
        "declassification_reliability_p0_1":reliability(actual,3),
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def shared_evidence_progression():
    actual=SCENARIOS["S2_SHARED_AB_OBSERVED"]["actual"]
    declared=SCENARIOS["S2_SHARED_AB_OBSERVED"]["declared"]
    observed_sequence=(
        {
            "PRINCIPAL_A":None,
            "PRINCIPAL_B":None,
            "PRINCIPAL_C":None,
        },
        {
            "PRINCIPAL_A":None,
            "PRINCIPAL_B":None,
            "PRINCIPAL_C":"ROOT_C",
        },
        {
            "PRINCIPAL_A":"ROOT_AB",
            "PRINCIPAL_B":"ROOT_AB",
            "PRINCIPAL_C":"ROOT_C",
        },
    )
    out=[]
    for i,observed in enumerate(observed_sequence):
        c=certification(declared,observed)
        out.append({
            "step":f"U{i}",
            "observed_roots":observed,
            "status":c["status"],
            "advertise_independent_quorum":c["advertise_independent_quorum"],
        })
    return out

def run_experiment():
    receipts={
        sid:scenario_receipt(sid,s)
        for sid,s in SCENARIOS.items()
    }
    body={
        "experiment":"NBG-AH42",
        "version":VERSION,
        "scenarios":receipts,
        "shared_evidence_progression":shared_evidence_progression(),
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    result=run_experiment()
    r=result["scenarios"]
    s1=r["S1_CERTIFIED_INDEPENDENT"]
    s2=r["S2_SHARED_AB_OBSERVED"]
    s3=r["S3_INDEPENDENT_BUT_UNVERIFIED"]
    s4=r["S4_HIDDEN_SHARED_UNVERIFIED"]
    checks=[]

    checks.extend([
        {"name":"suite:4_scenarios","pass":len(r)==4},
        {"name":"counts:all_have_3_seats","pass":all(x["logical_seat_count"]==3 for x in r.values())},
        {"name":"counts:all_have_3_named_principals","pass":all(x["named_principal_count"]==3 for x in r.values())},
    ])

    checks.extend([
        {"name":"cert:S1_status","pass":s1["status"]=="CERTIFIED_INDEPENDENT"},
        {"name":"cert:S1_complete","pass":s1["complete_evidence"]},
        {"name":"cert:S1_domains3","pass":s1["verified_control_domain_count"]==3},
        {"name":"cert:S1_advertises","pass":s1["advertise_independent_quorum"]},
        {"name":"cert:S1_thresholds","pass":
            s1["advertised_independent_verification_threshold"]==2 and
            s1["advertised_independent_declassification_threshold"]==3
        },
    ])

    checks.extend([
        {"name":"shared:S2_status","pass":s2["status"]=="SHARED_CONTROL_OBSERVED"},
        {"name":"shared:S2_domains2","pass":s2["verified_control_domain_count"]==2},
        {"name":"shared:S2_no_independent_advertisement","pass":not s2["advertise_independent_quorum"]},
        {"name":"shared:S2_contradiction","pass":
            s2["contradiction_status"]=="DECLARATION_CONTRADICTED_BY_SHARED_CONTROL_EVIDENCE"
        },
        {"name":"shared:S2_effective_thresholds","pass":
            s2["effective_verified_root_threshold_VERIFY"]==1 and
            s2["effective_verified_root_threshold_DECLASSIFY"]==2
        },
    ])

    for label,x in (("S3",s3),("S4",s4)):
        checks.extend([
            {"name":f"unverified:{label}_status","pass":x["status"]=="INDEPENDENCE_UNVERIFIED"},
            {"name":f"unverified:{label}_incomplete","pass":not x["complete_evidence"]},
            {"name":f"unverified:{label}_no_advertisement","pass":not x["advertise_independent_quorum"]},
            {"name":f"unverified:{label}_thresholds_null","pass":
                x["advertised_independent_verification_threshold"] is None and
                x["advertised_independent_declassification_threshold"] is None
            },
        ])

    expected_thresholds={
        "S1_CERTIFIED_INDEPENDENT":(2,3),
        "S2_SHARED_AB_OBSERVED":(1,2),
        "S3_INDEPENDENT_BUT_UNVERIFIED":(2,3),
        "S4_HIDDEN_SHARED_UNVERIFIED":(1,2),
    }
    for sid,(v,d) in expected_thresholds.items():
        x=r[sid]
        checks.append({
            "name":f"actual_threshold:{sid}",
            "pass":x["actual_verification_root_threshold"]==v and
                   x["actual_declassification_root_threshold"]==d
        })

    checks.extend([
        {"name":"failure:S1_verify_pairs","pass":s1["verification_failure_cuts"]==[
            ["ROOT_A","ROOT_B"],["ROOT_A","ROOT_C"],["ROOT_B","ROOT_C"]
        ]},
        {"name":"failure:S1_declass_singletons","pass":s1["declassification_failure_cuts"]==[
            ["ROOT_A"],["ROOT_B"],["ROOT_C"]
        ]},
        {"name":"failure:S2_verify_shared_single","pass":s2["verification_failure_cuts"]==[
            ["ROOT_AB"]
        ]},
        {"name":"failure:S2_declass_shared_singletons","pass":s2["declassification_failure_cuts"]==[
            ["ROOT_AB"],["ROOT_C"]
        ]},
        {"name":"failure:S4_matches_shared_topology","pass":
            s4["verification_failure_cuts"]==s2["verification_failure_cuts"] and
            s4["declassification_failure_cuts"]==s2["declassification_failure_cuts"]
        },
    ])

    checks.extend([
        {"name":"reliability:S1_verify_0p972","pass":abs(s1["verification_reliability_p0_1"]-0.972)<1e-12},
        {"name":"reliability:S1_declass_0p729","pass":abs(s1["declassification_reliability_p0_1"]-0.729)<1e-12},
        {"name":"reliability:S2_verify_0p9","pass":abs(s2["verification_reliability_p0_1"]-0.9)<1e-12},
        {"name":"reliability:S2_declass_0p81","pass":abs(s2["declassification_reliability_p0_1"]-0.81)<1e-12},
        {"name":"reliability:S3_matches_independent","pass":
            abs(s3["verification_reliability_p0_1"]-s1["verification_reliability_p0_1"])<1e-12 and
            abs(s3["declassification_reliability_p0_1"]-s1["declassification_reliability_p0_1"])<1e-12
        },
        {"name":"reliability:S4_matches_shared","pass":
            abs(s4["verification_reliability_p0_1"]-s2["verification_reliability_p0_1"])<1e-12 and
            abs(s4["declassification_reliability_p0_1"]-s2["declassification_reliability_p0_1"])<1e-12
        },
    ])

    prog=result["shared_evidence_progression"]
    checks.extend([
        {"name":"progression:3_steps","pass":len(prog)==3},
        {"name":"progression:statuses_exact","pass":[x["status"] for x in prog]==[
            "INDEPENDENCE_UNVERIFIED",
            "INDEPENDENCE_UNVERIFIED",
            "SHARED_CONTROL_OBSERVED",
        ]},
        {"name":"progression:never_false_certifies","pass":all(
            x["status"]!="CERTIFIED_INDEPENDENT" for x in prog
        )},
        {"name":"progression:never_advertises_independence","pass":all(
            not x["advertise_independent_quorum"] for x in prog
        )},
    ])

    checks.extend([
        {"name":"negative:names_same_counts_thresholds_differ","pass":
            s1["named_principal_count"]==s2["named_principal_count"]==3 and
            s1["actual_declassification_root_threshold"]!=s2["actual_declassification_root_threshold"]
        },
        {"name":"negative:hidden_shared_refusal_prevents_false_claim","pass":
            s4["status"]=="INDEPENDENCE_UNVERIFIED" and
            s4["advertised_independent_declassification_threshold"] is None and
            s4["actual_declassification_root_threshold"]==2
        },
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_AH42" if passed==len(checks) else "FAIL_AH42",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)

    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "scenarios":{
            sid:{
                "status":x["status"],
                "actual_root_domain_count":x["actual_root_domain_count"],
                "actual_verify_threshold":x["actual_verification_root_threshold"],
                "actual_declass_threshold":x["actual_declassification_root_threshold"],
                "advertised_independent":x["advertise_independent_quorum"],
                "verify_reliability":x["verification_reliability_p0_1"],
                "declass_reliability":x["declassification_reliability_p0_1"],
            } for sid,x in r.items()
        },
        "shared_evidence_progression":prog,
        "receipt_hash":result["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH42":
        raise SystemExit(1)

if __name__=="__main__":
    main()
