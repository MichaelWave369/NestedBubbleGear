#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path
import hashlib, json, math

VERSION="0.1.0"

L="Q_LIFETIME"
R="Q_RECENT"
A="Q_ADAPTIVE"

GRANTS=(
    ("HISTORIAN",L),
    ("OPERATOR",R),
    ("ADAPTIVE_CONTROLLER",A),
    ("AUDITOR",L),
    ("AUDITOR",R),
)

COMMON_ONLY="COMMON_ONLY"
TRIAGE="TRIAGE"
FULL_STATUS="FULL_STATUS"

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
ANTI_BATCH=(1300,600,600,0)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)
ANTI_ARCHIVE=(52000,24000,24000,0)
LAMBDA=Fraction(1,10)
N_MIN=400

def add_tables(*tables):
    return tuple(sum(xs) for xs in zip(*tables))

def stats(table):
    vals=[float(x) for x in table]
    n00,n01,n10,n11=vals
    N=sum(vals)
    p1=(n10+n11)/N
    p3=(n01+n11)/N
    p11=n11/N
    delta=p11-p1*p3
    rows=(n00+n01,n10+n11)
    cols=(n00+n10,n01+n11)
    obs=((n00,n01),(n10,n11))
    chi2=0.0
    for i in range(2):
        for j in range(2):
            expected=rows[i]*cols[j]/N
            chi2+=(obs[i][j]-expected)**2/expected
    p_value=math.erfc(math.sqrt(chi2/2.0))
    return {"N":N,"p1":p1,"p3":p3,"p11":p11,"delta":delta,"chi2":chi2,"chi2_p_value":p_value}

def classify(s):
    if s["N"]<N_MIN:
        return "INSUFFICIENT_EVIDENCE"
    if s["chi2_p_value"]<=1e-3 and s["delta"]>=0.02:
        return "COMMON_MODE_EVIDENCE"
    if s["chi2_p_value"]<=1e-3 and s["delta"]<=-0.02:
        return "DEPENDENCE_OTHER_DIRECTION"
    if s["chi2_p_value"]>=0.10 and abs(s["delta"])<=0.01:
        return "INDEPENDENCE_COMPATIBLE"
    return "INSUFFICIENT_EVIDENCE"

def discounted_final(archive,batches):
    d=tuple(Fraction(x,1) for x in archive)
    for batch in batches:
        d=tuple(LAMBDA*x+Fraction(y,1) for x,y in zip(d,batch))
    return d

def panel(archive,batches):
    lifetime=add_tables(archive,*batches)
    recent=add_tables(*batches[-2:]) if len(batches)>=2 else batches[-1]
    adaptive=discounted_final(archive,batches)
    return {
        "lifetime":classify(stats(lifetime)),
        "recent":classify(stats(recent)),
        "adaptive":classify(stats(adaptive)),
    }

def arbitration(p):
    life=p["lifetime"]; recent=p["recent"]
    if life==recent:
        return "CONSISTENT"
    if recent=="COMMON_MODE_EVIDENCE" and life!="COMMON_MODE_EVIDENCE":
        return "RECENT_RISK_ONLY"
    if life=="COMMON_MODE_EVIDENCE" and recent!="COMMON_MODE_EVIDENCE":
        return "LIFETIME_RISK_ONLY"
    return "HORIZON_CONFLICT"

def build_panels():
    return {
        "A":panel(INDEP_ARCHIVE,(I_BATCH,C_BATCH)),
        "B":panel(INDEP_ARCHIVE,(I_BATCH,C_BATCH,C_BATCH,I_BATCH)),
        "C":panel(INDEP_ARCHIVE,(I_BATCH,I_BATCH)),
        "D":panel(COMMON_ARCHIVE,(I_BATCH,I_BATCH)),
        "E":panel(COMMON_ARCHIVE,(C_BATCH,C_BATCH)),
        "F":panel(INDEP_ARCHIVE,(C_BATCH,C_BATCH,I_BATCH,I_BATCH)),
        "G":panel(INDEP_ARCHIVE,(I_BATCH,I_BATCH,C_BATCH,C_BATCH)),
        "H_ANTI_ALL":panel(ANTI_ARCHIVE,(ANTI_BATCH,ANTI_BATCH)),
        "I_ANTI_ARCHIVE_RECENT_CLEAN":panel(ANTI_ARCHIVE,(I_BATCH,I_BATCH)),
        "J_RECENT_ANTI":panel(INDEP_ARCHIVE,(ANTI_BATCH,ANTI_BATCH)),
    }

def target_multi(p):
    return (p["lifetime"],p["recent"],p["adaptive"],arbitration(p))

def transform(status,mode):
    if mode==COMMON_ONLY:
        return "COMMON" if status=="COMMON_MODE_EVIDENCE" else "NOT_COMMON"
    if mode==TRIAGE:
        if status=="COMMON_MODE_EVIDENCE":
            return "COMMON"
        if status=="INSUFFICIENT_EVIDENCE":
            return "UNKNOWN"
        return "KNOWN_NON_COMMON"
    if mode==FULL_STATUS:
        return status
    raise KeyError(mode)

def horizon_status(p,contract):
    if contract==L: return p["lifetime"]
    if contract==R: return p["recent"]
    if contract==A: return p["adaptive"]
    raise KeyError(contract)

def snapshot(p,profile):
    return tuple(
        (actor,contract,transform(horizon_status(p,contract),profile[i]))
        for i,(actor,contract) in enumerate(GRANTS)
    )

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for t,d in zip(targets,descriptors):
        groups[d].append(t)
    n=len(targets)
    return sum((len(g)/n)*entropy(g) for g in groups.values())

def descriptor_stats(panels,profile):
    ps=list(panels.values())
    target=[target_multi(p) for p in ps]
    desc=[snapshot(p,profile) for p in ps]
    return {
        "residual_privacy_bits":conditional_entropy(target,desc),
        "descriptor_classes":len(set(desc)),
    }

def ledger_stats(panels,ledger_profiles):
    ps=list(panels.values())
    target=[target_multi(p) for p in ps]
    desc=[
        tuple(snapshot(p,profile) for profile in ledger_profiles)
        for p in ps
    ]
    return {
        "residual_privacy_bits":conditional_entropy(target,desc),
        "descriptor_classes":len(set(desc)),
    }

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

EVENTS=(
    {
        "event_id":"E0",
        "operation":"INITIAL_RELEASE",
        "authority":(COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY),
        "current":(COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY),
        "emit":True,
    },
    {
        "event_id":"E1",
        "operation":"GRANT_H_L_TRIAGE_AND_REFRESH",
        "authority":(TRIAGE,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY),
        "current":(TRIAGE,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY,COMMON_ONLY),
        "emit":True,
    },
    {
        "event_id":"E2",
        "operation":"GRANT_ADAPTIVE_TRIAGE_AND_REFRESH",
        "authority":(TRIAGE,COMMON_ONLY,TRIAGE,COMMON_ONLY,COMMON_ONLY),
        "current":(TRIAGE,COMMON_ONLY,TRIAGE,COMMON_ONLY,COMMON_ONLY),
        "emit":True,
    },
    {
        "event_id":"E3",
        "operation":"GRANT_ADAPTIVE_FULL_AND_REFRESH",
        "authority":(TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "current":(TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "emit":True,
    },
    {
        "event_id":"E4",
        "operation":"REVOKE_H_L_TRIAGE_ONLY",
        "authority":(COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "current":(TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "emit":False,
    },
    {
        "event_id":"E5",
        "operation":"DOWNGRADE_H_L_CURRENT_AND_REFRESH",
        "authority":(COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "current":(COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY),
        "emit":True,
    },
)

def run_sequence():
    panels=build_panels()
    ledger_profiles=[]
    receipts=[]

    for e in EVENTS:
        if e["emit"]:
            ledger_profiles.append(e["current"])

        auth=descriptor_stats(panels,e["authority"])
        cur=descriptor_stats(panels,e["current"])
        led=ledger_stats(panels,ledger_profiles)

        if e["authority"]==e["current"]:
            alignment="AUTHORITY_AND_CURRENT_ALIGNED"
        else:
            alignment="REVOKED_BUT_STALE_DISCLOSURE_PRESENT"

        body={
            "version":VERSION,
            "event_id":e["event_id"],
            "operation":e["operation"],
            "authority_profile":list(e["authority"]),
            "current_profile":list(e["current"]),
            "release_snapshot_emitted":e["emit"],
            "ledger_snapshot_count":len(ledger_profiles),
            "authority_residual_privacy_bits":auth["residual_privacy_bits"],
            "current_residual_privacy_bits":cur["residual_privacy_bits"],
            "ledger_residual_privacy_bits":led["residual_privacy_bits"],
            "authority_descriptor_classes":auth["descriptor_classes"],
            "current_descriptor_classes":cur["descriptor_classes"],
            "ledger_descriptor_classes":led["descriptor_classes"],
            "alignment_status":alignment,
        }
        body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
        receipts.append(body)

    return receipts

def main():
    panels=build_panels()
    receipts=run_sequence()
    checks=[]

    expected_auth=(
        1.160964047443681,
        0.6754887502163468,
        0.4,
        0.0,
        0.4,
        0.4,
    )
    expected_cur=(
        1.160964047443681,
        0.6754887502163468,
        0.4,
        0.0,
        0.0,
        0.4,
    )
    expected_ledger=(
        1.160964047443681,
        0.6754887502163468,
        0.4,
        0.0,
        0.0,
        0.0,
    )
    expected_auth_classes=(5,6,7,9,7,7)
    expected_cur_classes=(5,6,7,9,9,7)
    expected_ledger_classes=(5,6,7,9,9,9)

    checks.extend([
        {"name":"sequence:6_events","pass":len(receipts)==6},
        {"name":"sequence:authority_privacy_exact","pass":all(
            abs(r["authority_residual_privacy_bits"]-x)<1e-12
            for r,x in zip(receipts,expected_auth)
        )},
        {"name":"sequence:current_privacy_exact","pass":all(
            abs(r["current_residual_privacy_bits"]-x)<1e-12
            for r,x in zip(receipts,expected_cur)
        )},
        {"name":"sequence:ledger_privacy_exact","pass":all(
            abs(r["ledger_residual_privacy_bits"]-x)<1e-12
            for r,x in zip(receipts,expected_ledger)
        )},
        {"name":"sequence:authority_classes_exact","pass":tuple(r["authority_descriptor_classes"] for r in receipts)==expected_auth_classes},
        {"name":"sequence:current_classes_exact","pass":tuple(r["current_descriptor_classes"] for r in receipts)==expected_cur_classes},
        {"name":"sequence:ledger_classes_exact","pass":tuple(r["ledger_descriptor_classes"] for r in receipts)==expected_ledger_classes},
    ])

    # Collapse path.
    checks.extend([
        {"name":"collapse:E2_positive","pass":receipts[2]["current_residual_privacy_bits"]>0},
        {"name":"collapse:E3_zero","pass":abs(receipts[3]["current_residual_privacy_bits"])<1e-12},
        {"name":"collapse:E3_ledger_zero","pass":abs(receipts[3]["ledger_residual_privacy_bits"])<1e-12},
    ])

    # Revocation-only witness.
    e4=receipts[4]
    checks.extend([
        {"name":"revoke:E4_authority_restored","pass":abs(e4["authority_residual_privacy_bits"]-0.4)<1e-12},
        {"name":"revoke:E4_current_still_collapsed","pass":abs(e4["current_residual_privacy_bits"])<1e-12},
        {"name":"revoke:E4_ledger_still_collapsed","pass":abs(e4["ledger_residual_privacy_bits"])<1e-12},
        {"name":"revoke:E4_no_snapshot","pass":not e4["release_snapshot_emitted"] and e4["ledger_snapshot_count"]==4},
        {"name":"revoke:E4_alignment_status","pass":e4["alignment_status"]=="REVOKED_BUT_STALE_DISCLOSURE_PRESENT"},
    ])

    # Explicit downgrade witness.
    e5=receipts[5]
    checks.extend([
        {"name":"downgrade:E5_current_restored","pass":abs(e5["current_residual_privacy_bits"]-0.4)<1e-12},
        {"name":"downgrade:E5_authority_current_equal","pass":e5["authority_profile"]==e5["current_profile"]},
        {"name":"downgrade:E5_alignment_status","pass":e5["alignment_status"]=="AUTHORITY_AND_CURRENT_ALIGNED"},
        {"name":"downgrade:E5_ledger_still_zero","pass":abs(e5["ledger_residual_privacy_bits"])<1e-12},
        {"name":"downgrade:E5_snapshot_appended","pass":e5["release_snapshot_emitted"] and e5["ledger_snapshot_count"]==5},
    ])

    # Fresh vs historical observer.
    fresh=descriptor_stats(panels,tuple(e5["current_profile"]))
    ledger_profiles=[tuple(EVENTS[i]["current"]) for i in (0,1,2,3,5)]
    history=ledger_stats(panels,ledger_profiles)
    projected=ledger_stats(panels,[tuple(e5["current_profile"])])
    checks.extend([
        {"name":"observer:fresh_0p4","pass":abs(fresh["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"observer:history_zero","pass":abs(history["residual_privacy_bits"])<1e-12},
        {"name":"observer:projected_control_0p4","pass":abs(projected["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"observer:fresh_vs_history_differ","pass":fresh["residual_privacy_bits"]>history["residual_privacy_bits"]+1e-12},
    ])

    # Ledger monotonicity, current recovery.
    lp=[r["ledger_residual_privacy_bits"] for r in receipts]
    cp=[r["current_residual_privacy_bits"] for r in receipts]
    checks.extend([
        {"name":"ledger:privacy_nonincreasing","pass":all(lp[i+1]<=lp[i]+1e-12 for i in range(len(lp)-1))},
        {"name":"ledger:never_recovers_after_collapse","pass":all(abs(x)<1e-12 for x in lp[3:])},
        {"name":"current:privacy_recovers_after_downgrade","pass":abs(cp[3])<1e-12 and abs(cp[4])<1e-12 and cp[5]>0},
    ])

    # Profile identities.
    checks.extend([
        {"name":"profile:E3_minimal_path_exact","pass":receipts[3]["current_profile"]==[
            TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY
        ]},
        {"name":"profile:E5_downgraded_exact","pass":receipts[5]["current_profile"]==[
            COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY
        ]},
    ])

    # Replay exact.
    replay=run_sequence()
    checks.extend([
        {"name":"replay:sequence_exact","pass":canonical(receipts)==canonical(replay)},
        {"name":"replay:receipt_hashes_exact","pass":
            [r["receipt_hash"] for r in receipts]==[r["receipt_hash"] for r in replay]
        },
    ])

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH36",
        "version":VERSION,
        "verdict":"PASS_AH36" if passed==len(checks) else "FAIL_AH36",
        "checks_passed":passed,
        "checks_total":len(checks),
        "events":receipts,
        "fresh_observer":{
            "residual_privacy_bits":fresh["residual_privacy_bits"],
            "descriptor_classes":fresh["descriptor_classes"],
        },
        "historical_observer":{
            "residual_privacy_bits":history["residual_privacy_bits"],
            "descriptor_classes":history["descriptor_classes"],
        },
        "history_projection_control":{
            "residual_privacy_bits":projected["residual_privacy_bits"],
            "descriptor_classes":projected["descriptor_classes"],
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "authority_privacy":[r["authority_residual_privacy_bits"] for r in receipts],
        "current_privacy":[r["current_residual_privacy_bits"] for r in receipts],
        "ledger_privacy":[r["ledger_residual_privacy_bits"] for r in receipts],
        "alignment":[r["alignment_status"] for r in receipts],
        "fresh_observer":result["fresh_observer"],
        "historical_observer":result["historical_observer"],
        "history_projection_control":result["history_projection_control"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH36":
        raise SystemExit(1)

if __name__=="__main__":
    main()
