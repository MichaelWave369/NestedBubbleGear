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

RAW="RAW"
RISK="RISK"

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)
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
    }

def target_multi(p):
    return (p["lifetime"],p["recent"],p["adaptive"],arbitration(p))

def common_bit(status):
    return "COMMON" if status=="COMMON_MODE_EVIDENCE" else "NOT_COMMON"

def horizon_status(p,contract):
    if contract==L: return p["lifetime"]
    if contract==R: return p["recent"]
    if contract==A: return p["adaptive"]
    raise KeyError(contract)

def release_value(p,contract,mode):
    status=horizon_status(p,contract)
    return status if mode==RAW else common_bit(status)

def task_value(role,p):
    if role=="HISTORIAN":
        return common_bit(p["lifetime"])
    if role=="OPERATOR":
        return common_bit(p["recent"])
    if role=="ADAPTIVE_CONTROLLER":
        return common_bit(p["adaptive"])
    if role=="AUDITOR":
        return (common_bit(p["lifetime"]),common_bit(p["recent"]))
    raise KeyError(role)

def actor_release(role,p,modes):
    vals=[]
    for i,(actor,contract) in enumerate(GRANTS):
        if actor==role:
            vals.append(release_value(p,contract,modes[i]))
    return tuple(vals)

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

def task_error_count(panels,role,modes):
    # A descriptor is task-sufficient iff no release class maps to multiple task values.
    groups=defaultdict(set)
    for p in panels.values():
        groups[actor_release(role,p,modes)].add(task_value(role,p))
    return sum(len(v)-1 for v in groups.values())

def evaluate_design(panels,modes):
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    desc=[grand_release(p,modes) for p in ps]
    residual=conditional_entropy(targets,desc)
    task_errors={
        role:task_error_count(panels,role,modes)
        for role in ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER","AUDITOR")
    }
    transformed=[
        f"{actor}:{contract}"
        for i,(actor,contract) in enumerate(GRANTS)
        if modes[i]==RISK
    ]
    return {
        "modes":list(modes),
        "transformed_grants":transformed,
        "transformation_count":len(transformed),
        "task_errors":task_errors,
        "task_exact":all(v==0 for v in task_errors.values()),
        "pooled_descriptor_classes":len(set(desc)),
        "residual_entropy_bits":residual,
        "coalition_safe":residual>1e-12,
    }

def all_designs():
    return tuple(product((RAW,RISK),repeat=len(GRANTS)))

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def synthesize(panels):
    rows=[evaluate_design(panels,m) for m in all_designs()]
    feasible=[r for r in rows if r["task_exact"] and r["coalition_safe"]]
    feasible.sort(key=lambda r:(r["transformation_count"],r["transformed_grants"],r["modes"]))
    return feasible[0] if feasible else None,rows

def make_receipt(panels):
    selected,rows=synthesize(panels)
    baseline=evaluate_design(panels,(RAW,)*len(GRANTS))
    body={
        "version":VERSION,
        "baseline_grants":[f"{a}:{c}" for a,c in GRANTS],
        "selected_modes":selected["modes"],
        "transformed_grants":selected["transformed_grants"],
        "transformation_count":selected["transformation_count"],
        "task_errors":selected["task_errors"],
        "baseline_residual_entropy_bits":baseline["residual_entropy_bits"],
        "hardened_residual_entropy_bits":selected["residual_entropy_bits"],
        "baseline_descriptor_classes":baseline["pooled_descriptor_classes"],
        "hardened_descriptor_classes":selected["pooled_descriptor_classes"],
        "safe_design_count":sum(r["coalition_safe"] and r["task_exact"] for r in rows),
        "total_design_count":len(rows),
        "witness_panels":["C","F"],
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    panels=build_panels()
    checks=[]

    designs=all_designs()
    checks.append({"name":"suite:32_designs","pass":len(designs)==32})

    rows=[evaluate_design(panels,m) for m in designs]
    checks.append({"name":"tasks:all_32_exact","pass":all(r["task_exact"] for r in rows)})

    baseline=evaluate_design(panels,(RAW,)*5)
    checks.extend([
        {"name":"baseline:zero_residual","pass":abs(baseline["residual_entropy_bits"])<1e-12},
        {"name":"baseline:6_descriptor_classes","pass":baseline["pooled_descriptor_classes"]==6},
        {"name":"baseline:unsafe","pass":not baseline["coalition_safe"]},
    ])

    safe=[r for r in rows if r["task_exact"] and r["coalition_safe"]]
    checks.extend([
        {"name":"safe:count_8","pass":len(safe)==8},
        {"name":"safe:all_residual_exact","pass":all(abs(r["residual_entropy_bits"]-0.2857142857142857)<1e-12 for r in safe)},
        {"name":"safe:all_have_5_classes","pass":all(r["pooled_descriptor_classes"]==5 for r in safe)},
    ])

    # Safe iff both lifetime grants are coarsened.
    lifetime_indices=(0,3)
    checks.append({
        "name":"safe:iff_both_lifetime_RISK",
        "pass":all(
            r["coalition_safe"] ==
            (r["modes"][lifetime_indices[0]]==RISK and r["modes"][lifetime_indices[1]]==RISK)
            for r in rows
        )
    })

    selected,allrows=synthesize(panels)
    expected_modes=(RISK,RAW,RAW,RISK,RAW)
    checks.extend([
        {"name":"synthesis:exists","pass":selected is not None},
        {"name":"synthesis:modes_exact","pass":tuple(selected["modes"])==expected_modes},
        {"name":"synthesis:two_transformations","pass":selected["transformation_count"]==2},
        {"name":"synthesis:unique_minimum","pass":
            sum(1 for r in safe if r["transformation_count"]==2)==1
        },
        {"name":"synthesis:zero_task_error","pass":all(v==0 for v in selected["task_errors"].values())},
        {"name":"synthesis:residual_exact","pass":abs(selected["residual_entropy_bits"]-0.2857142857142857)<1e-12},
    ])

    # No single transformation can work.
    checks.append({
        "name":"control:no_one_transform_safe",
        "pass":all(not r["coalition_safe"] for r in rows if r["transformation_count"]<=1)
    })

    # C/F witness.
    zC=grand_release(panels["C"],expected_modes)
    zF=grand_release(panels["F"],expected_modes)
    mC=target_multi(panels["C"])
    mF=target_multi(panels["F"])
    checks.extend([
        {"name":"witness:C_F_same_release","pass":zC==zF},
        {"name":"witness:C_F_different_target","pass":mC!=mF},
        {"name":"witness:C_target_exact","pass":mC==(
            "INDEPENDENCE_COMPATIBLE","INDEPENDENCE_COMPATIBLE",
            "INDEPENDENCE_COMPATIBLE","CONSISTENT"
        )},
        {"name":"witness:F_target_exact","pass":mF==(
            "INSUFFICIENT_EVIDENCE","INDEPENDENCE_COMPATIBLE",
            "INDEPENDENCE_COMPATIBLE","HORIZON_CONFLICT"
        )},
    ])

    # Task conditional entropies under selected design.
    for role in ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER","AUDITOR"):
        tasks=[task_value(role,p) for p in panels.values()]
        releases=[actor_release(role,p,expected_modes) for p in panels.values()]
        checks.append({
            "name":f"task_entropy:{role}:zero",
            "pass":abs(conditional_entropy(tasks,releases))<1e-12
        })

    # Frozen lifetime information reduction.
    life=[p["lifetime"] for p in panels.values()]
    life_task=[common_bit(s) for s in life]
    H_life=entropy(life)
    H_task=entropy(life_task)
    reduction=H_life-H_task
    checks.extend([
        {"name":"info:lifetime_raw_entropy","pass":abs(H_life-1.3787834934861753)<1e-12},
        {"name":"info:lifetime_task_entropy","pass":abs(H_task-0.863120568566631)<1e-12},
        {"name":"info:lifetime_detail_removed","pass":abs(reduction-0.5156629249195443)<1e-12},
    ])

    receipt=make_receipt(panels)
    replay=make_receipt(panels)
    checks.extend([
        {"name":"receipt:transformed_exact","pass":receipt["transformed_grants"]==[
            "HISTORIAN:Q_LIFETIME","AUDITOR:Q_LIFETIME"
        ]},
        {"name":"receipt:safe_count_8","pass":receipt["safe_design_count"]==8},
        {"name":"receipt:replay_exact","pass":canonical(receipt)==canonical(replay)},
    ])

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH32",
        "version":VERSION,
        "verdict":"PASS_AH32" if passed==len(checks) else "FAIL_AH32",
        "checks_passed":passed,
        "checks_total":len(checks),
        "grant_order":[f"{a}:{c}" for a,c in GRANTS],
        "design_count":len(rows),
        "safe_design_count":len(safe),
        "selected_design":selected,
        "baseline_design":baseline,
        "lifetime_information_bits":{
            "raw_status_entropy":H_life,
            "task_bit_entropy":H_task,
            "detail_removed":reduction,
        },
        "witness":{
            "C_release":zC,
            "F_release":zF,
            "C_target":mC,
            "F_target":mF,
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
        "design_count":result["design_count"],
        "safe_design_count":result["safe_design_count"],
        "selected_design":result["selected_design"],
        "lifetime_information_bits":result["lifetime_information_bits"],
        "witness":{
            "same_release":zC==zF,
            "different_target":mC!=mF,
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH32":
        raise SystemExit(1)

if __name__=="__main__":
    main()
