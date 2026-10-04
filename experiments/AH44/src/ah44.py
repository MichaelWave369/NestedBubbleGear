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

CONTROLS={
    "TTL_ONLY":{
        "actual_change_epoch":2,
        "event_epoch":None,
        "event_provenance":None,
        "false_positive":False,
    },
    "TRUSTED_IMMEDIATE":{
        "actual_change_epoch":2,
        "event_epoch":2,
        "event_provenance":"TRUSTED",
        "false_positive":False,
    },
    "TRUSTED_DELAYED_1":{
        "actual_change_epoch":2,
        "event_epoch":3,
        "event_provenance":"TRUSTED",
        "false_positive":False,
    },
    "MISSING_EVENT":{
        "actual_change_epoch":2,
        "event_epoch":None,
        "event_provenance":None,
        "false_positive":False,
    },
    "FALSE_POSITIVE_TRUSTED":{
        "actual_change_epoch":None,
        "event_epoch":2,
        "event_provenance":"TRUSTED",
        "false_positive":True,
    },
    "UNTRUSTED_IMMEDIATE":{
        "actual_change_epoch":2,
        "event_epoch":2,
        "event_provenance":"UNTRUSTED",
        "false_positive":False,
    },
}

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def roots(actual):
    return tuple(sorted(set(actual.values())))

def controlled_seats(root_coalition,actual):
    rs=set(root_coalition)
    return tuple(sorted(SEAT_OWNER[p] for p in PRINCIPALS if actual[p] in rs))

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

def actual_at(control,epoch):
    change=CONTROLS[control]["actual_change_epoch"]
    if change is not None and epoch>=change:
        return SHARED_AB
    return INDEPENDENT

def event_at(control,epoch):
    cfg=CONTROLS[control]
    if cfg["event_epoch"]!=epoch:
        return {
            "delivered":False,
            "provenance":None,
            "action":"NO_EVENT",
        }
    prov=cfg["event_provenance"]
    if prov=="TRUSTED":
        return {
            "delivered":True,
            "provenance":"TRUSTED",
            "action":"ACCEPT_TRUSTED_CHANGE_EVENT",
        }
    return {
        "delivered":True,
        "provenance":"UNTRUSTED",
        "action":"REFUSE_UNTRUSTED_CHANGE_EVENT",
    }

def timeline(control):
    cfg=CONTROLS[control]
    revoked=False
    issue_epoch=0
    rows=[]

    for epoch in range(5):
        actual=actual_at(control,epoch)
        ev=event_at(control,epoch)

        if ev["action"]=="ACCEPT_TRUSTED_CHANGE_EVENT":
            revoked=True

        if epoch==4:
            # Revalidation replaces all prior certificate/event state.
            if len(roots(actual))==3:
                status="CERTIFIED_FRESH"
                advertise=True
                adv_v=2
                adv_d=3
                effective_v=2
                effective_d=3
                revalidation="REVALIDATED_INDEPENDENT"
                issue_epoch=4
                age=0
                revoked=False
            else:
                status="SHARED_CONTROL_OBSERVED"
                advertise=False
                adv_v=None
                adv_d=None
                effective_v=1
                effective_d=2
                revalidation="REVALIDATION_DISCOVERED_SHARED_CONTROL"
                issue_epoch=4
                age=0
                revoked=False
        else:
            age=epoch-issue_epoch
            revalidation="NONE"
            if revoked:
                status="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
                advertise=False
                adv_v=None
                adv_d=None
                effective_v=None
                effective_d=None
            elif age<=TTL:
                status="CERTIFIED_FRESH"
                advertise=True
                adv_v=2
                adv_d=3
                effective_v=2
                effective_d=3
            else:
                status="CERTIFICATE_STALE"
                advertise=False
                adv_v=None
                adv_d=None
                effective_v=None
                effective_d=None

        metrics=actual_metrics(actual)
        false_advertisement=(
            len(roots(actual))<3 and advertise
        )
        unnecessary_refusal=(
            len(roots(actual))==3 and not advertise and epoch<4
        )

        body={
            "version":VERSION,
            "control":control,
            "epoch":epoch,
            "actual_root_map":dict(actual),
            **metrics,
            "certificate_issue_epoch":issue_epoch,
            "certificate_age":age,
            "certificate_ttl":TTL,
            "certificate_status":status,
            "advertise_independent_quorum":advertise,
            "advertised_verification_threshold":adv_v,
            "advertised_declassification_threshold":adv_d,
            "effective_verified_verification_threshold":effective_v,
            "effective_verified_declassification_threshold":effective_d,
            "event_delivered":ev["delivered"],
            "event_provenance":ev["provenance"],
            "event_action":ev["action"],
            "revalidation_action":revalidation,
            "false_advertisement":false_advertisement,
            "unnecessary_refusal":unnecessary_refusal,
        }
        body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
        rows.append(body)
    return rows

def false_advertisement_count(rows):
    return sum(r["false_advertisement"] for r in rows)

def unnecessary_refusal_count(rows):
    return sum(r["unnecessary_refusal"] for r in rows)

def revocation_latency(control,rows):
    change=CONTROLS[control]["actual_change_epoch"]
    if change is None:
        return None
    for r in rows:
        if r["epoch"]>=change and not r["advertise_independent_quorum"]:
            return r["epoch"]-change
    return None

def run_experiment():
    tls={name:timeline(name) for name in CONTROLS}
    summaries={}
    for name,rows in tls.items():
        summaries[name]={
            "false_advertisement_epochs":false_advertisement_count(rows),
            "unnecessary_refusal_epochs":unnecessary_refusal_count(rows),
            "revocation_latency_epochs":revocation_latency(name,rows),
            "status_sequence":[r["certificate_status"] for r in rows],
            "advertisement_sequence":[r["advertise_independent_quorum"] for r in rows],
        }
    body={
        "experiment":"NBG-AH44",
        "version":VERSION,
        "ttl_epochs":TTL,
        "controls":tls,
        "summaries":summaries,
        "arc_status":"TEMPORAL_CERTIFICATION_ARC_COMPLETE_MOVE_TO_META_QUALIFICATION",
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    r=run_experiment()
    c=r["controls"]
    s=r["summaries"]
    checks=[]

    checks.extend([
        {"name":"suite:6_controls","pass":len(c)==6},
        {"name":"suite:five_epochs_each","pass":all(len(x)==5 for x in c.values())},
        {"name":"suite:ttl_2","pass":r["ttl_epochs"]==2},
    ])

    expected_false={
        "TTL_ONLY":1,
        "TRUSTED_IMMEDIATE":0,
        "TRUSTED_DELAYED_1":1,
        "MISSING_EVENT":1,
        "FALSE_POSITIVE_TRUSTED":0,
        "UNTRUSTED_IMMEDIATE":1,
    }
    for name,n in expected_false.items():
        checks.append({
            "name":f"false_window:{name}",
            "pass":s[name]["false_advertisement_epochs"]==n
        })

    expected_latency={
        "TTL_ONLY":1,
        "TRUSTED_IMMEDIATE":0,
        "TRUSTED_DELAYED_1":1,
        "MISSING_EVENT":1,
        "UNTRUSTED_IMMEDIATE":1,
    }
    for name,n in expected_latency.items():
        checks.append({
            "name":f"latency:{name}",
            "pass":s[name]["revocation_latency_epochs"]==n
        })

    checks.extend([
        {"name":"immediate:t2_revoked_pending","pass":
            c["TRUSTED_IMMEDIATE"][2]["certificate_status"]=="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
        },
        {"name":"immediate:t2_no_advertisement","pass":
            not c["TRUSTED_IMMEDIATE"][2]["advertise_independent_quorum"]
        },
        {"name":"immediate:t2_not_shared_certification","pass":
            c["TRUSTED_IMMEDIATE"][2]["certificate_status"]!="SHARED_CONTROL_OBSERVED"
        },
        {"name":"immediate:t4_shared_after_revalidation","pass":
            c["TRUSTED_IMMEDIATE"][4]["certificate_status"]=="SHARED_CONTROL_OBSERVED" and
            c["TRUSTED_IMMEDIATE"][4]["revalidation_action"]=="REVALIDATION_DISCOVERED_SHARED_CONTROL"
        },
    ])

    checks.extend([
        {"name":"delayed:t2_false_advertisement","pass":
            c["TRUSTED_DELAYED_1"][2]["false_advertisement"]
        },
        {"name":"delayed:t3_revoked_pending","pass":
            c["TRUSTED_DELAYED_1"][3]["certificate_status"]=="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
        },
    ])

    checks.extend([
        {"name":"false_positive:two_unnecessary_refusals","pass":
            s["FALSE_POSITIVE_TRUSTED"]["unnecessary_refusal_epochs"]==2
        },
        {"name":"false_positive:t2_t3_revoked","pass":
            [c["FALSE_POSITIVE_TRUSTED"][i]["certificate_status"] for i in (2,3)]==
            ["INDEPENDENCE_REVOKED_PENDING_REVALIDATION"]*2
        },
        {"name":"false_positive:t4_revalidates_independent","pass":
            c["FALSE_POSITIVE_TRUSTED"][4]["certificate_status"]=="CERTIFIED_FRESH" and
            c["FALSE_POSITIVE_TRUSTED"][4]["revalidation_action"]=="REVALIDATED_INDEPENDENT"
        },
        {"name":"false_positive:no_false_independence","pass":
            s["FALSE_POSITIVE_TRUSTED"]["false_advertisement_epochs"]==0
        },
    ])

    checks.extend([
        {"name":"untrusted:t2_refused","pass":
            c["UNTRUSTED_IMMEDIATE"][2]["event_action"]=="REFUSE_UNTRUSTED_CHANGE_EVENT"
        },
        {"name":"untrusted:t2_still_certified","pass":
            c["UNTRUSTED_IMMEDIATE"][2]["certificate_status"]=="CERTIFIED_FRESH" and
            c["UNTRUSTED_IMMEDIATE"][2]["advertise_independent_quorum"]
        },
        {"name":"untrusted:t3_stale","pass":
            c["UNTRUSTED_IMMEDIATE"][3]["certificate_status"]=="CERTIFICATE_STALE"
        },
    ])

    checks.extend([
        {"name":"ttl_only:matches_missing_false_window","pass":
            s["TTL_ONLY"]["false_advertisement_epochs"]==
            s["MISSING_EVENT"]["false_advertisement_epochs"]==1
        },
        {"name":"ttl_only:status_sequence","pass":
            s["TTL_ONLY"]["status_sequence"]==[
                "CERTIFIED_FRESH","CERTIFIED_FRESH","CERTIFIED_FRESH",
                "CERTIFICATE_STALE","SHARED_CONTROL_OBSERVED"
            ]
        },
    ])

    checks.extend([
        {"name":"actual_metrics:independent_exact","pass":
            c["FALSE_POSITIVE_TRUSTED"][0]["actual_verification_root_threshold"]==2 and
            c["FALSE_POSITIVE_TRUSTED"][0]["actual_declassification_root_threshold"]==3 and
            abs(c["FALSE_POSITIVE_TRUSTED"][0]["verification_reliability_p0_1"]-0.972)<1e-12 and
            abs(c["FALSE_POSITIVE_TRUSTED"][0]["declassification_reliability_p0_1"]-0.729)<1e-12
        },
        {"name":"actual_metrics:shared_exact","pass":
            c["TTL_ONLY"][2]["actual_verification_root_threshold"]==1 and
            c["TTL_ONLY"][2]["actual_declassification_root_threshold"]==2 and
            abs(c["TTL_ONLY"][2]["verification_reliability_p0_1"]-0.9)<1e-12 and
            abs(c["TTL_ONLY"][2]["declassification_reliability_p0_1"]-0.81)<1e-12
        },
    ])

    checks.extend([
        {"name":"arc:explicit_meta_transition","pass":
            r["arc_status"]=="TEMPORAL_CERTIFICATION_ARC_COMPLETE_MOVE_TO_META_QUALIFICATION"
        },
        {"name":"receipts:unique_per_control","pass":all(
            len({x["receipt_hash"] for x in rows})==5 for rows in c.values()
        )},
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(r)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":r["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(x["pass"] for x in checks)
    payload={
        **r,
        "verdict":"PASS_AH44" if passed==len(checks) else "FAIL_AH44",
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
        "summaries":s,
        "arc_status":r["arc_status"],
        "receipt_hash":r["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH44":
        raise SystemExit(1)

if __name__=="__main__":
    main()
