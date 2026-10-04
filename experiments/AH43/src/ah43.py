#!/usr/bin/env python3
from __future__ import annotations
from itertools import combinations
from pathlib import Path
import hashlib, json

VERSION="0.1.0"
TTL=2
PRINCIPALS=("PRINCIPAL_A","PRINCIPAL_B","PRINCIPAL_C")
SEAT_OWNER={
    "PRINCIPAL_A":"A",
    "PRINCIPAL_B":"B",
    "PRINCIPAL_C":"C",
}
INDEPENDENT={
    "PRINCIPAL_A":"ROOT_A",
    "PRINCIPAL_B":"ROOT_B",
    "PRINCIPAL_C":"ROOT_C",
}
SHARED_AB={
    "PRINCIPAL_A":"ROOT_AB",
    "PRINCIPAL_B":"ROOT_AB",
    "PRINCIPAL_C":"ROOT_C",
}
P_FAIL=0.1

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def roots(actual):
    return tuple(sorted(set(actual.values())))

def controlled_seats(root_coalition,actual):
    rs=set(root_coalition)
    return tuple(sorted(
        SEAT_OWNER[p] for p in PRINCIPALS if actual[p] in rs
    ))

def capable(root_coalition,actual,threshold):
    return len(controlled_seats(root_coalition,actual))>=threshold

def root_coalitions(actual):
    r=roots(actual)
    return tuple(c for n in range(len(r)+1) for c in combinations(r,n))

def minimal_capable(actual,threshold):
    good=[c for c in root_coalitions(actual) if capable(c,actual,threshold)]
    return tuple(c for c in good if not any(set(d)<set(c) for d in good))

def available(down,actual,threshold):
    up=tuple(r for r in roots(actual) if r not in set(down))
    return capable(up,actual,threshold)

def reliability(actual,threshold,p=P_FAIL):
    r=roots(actual)
    total=0.0
    for n in range(len(r)+1):
        for down in combinations(r,n):
            prob=(p**n)*((1-p)**(len(r)-n))
            if available(down,actual,threshold):
                total+=prob
    return total

def actual_metrics(actual):
    v=minimal_capable(actual,2)
    d=minimal_capable(actual,3)
    return {
        "actual_root_domain_count":len(roots(actual)),
        "actual_verification_root_threshold":min(map(len,v)),
        "actual_declassification_root_threshold":min(map(len,d)),
        "verification_reliability_p0_1":reliability(actual,2),
        "declassification_reliability_p0_1":reliability(actual,3),
    }

def issue_certificate(epoch,observed):
    if any(observed[p] is None for p in PRINCIPALS):
        return {
            "issue_epoch":None,
            "observed_roots":dict(observed),
            "status":"INDEPENDENCE_UNVERIFIED",
        }
    vals=[observed[p] for p in PRINCIPALS]
    if len(set(vals))==3:
        return {
            "issue_epoch":epoch,
            "observed_roots":dict(observed),
            "status":"CERTIFIED_FRESH",
        }
    return {
        "issue_epoch":epoch,
        "observed_roots":dict(observed),
        "status":"SHARED_CONTROL_OBSERVED",
    }

def evaluate_certificate(epoch,certificate):
    status=certificate["status"]
    if status=="SHARED_CONTROL_OBSERVED":
        return {
            "status":"SHARED_CONTROL_OBSERVED",
            "age":0,
            "fresh":True,
            "advertise":False,
            "advertised_verify":None,
            "advertised_declassify":None,
            "effective_verified_verify":1,
            "effective_verified_declassify":2,
        }
    if status=="INDEPENDENCE_UNVERIFIED":
        return {
            "status":"INDEPENDENCE_UNVERIFIED",
            "age":None,
            "fresh":False,
            "advertise":False,
            "advertised_verify":None,
            "advertised_declassify":None,
            "effective_verified_verify":None,
            "effective_verified_declassify":None,
        }

    age=epoch-certificate["issue_epoch"]
    fresh=age<=TTL
    if fresh:
        return {
            "status":"CERTIFIED_FRESH",
            "age":age,
            "fresh":True,
            "advertise":True,
            "advertised_verify":2,
            "advertised_declassify":3,
            "effective_verified_verify":2,
            "effective_verified_declassify":3,
        }
    return {
        "status":"CERTIFICATE_STALE",
        "age":age,
        "fresh":False,
        "advertise":False,
        "advertised_verify":None,
        "advertised_declassify":None,
        "effective_verified_verify":None,
        "effective_verified_declassify":None,
    }

def consistency_label(actual,certificate_state,certificate):
    if not certificate_state["fresh"]:
        return "NO_FRESH_INDEPENDENCE_CLAIM"
    if certificate_state["status"]=="SHARED_CONTROL_OBSERVED":
        return "FRESH_SHARED_CONTROL_EVIDENCE"
    if certificate_state["status"]!="CERTIFIED_FRESH":
        return "NO_FRESH_INDEPENDENCE_CLAIM"
    observed=certificate["observed_roots"]
    actual_distinct=len(set(actual.values()))==3
    observed_distinct=all(observed[p] is not None for p in PRINCIPALS) and len(set(observed.values()))==3
    if actual_distinct and observed_distinct:
        return "FRESH_CERTIFICATE_MATCHES_GROUND_TRUTH"
    return "FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED"

def event_receipt(timeline,event_id,epoch,action,actual,certificate):
    state=evaluate_certificate(epoch,certificate)
    metrics=actual_metrics(actual)
    body={
        "version":VERSION,
        "timeline":timeline,
        "event_id":event_id,
        "epoch":epoch,
        "action":action,
        "actual_root_map":dict(actual),
        **metrics,
        "certificate_issue_epoch":certificate["issue_epoch"],
        "certificate_age":state["age"],
        "certificate_ttl":TTL,
        "certificate_status":state["status"],
        "advertise_independent_quorum":state["advertise"],
        "advertised_verification_threshold":state["advertised_verify"],
        "advertised_declassification_threshold":state["advertised_declassify"],
        "effective_verified_verification_threshold":state["effective_verified_verify"],
        "effective_verified_declassification_threshold":state["effective_verified_declassify"],
        "last_observed_roots":dict(certificate["observed_roots"]),
        "evidence_fresh":state["fresh"],
        "ground_truth_consistency":consistency_label(actual,state,certificate),
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def stable_timeline():
    cert=issue_certificate(0,INDEPENDENT)
    out=[
        event_receipt("STABLE_INDEPENDENCE","S0",0,"ISSUE_CERTIFICATE",INDEPENDENT,cert),
        event_receipt("STABLE_INDEPENDENCE","S1",1,"NO_REVALIDATION",INDEPENDENT,cert),
        event_receipt("STABLE_INDEPENDENCE","S2",2,"NO_REVALIDATION",INDEPENDENT,cert),
        event_receipt("STABLE_INDEPENDENCE","S3",3,"CERTIFICATE_EXPIRED",INDEPENDENT,cert),
    ]
    cert=issue_certificate(4,INDEPENDENT)
    e=event_receipt("STABLE_INDEPENDENCE","S4",4,"REVALIDATED_INDEPENDENT",INDEPENDENT,cert)
    out.append(e)
    return out

def hidden_fusion_timeline():
    cert=issue_certificate(0,INDEPENDENT)
    out=[
        event_receipt("HIDDEN_FUSION_DURING_FRESH_WINDOW","F0",0,"ISSUE_CERTIFICATE",INDEPENDENT,cert),
        event_receipt("HIDDEN_FUSION_DURING_FRESH_WINDOW","F1",1,"NO_REVALIDATION",INDEPENDENT,cert),
        event_receipt("HIDDEN_FUSION_DURING_FRESH_WINDOW","F2",2,"HIDDEN_AB_FUSION_NO_REVALIDATION",SHARED_AB,cert),
        event_receipt("HIDDEN_FUSION_DURING_FRESH_WINDOW","F3",3,"CERTIFICATE_EXPIRED",SHARED_AB,cert),
    ]
    cert=issue_certificate(4,SHARED_AB)
    e=event_receipt("HIDDEN_FUSION_DURING_FRESH_WINDOW","F4",4,"REVALIDATION_DISCOVERED_SHARED_CONTROL",SHARED_AB,cert)
    out.append(e)
    return out

def false_advertisement_count(ttl):
    issue_epoch=0
    count=0
    for epoch in (2,3):
        if epoch-issue_epoch<=ttl:
            count+=1
    return count

def run_experiment():
    stable=stable_timeline()
    fused=hidden_fusion_timeline()
    sensitivity={str(ttl):false_advertisement_count(ttl) for ttl in (0,1,2,3)}
    body={
        "experiment":"NBG-AH43",
        "version":VERSION,
        "ttl_epochs":TTL,
        "stable_timeline":stable,
        "hidden_fusion_timeline":fused,
        "ttl_sensitivity_false_advertisement_epochs":sensitivity,
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    r=run_experiment()
    s=r["stable_timeline"]
    f=r["hidden_fusion_timeline"]
    checks=[]

    checks.extend([
        {"name":"suite:ttl_2","pass":r["ttl_epochs"]==2},
        {"name":"suite:stable_5_events","pass":len(s)==5},
        {"name":"suite:fused_5_events","pass":len(f)==5},
    ])

    checks.extend([
        {"name":"stable:statuses_exact","pass":[x["certificate_status"] for x in s]==[
            "CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFICATE_STALE","CERTIFIED_FRESH"
        ]},
        {"name":"stable:ages_exact","pass":[x["certificate_age"] for x in s]==[0,1,2,3,0]},
        {"name":"stable:advertisement_exact","pass":[x["advertise_independent_quorum"] for x in s]==[
            True,True,True,False,True
        ]},
        {"name":"stable:revalidation_action","pass":s[4]["action"]=="REVALIDATED_INDEPENDENT"},
        {"name":"stable:thresholds_always_actual_2_3","pass":all(
            x["actual_verification_root_threshold"]==2 and
            x["actual_declassification_root_threshold"]==3 for x in s
        )},
        {"name":"stable:reliability_exact","pass":all(
            abs(x["verification_reliability_p0_1"]-0.972)<1e-12 and
            abs(x["declassification_reliability_p0_1"]-0.729)<1e-12 for x in s
        )},
    ])

    checks.extend([
        {"name":"fused:statuses_exact","pass":[x["certificate_status"] for x in f]==[
            "CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFICATE_STALE","SHARED_CONTROL_OBSERVED"
        ]},
        {"name":"fused:advertisement_exact","pass":[x["advertise_independent_quorum"] for x in f]==[
            True,True,True,False,False
        ]},
        {"name":"fused:F2_control_label","pass":
            f[2]["ground_truth_consistency"]=="FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED"
        },
        {"name":"fused:F2_certificate_age2","pass":f[2]["certificate_age"]==2},
        {"name":"fused:F2_advertises_old_2_3","pass":
            f[2]["advertised_verification_threshold"]==2 and
            f[2]["advertised_declassification_threshold"]==3
        },
        {"name":"fused:F2_actual_is_1_2","pass":
            f[2]["actual_verification_root_threshold"]==1 and
            f[2]["actual_declassification_root_threshold"]==2
        },
        {"name":"fused:F3_stale_refuses","pass":
            f[3]["certificate_status"]=="CERTIFICATE_STALE" and
            not f[3]["advertise_independent_quorum"] and
            f[3]["advertised_verification_threshold"] is None and
            f[3]["advertised_declassification_threshold"] is None
        },
        {"name":"fused:F4_revalidation_discovers_shared","pass":
            f[4]["action"]=="REVALIDATION_DISCOVERED_SHARED_CONTROL" and
            f[4]["certificate_status"]=="SHARED_CONTROL_OBSERVED"
        },
        {"name":"fused:F4_effective_thresholds_1_2","pass":
            f[4]["effective_verified_verification_threshold"]==1 and
            f[4]["effective_verified_declassification_threshold"]==2
        },
        {"name":"fused:shared_reliability_exact","pass":all(
            abs(x["verification_reliability_p0_1"]-0.9)<1e-12 and
            abs(x["declassification_reliability_p0_1"]-0.81)<1e-12
            for x in f[2:]
        )},
    ])

    false_events=[
        x for x in f
        if x["advertise_independent_quorum"]
        and x["ground_truth_consistency"]=="FRESH_CERTIFICATE_BUT_GROUND_TRUTH_CHANGED"
    ]
    checks.extend([
        {"name":"window:exactly_one_false_advertisement_epoch","pass":len(false_events)==1},
        {"name":"window:false_event_is_F2","pass":false_events[0]["event_id"]=="F2"},
        {"name":"window:expiry_ends_old_advertisement","pass":
            f[2]["advertise_independent_quorum"] and not f[3]["advertise_independent_quorum"]
        },
    ])

    checks.extend([
        {"name":"status:stale_not_shared","pass":
            s[3]["certificate_status"]=="CERTIFICATE_STALE" and
            f[3]["certificate_status"]=="CERTIFICATE_STALE" and
            f[4]["certificate_status"]=="SHARED_CONTROL_OBSERVED"
        },
        {"name":"status:stale_has_no_effective_verified_thresholds","pass":
            f[3]["effective_verified_verification_threshold"] is None and
            f[3]["effective_verified_declassification_threshold"] is None
        },
    ])

    checks.extend([
        {"name":"ttl_sensitivity:exact","pass":
            r["ttl_sensitivity_false_advertisement_epochs"]=={"0":0,"1":0,"2":1,"3":2}
        },
        {"name":"ttl_sensitivity:monotone","pass":
            list(r["ttl_sensitivity_false_advertisement_epochs"].values())==[0,0,1,2]
        },
    ])

    checks.extend([
        {"name":"receipt:all_event_hashes_unique_stable","pass":
            len({x["receipt_hash"] for x in s})==5
        },
        {"name":"receipt:all_event_hashes_unique_fused","pass":
            len({x["receipt_hash"] for x in f})==5
        },
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(r)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":r["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **r,
        "verdict":"PASS_AH43" if passed==len(checks) else "FAIL_AH43",
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
        "ttl_epochs":TTL,
        "stable_statuses":[x["certificate_status"] for x in s],
        "fused_statuses":[x["certificate_status"] for x in f],
        "fused_ground_truth_labels":[x["ground_truth_consistency"] for x in f],
        "ttl_sensitivity":r["ttl_sensitivity_false_advertisement_epochs"],
        "receipt_hash":r["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH43":
        raise SystemExit(1)

if __name__=="__main__":
    main()