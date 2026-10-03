#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from itertools import product
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
MODES=(COMMON_ONLY,TRIAGE,FULL_STATUS)
RANK={COMMON_ONLY:0,TRIAGE:1,FULL_STATUS:2}

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

def release_value(p,contract,mode):
    return transform(horizon_status(p,contract),mode)

def grand_release(p,modes):
    return tuple(
        (actor,contract,release_value(p,contract,modes[i]))
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

def all_designs():
    return tuple(product(MODES,repeat=len(GRANTS)))

def task_sufficient(modes,profile):
    return all(RANK[m]>=RANK[profile] for m in modes)

def evaluate_design(panels,modes):
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    desc=[grand_release(p,modes) for p in ps]
    return {
        "modes":list(modes),
        "richness_score":sum(RANK[m] for m in modes),
        "pooled_descriptor_classes":len(set(desc)),
        "residual_entropy_bits":conditional_entropy(targets,desc),
    }

def task_vector(p,profile):
    return (
        transform(p["lifetime"],profile),
        transform(p["recent"],profile),
        transform(p["adaptive"],profile),
    )

def profile_task_entropy(panels,profile):
    return entropy([task_vector(p,profile) for p in panels.values()])

def synthesize_profile(panels,profile):
    rows=[]
    for modes in all_designs():
        if task_sufficient(modes,profile):
            r=evaluate_design(panels,modes)
            r["coalition_safe"]=r["residual_entropy_bits"]>1e-12
            rows.append(r)
    best=sorted(
        rows,
        key=lambda r:(
            -r["residual_entropy_bits"],
            r["richness_score"],
            tuple(r["modes"]),
        )
    )[0]
    return best,rows

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def make_receipt(panels):
    profiles={}
    for profile in MODES:
        best,rows=synthesize_profile(panels,profile)
        profiles[profile]={
            "task_entropy_bits":profile_task_entropy(panels,profile),
            "task_sufficient_designs":len(rows),
            "coalition_safe_designs":sum(r["coalition_safe"] for r in rows),
            "selected":best,
        }
    body={
        "version":VERSION,
        "panel_count":len(panels),
        "full_target_entropy_bits":entropy([target_multi(p) for p in panels.values()]),
        "profiles":profiles,
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    panels=build_panels()
    checks=[]

    checks.extend([
        {"name":"suite:10_panels","pass":len(panels)==10},
        {"name":"suite:243_designs","pass":len(all_designs())==243},
    ])

    expected_anti={
        "H_ANTI_ALL":(
            "DEPENDENCE_OTHER_DIRECTION",
            "DEPENDENCE_OTHER_DIRECTION",
            "DEPENDENCE_OTHER_DIRECTION",
        ),
        "I_ANTI_ARCHIVE_RECENT_CLEAN":(
            "DEPENDENCE_OTHER_DIRECTION",
            "INDEPENDENCE_COMPATIBLE",
            "INSUFFICIENT_EVIDENCE",
        ),
        "J_RECENT_ANTI":(
            "INSUFFICIENT_EVIDENCE",
            "DEPENDENCE_OTHER_DIRECTION",
            "DEPENDENCE_OTHER_DIRECTION",
        ),
    }
    for pid,expected in expected_anti.items():
        got=(panels[pid]["lifetime"],panels[pid]["recent"],panels[pid]["adaptive"])
        checks.append({"name":f"panel:{pid}:exact","pass":got==expected})

    targets=[target_multi(p) for p in panels.values()]
    H_target=entropy(targets)
    checks.extend([
        {"name":"target:9_distinct","pass":len(set(targets))==9},
        {"name":"target:entropy_exact","pass":abs(H_target-3.1219280948873624)<1e-12},
    ])

    expected_profile={
        COMMON_ONLY:{
            "task_entropy":1.9609640474436811,
            "feasible":243,
            "safe":106,
            "best_residual":1.160964047443681,
            "best_modes":(COMMON_ONLY,)*5,
            "classes":5,
        },
        TRIAGE:{
            "task_entropy":2.721928094887362,
            "feasible":32,
            "safe":4,
            "best_residual":0.4,
            "best_modes":(TRIAGE,)*5,
            "classes":7,
        },
        FULL_STATUS:{
            "task_entropy":3.1219280948873624,
            "feasible":1,
            "safe":0,
            "best_residual":0.0,
            "best_modes":(FULL_STATUS,)*5,
            "classes":9,
        },
    }

    profile_rows={}
    for profile,exp in expected_profile.items():
        best,rows=synthesize_profile(panels,profile)
        taskH=profile_task_entropy(panels,profile)
        safe=sum(r["coalition_safe"] for r in rows)
        profile_rows[profile]=(best,rows,taskH,safe)

        checks.extend([
            {"name":f"{profile}:task_entropy","pass":abs(taskH-exp["task_entropy"])<1e-12},
            {"name":f"{profile}:feasible_count","pass":len(rows)==exp["feasible"]},
            {"name":f"{profile}:safe_count","pass":safe==exp["safe"]},
            {"name":f"{profile}:best_residual","pass":abs(best["residual_entropy_bits"]-exp["best_residual"])<1e-12},
            {"name":f"{profile}:best_modes","pass":tuple(best["modes"])==exp["best_modes"]},
            {"name":f"{profile}:best_classes","pass":best["pooled_descriptor_classes"]==exp["classes"]},
            {"name":f"{profile}:information_accounting","pass":abs(taskH+best["residual_entropy_bits"]-H_target)<1e-12},
        ])

    # Monotone selected frontier.
    taskHs=[profile_rows[p][2] for p in MODES]
    priv=[profile_rows[p][0]["residual_entropy_bits"] for p in MODES]
    checks.extend([
        {"name":"frontier:task_info_increases","pass":taskHs[0]<taskHs[1]<taskHs[2]},
        {"name":"frontier:privacy_decreases","pass":priv[0]>priv[1]>priv[2]},
        {"name":"frontier:full_has_no_safe_design","pass":profile_rows[FULL_STATUS][3]==0},
    ])

    # TRIAGE safe family: recent carriers and adaptive must stay TRIAGE.
    tri_rows=profile_rows[TRIAGE][1]
    tri_safe=[r for r in tri_rows if r["coalition_safe"]]
    checks.extend([
        {"name":"triage:safe_family_size_4","pass":len(tri_safe)==4},
        {"name":"triage:safe_structure_exact","pass":all(
            r["modes"][1]==TRIAGE and
            r["modes"][2]==TRIAGE and
            r["modes"][4]==TRIAGE
            for r in tri_safe
        )},
        {"name":"triage:lifetime_may_upgrade","pass":{
            (r["modes"][0],r["modes"][3]) for r in tri_safe
        }=={
            (TRIAGE,TRIAGE),
            (TRIAGE,FULL_STATUS),
            (FULL_STATUS,TRIAGE),
            (FULL_STATUS,FULL_STATUS),
        }},
    ])

    # Nested transformations.
    statuses=(
        "COMMON_MODE_EVIDENCE",
        "INSUFFICIENT_EVIDENCE",
        "INDEPENDENCE_COMPATIBLE",
        "DEPENDENCE_OTHER_DIRECTION",
    )
    checks.extend([
        {"name":"partition:common_classes_2","pass":len({transform(s,COMMON_ONLY) for s in statuses})==2},
        {"name":"partition:triage_classes_3","pass":len({transform(s,TRIAGE) for s in statuses})==3},
        {"name":"partition:full_classes_4","pass":len({transform(s,FULL_STATUS) for s in statuses})==4},
        {"name":"partition:triage_merges_compatible_and_other","pass":
            transform("INDEPENDENCE_COMPATIBLE",TRIAGE)==
            transform("DEPENDENCE_OTHER_DIRECTION",TRIAGE)
        },
    ])

    receipt=make_receipt(panels)
    replay=make_receipt(panels)
    checks.append({"name":"receipt:replay_exact","pass":canonical(receipt)==canonical(replay)})

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH33",
        "version":VERSION,
        "verdict":"PASS_AH33" if passed==len(checks) else "FAIL_AH33",
        "checks_passed":passed,
        "checks_total":len(checks),
        "panel_count":len(panels),
        "full_target_entropy_bits":H_target,
        "profiles":{
            profile:{
                "task_entropy_bits":profile_rows[profile][2],
                "task_sufficient_designs":len(profile_rows[profile][1]),
                "coalition_safe_designs":profile_rows[profile][3],
                "selected":profile_rows[profile][0],
            }
            for profile in MODES
        },
        "receipt":receipt,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "full_target_entropy_bits":H_target,
        "profiles":result["profiles"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH33":
        raise SystemExit(1)

if __name__=="__main__":
    main()
