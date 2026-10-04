#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from itertools import combinations
from pathlib import Path
import hashlib, json, math

VERSION="0.1.0"

SEATS=("A","B","C")
PRINCIPALS=("PRINCIPAL_A","PRINCIPAL_B","PRINCIPAL_C")

INDEPENDENT={
    "PRINCIPAL_A":("A",),
    "PRINCIPAL_B":("B",),
    "PRINCIPAL_C":("C",),
}

FUSED_AB={
    "PRINCIPAL_A":("A","B"),
    "PRINCIPAL_B":("C",),
    "PRINCIPAL_C":(),
}

VERIFY_THRESHOLD=2
STRICT_DECLASSIFY_THRESHOLD=3
WEAK_DECLASSIFY_THRESHOLD=2
P_FAIL=0.1

L="Q_LIFETIME"
R="Q_RECENT"
ADAPT="Q_ADAPTIVE"
GRANTS=(
    ("HISTORIAN",L),
    ("OPERATOR",R),
    ("ADAPTIVE_CONTROLLER",ADAPT),
    ("AUDITOR",L),
    ("AUDITOR",R),
)
COMMON_ONLY="COMMON_ONLY"
TRIAGE="TRIAGE"
FULL_STATUS="FULL_STATUS"
EPOCH0_PROFILE=(TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY)
EPOCH1_PROFILE=(COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY)

VERIFY_RECEIPT={
    "epoch":0,
    "verification":"VERIFIED",
    "action":"VERIFY_ONLY",
    "schema":"AH41-E0",
}

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
ANTI_BATCH=(1300,600,600,0)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)
ANTI_ARCHIVE=(52000,24000,24000,0)
LAMBDA=Fraction(1,10)
N_MIN=400

def physical_coalitions():
    return tuple(
        c
        for n in range(len(PRINCIPALS)+1)
        for c in combinations(PRINCIPALS,n)
    )

def controlled_seats(coalition,ownership):
    s=set()
    for p in coalition:
        s.update(ownership[p])
    return tuple(x for x in SEATS if x in s)

def capable(coalition,ownership,threshold):
    return len(controlled_seats(coalition,ownership))>=threshold

def minimal_capable(ownership,threshold):
    cs=physical_coalitions()
    good=[c for c in cs if capable(c,ownership,threshold)]
    return tuple(
        c for c in good
        if not any(set(d)<set(c) for d in good)
    )

def available(down,ownership,threshold):
    up=tuple(p for p in PRINCIPALS if p not in set(down))
    return capable(up,ownership,threshold)

def minimal_failure_cuts(ownership,threshold):
    cs=physical_coalitions()
    bad=[c for c in cs if not available(c,ownership,threshold)]
    return tuple(
        c for c in bad
        if not any(set(d)<set(c) for d in bad)
    )

def reliability(ownership,threshold,p=P_FAIL):
    total=0.0
    for n in range(len(PRINCIPALS)+1):
        for down in combinations(PRINCIPALS,n):
            prob=(p**n)*((1-p)**(len(PRINCIPALS)-n))
            if available(down,ownership,threshold):
                total+=prob
    return total

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
    return {"N":N,"delta":delta,"chi2_p_value":p_value}

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
    if contract==ADAPT: return p["adaptive"]
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

def privacy_for_profile(profile):
    panels=build_panels()
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    desc=[snapshot(p,profile) for p in ps]
    return conditional_entropy(targets,desc)

def verify_public_privacy():
    panels=build_panels()
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    receipt=json.dumps(VERIFY_RECEIPT,sort_keys=True,separators=(",",":"))
    z1=[snapshot(p,EPOCH1_PROFILE) for p in ps]
    desc=list(zip([receipt]*len(ps),z1))
    return conditional_entropy(targets,desc)

def strict_action(coalition,ownership,action):
    if action=="VERIFY_ONLY":
        if capable(coalition,ownership,VERIFY_THRESHOLD):
            return {"authority":"ALLOW","public_output":"MEDIATED_VERIFIED"}
        return {"authority":"DENY","refusal":"REFUSE_VERIFICATION_QUORUM"}
    if action=="DECLASSIFY_EPOCH0":
        if capable(coalition,ownership,STRICT_DECLASSIFY_THRESHOLD):
            return {"authority":"ALLOW","public_output":"EPOCH0"}
        return {"authority":"DENY","refusal":"REFUSE_DECLASSIFICATION_QUORUM"}
    raise KeyError(action)

def weak_declass_action(coalition,ownership):
    if capable(coalition,ownership,WEAK_DECLASSIFY_THRESHOLD):
        return {"authority":"ALLOW","public_output":"EPOCH0"}
    return {"authority":"DENY","refusal":"REFUSE_DECLASSIFICATION_QUORUM"}

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def run_experiment():
    indep_verify=minimal_capable(INDEPENDENT,VERIFY_THRESHOLD)
    fused_verify=minimal_capable(FUSED_AB,VERIFY_THRESHOLD)
    indep_declass=minimal_capable(INDEPENDENT,STRICT_DECLASSIFY_THRESHOLD)
    fused_declass=minimal_capable(FUSED_AB,STRICT_DECLASSIFY_THRESHOLD)
    indep_weak=minimal_capable(INDEPENDENT,WEAK_DECLASSIFY_THRESHOLD)
    fused_weak=minimal_capable(FUSED_AB,WEAK_DECLASSIFY_THRESHOLD)

    indep_vcuts=minimal_failure_cuts(INDEPENDENT,VERIFY_THRESHOLD)
    fused_vcuts=minimal_failure_cuts(FUSED_AB,VERIFY_THRESHOLD)
    indep_dcuts=minimal_failure_cuts(INDEPENDENT,STRICT_DECLASSIFY_THRESHOLD)
    fused_dcuts=minimal_failure_cuts(FUSED_AB,STRICT_DECLASSIFY_THRESHOLD)

    malicious=strict_action(("PRINCIPAL_A","PRINCIPAL_B"),INDEPENDENT,"DECLASSIFY_EPOCH0")
    fused_weak_single=weak_declass_action(("PRINCIPAL_A",),FUSED_AB)

    result={
        "experiment":"NBG-AH41",
        "version":VERSION,
        "ownership":{
            "INDEPENDENT":{k:list(v) for k,v in INDEPENDENT.items()},
            "FUSED_AB":{k:list(v) for k,v in FUSED_AB.items()},
        },
        "verification":{
            "independent_minimal_capable":[list(x) for x in indep_verify],
            "fused_minimal_capable":[list(x) for x in fused_verify],
            "independent_physical_threshold":min(map(len,indep_verify)),
            "fused_physical_threshold":min(map(len,fused_verify)),
            "independent_failure_cuts":[list(x) for x in indep_vcuts],
            "fused_failure_cuts":[list(x) for x in fused_vcuts],
            "independent_reliability_p0_1":reliability(INDEPENDENT,VERIFY_THRESHOLD),
            "fused_reliability_p0_1":reliability(FUSED_AB,VERIFY_THRESHOLD),
            "public_privacy_bits":verify_public_privacy(),
        },
        "strict_declassification":{
            "independent_minimal_capable":[list(x) for x in indep_declass],
            "fused_minimal_capable":[list(x) for x in fused_declass],
            "independent_physical_threshold":min(map(len,indep_declass)),
            "fused_physical_threshold":min(map(len,fused_declass)),
            "independent_failure_cuts":[list(x) for x in indep_dcuts],
            "fused_failure_cuts":[list(x) for x in fused_dcuts],
            "independent_reliability_p0_1":reliability(INDEPENDENT,STRICT_DECLASSIFY_THRESHOLD),
            "fused_reliability_p0_1":reliability(FUSED_AB,STRICT_DECLASSIFY_THRESHOLD),
            "public_privacy_bits":privacy_for_profile(EPOCH0_PROFILE),
        },
        "weak_declassification_negative_control":{
            "independent_minimal_capable":[list(x) for x in indep_weak],
            "fused_minimal_capable":[list(x) for x in fused_weak],
            "independent_physical_threshold":min(map(len,indep_weak)),
            "fused_physical_threshold":min(map(len,fused_weak)),
            "fused_single_principal_action":fused_weak_single,
            "status":"ROLE_FUSION_COLLAPSES_WEAK_DECLASSIFICATION_TO_SINGLE_PRINCIPAL",
        },
        "malicious_upgrade_attempt":{
            "coalition":["PRINCIPAL_A","PRINCIPAL_B"],
            "ownership":"INDEPENDENT",
            "requested_action":"DECLASSIFY_EPOCH0",
            "result":malicious,
            "observer_privacy_bits":verify_public_privacy(),
        },
    }
    result["receipt_hash"]=hashlib.sha256(canonical(result)).hexdigest()
    return result

def main():
    r=run_experiment()
    v=r["verification"]
    d=r["strict_declassification"]
    w=r["weak_declassification_negative_control"]
    m=r["malicious_upgrade_attempt"]
    checks=[]

    checks.extend([
        {"name":"suite:8_physical_coalitions","pass":len(physical_coalitions())==8},
        {"name":"verify:independent_minimal_exact","pass":v["independent_minimal_capable"]==[
            ["PRINCIPAL_A","PRINCIPAL_B"],
            ["PRINCIPAL_A","PRINCIPAL_C"],
            ["PRINCIPAL_B","PRINCIPAL_C"],
        ]},
        {"name":"verify:fused_minimal_single_A","pass":v["fused_minimal_capable"]==[
            ["PRINCIPAL_A"]
        ]},
        {"name":"verify:threshold_2_to_1","pass":
            v["independent_physical_threshold"]==2 and v["fused_physical_threshold"]==1
        },
    ])

    checks.extend([
        {"name":"declass:independent_minimal_all3","pass":d["independent_minimal_capable"]==[
            ["PRINCIPAL_A","PRINCIPAL_B","PRINCIPAL_C"]
        ]},
        {"name":"declass:fused_minimal_A_B","pass":d["fused_minimal_capable"]==[
            ["PRINCIPAL_A","PRINCIPAL_B"]
        ]},
        {"name":"declass:threshold_3_to_2","pass":
            d["independent_physical_threshold"]==3 and d["fused_physical_threshold"]==2
        },
    ])

    checks.extend([
        {"name":"weak:independent_threshold2","pass":w["independent_physical_threshold"]==2},
        {"name":"weak:fused_threshold1","pass":w["fused_physical_threshold"]==1},
        {"name":"weak:fused_minimal_single_A","pass":w["fused_minimal_capable"]==[
            ["PRINCIPAL_A"]
        ]},
        {"name":"weak:single_A_declassifies","pass":
            w["fused_single_principal_action"]=={"authority":"ALLOW","public_output":"EPOCH0"}
        },
        {"name":"weak:status_exact","pass":
            w["status"]=="ROLE_FUSION_COLLAPSES_WEAK_DECLASSIFICATION_TO_SINGLE_PRINCIPAL"
        },
    ])

    checks.extend([
        {"name":"verify_failure:independent_exact","pass":v["independent_failure_cuts"]==[
            ["PRINCIPAL_A","PRINCIPAL_B"],
            ["PRINCIPAL_A","PRINCIPAL_C"],
            ["PRINCIPAL_B","PRINCIPAL_C"],
        ]},
        {"name":"verify_failure:fused_single_A","pass":v["fused_failure_cuts"]==[
            ["PRINCIPAL_A"]
        ]},
        {"name":"declass_failure:independent_singletons","pass":d["independent_failure_cuts"]==[
            ["PRINCIPAL_A"],["PRINCIPAL_B"],["PRINCIPAL_C"]
        ]},
        {"name":"declass_failure:fused_A_B_singletons","pass":d["fused_failure_cuts"]==[
            ["PRINCIPAL_A"],["PRINCIPAL_B"]
        ]},
    ])

    checks.extend([
        {"name":"reliability:verify_independent_0p972","pass":abs(v["independent_reliability_p0_1"]-0.972)<1e-12},
        {"name":"reliability:verify_fused_0p9","pass":abs(v["fused_reliability_p0_1"]-0.9)<1e-12},
        {"name":"reliability:declass_independent_0p729","pass":abs(d["independent_reliability_p0_1"]-0.729)<1e-12},
        {"name":"reliability:declass_fused_0p81","pass":abs(d["fused_reliability_p0_1"]-0.81)<1e-12},
        {"name":"reliability:fusion_hurts_verify","pass":
            v["fused_reliability_p0_1"] < v["independent_reliability_p0_1"]
        },
        {"name":"reliability:fusion_helps_strict_declass","pass":
            d["fused_reliability_p0_1"] > d["independent_reliability_p0_1"]
        },
    ])

    checks.extend([
        {"name":"privacy:verify_mediated_0p4","pass":abs(v["public_privacy_bits"]-0.4)<1e-12},
        {"name":"privacy:declass_zero","pass":abs(d["public_privacy_bits"])<1e-12},
        {"name":"malicious:strict_refusal","pass":
            m["result"]=={"authority":"DENY","refusal":"REFUSE_DECLASSIFICATION_QUORUM"}
        },
        {"name":"malicious:observer_stays_0p4","pass":abs(m["observer_privacy_bits"]-0.4)<1e-12},
        {"name":"malicious:no_public_output","pass":"public_output" not in m["result"]},
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(r)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":r["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **r,
        "verdict":"PASS_AH41" if passed==len(checks) else "FAIL_AH41",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    data=(json.dumps(payload,indent=2,sort_keys=True)+"
").encode()
    (out/"result.json").write_bytes(data)

    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "verification":v,
        "strict_declassification":d,
        "weak_negative_control":w,
        "malicious_upgrade_attempt":m,
        "receipt_hash":r["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH41":
        raise SystemExit(1)

if __name__=="__main__":
    main()
