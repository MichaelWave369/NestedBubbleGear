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

def grand_release(p,profile):
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

def all_profiles():
    return tuple(product(MODES,repeat=len(GRANTS)))

def richness(profile):
    return sum(RANK[x] for x in profile)

def evaluate(panels,profile):
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    desc=[grand_release(p,profile) for p in ps]
    return {
        "profile":list(profile),
        "richness":richness(profile),
        "descriptor_classes":len(set(desc)),
        "task_information_bits":entropy(desc),
        "residual_privacy_bits":conditional_entropy(targets,desc),
    }

def pareto(rows):
    out=[]
    for x in rows:
        dominated=False
        for y in rows:
            weak=(
                y["richness"]>=x["richness"] and
                y["residual_privacy_bits"]>=x["residual_privacy_bits"]-1e-12
            )
            strict=(
                y["richness"]>x["richness"] or
                y["residual_privacy_bits"]>x["residual_privacy_bits"]+1e-12
            )
            if weak and strict:
                dominated=True
                break
        if not dominated:
            out.append(x)
    return tuple(sorted(out,key=lambda r:(r["richness"],-r["residual_privacy_bits"],tuple(r["profile"]))))

def optimize_floor(rows,epsilon):
    feasible=[r for r in rows if r["residual_privacy_bits"]>=epsilon-1e-12]
    if not feasible:
        return (),()
    max_r=max(r["richness"] for r in feasible)
    best=tuple(sorted(
        (r for r in feasible if r["richness"]==max_r),
        key=lambda r:tuple(r["profile"])
    ))
    return tuple(feasible),best

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def make_receipt(panels):
    rows=[evaluate(panels,p) for p in all_profiles()]
    fr=pareto(rows)
    feasible04,best04=optimize_floor(rows,0.4)
    feasible08,best08=optimize_floor(rows,0.8)
    body={
        "version":VERSION,
        "profile_count":len(rows),
        "positive_privacy_profiles":sum(r["residual_privacy_bits"]>1e-12 for r in rows),
        "zero_privacy_profiles":sum(abs(r["residual_privacy_bits"])<1e-12 for r in rows),
        "pareto_coordinates":[
            [r["richness"],r["residual_privacy_bits"]]
            for r in fr
        ],
        "privacy_floor_0_4":{
            "feasible_count":len(feasible04),
            "max_richness":max(r["richness"] for r in best04),
            "best_profiles":[r["profile"] for r in best04],
        },
        "privacy_floor_0_8":{
            "feasible_count":len(feasible08),
            "max_richness":max(r["richness"] for r in best08),
            "best_profiles":[r["profile"] for r in best08],
        },
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    panels=build_panels()
    profiles=all_profiles()
    rows=[evaluate(panels,p) for p in profiles]
    checks=[]

    checks.extend([
        {"name":"suite:10_panels","pass":len(panels)==10},
        {"name":"suite:243_profiles","pass":len(profiles)==243},
        {"name":"target:entropy_exact","pass":abs(entropy([target_multi(p) for p in panels.values()])-3.1219280948873624)<1e-12},
    ])

    spectrum=Counter(round(r["residual_privacy_bits"],15) for r in rows)
    expected_spectrum={
        round(1.160964047443681,15):4,
        round(0.8,15):4,
        round(0.6754887502163468,15):17,
        round(0.4,15):46,
        round(0.2,15):35,
        round(0.0,15):137,
    }
    checks.extend([
        {"name":"spectrum:exact","pass":spectrum==expected_spectrum},
        {"name":"spectrum:positive_count_106","pass":sum(r["residual_privacy_bits"]>1e-12 for r in rows)==106},
        {"name":"spectrum:zero_count_137","pass":sum(abs(r["residual_privacy_bits"])<1e-12 for r in rows)==137},
    ])

    base=(COMMON_ONLY,)*5
    baseline=evaluate(panels,base)
    checks.append({"name":"baseline:privacy_exact","pass":abs(baseline["residual_privacy_bits"]-1.160964047443681)<1e-12})

    expected_single={
        (0,TRIAGE):0.6754887502163468,
        (0,FULL_STATUS):0.4,
        (1,TRIAGE):1.160964047443681,
        (1,FULL_STATUS):0.6754887502163468,
        (2,TRIAGE):0.8,
        (2,FULL_STATUS):0.4,
        (3,TRIAGE):0.6754887502163468,
        (3,FULL_STATUS):0.4,
        (4,TRIAGE):1.160964047443681,
        (4,FULL_STATUS):0.6754887502163468,
    }
    for (idx,mode),expected in expected_single.items():
        p=list(base); p[idx]=mode
        got=evaluate(panels,tuple(p))["residual_privacy_bits"]
        checks.append({"name":f"single:{idx}:{mode}","pass":abs(got-expected)<1e-12})

    free=(COMMON_ONLY,TRIAGE,COMMON_ONLY,COMMON_ONLY,TRIAGE)
    free_eval=evaluate(panels,free)
    checks.extend([
        {"name":"free:richness_2","pass":free_eval["richness"]==2},
        {"name":"free:privacy_unchanged","pass":abs(free_eval["residual_privacy_bits"]-baseline["residual_privacy_bits"])<1e-12},
    ])

    zero=[r for r in rows if abs(r["residual_privacy_bits"])<1e-12]
    min_zero=min(r["richness"] for r in zero)
    min_zero_rows=tuple(sorted(
        (r for r in zero if r["richness"]==min_zero),
        key=lambda r:tuple(r["profile"])
    ))
    expected_min_zero=(
        [COMMON_ONLY,COMMON_ONLY,FULL_STATUS,TRIAGE,COMMON_ONLY],
        [TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY],
    )
    checks.extend([
        {"name":"collapse:min_richness_3","pass":min_zero==3},
        {"name":"collapse:exact_two_profiles","pass":tuple(r["profile"] for r in min_zero_rows)==expected_min_zero},
        {"name":"collapse:no_score_le2","pass":all(r["residual_privacy_bits"]>1e-12 for r in rows if r["richness"]<=2)},
    ])

    safe=[r for r in rows if r["residual_privacy_bits"]>1e-12]
    max_safe=max(r["richness"] for r in safe)
    max_safe_rows=tuple(r for r in safe if r["richness"]==max_safe)
    checks.extend([
        {"name":"safe:max_richness_7","pass":max_safe==7},
        {"name":"safe:unique_score7","pass":len(max_safe_rows)==1},
        {"name":"safe:score7_profile","pass":max_safe_rows[0]["profile"]==[
            FULL_STATUS,TRIAGE,TRIAGE,FULL_STATUS,TRIAGE
        ]},
        {"name":"safe:score7_privacy_0p2","pass":abs(max_safe_rows[0]["residual_privacy_bits"]-0.2)<1e-12},
        {"name":"safe:all_score8plus_zero","pass":all(abs(r["residual_privacy_bits"])<1e-12 for r in rows if r["richness"]>=8)},
    ])

    fr=pareto(rows)
    expected_coords=(
        (2,1.160964047443681),
        (3,0.8),
        (4,0.6754887502163468),
        (4,0.6754887502163468),
        (6,0.4),
        (6,0.4),
        (7,0.2),
        (10,0.0),
    )
    got_coords=tuple((r["richness"],r["residual_privacy_bits"]) for r in fr)
    checks.extend([
        {"name":"pareto:8_profiles","pass":len(fr)==8},
        {"name":"pareto:coordinates_exact","pass":all(
            a[0]==b[0] and abs(a[1]-b[1])<1e-12
            for a,b in zip(got_coords,expected_coords)
        )},
    ])

    feasible04,best04=optimize_floor(rows,0.4)
    expected04=(
        [COMMON_ONLY,FULL_STATUS,FULL_STATUS,COMMON_ONLY,FULL_STATUS],
        [FULL_STATUS,TRIAGE,COMMON_ONLY,FULL_STATUS,TRIAGE],
    )
    checks.extend([
        {"name":"budget04:feasible_71","pass":len(feasible04)==71},
        {"name":"budget04:max_score_6","pass":max(r["richness"] for r in best04)==6},
        {"name":"budget04:two_optima","pass":tuple(r["profile"] for r in best04)==expected04},
        {"name":"budget04:privacy_exact","pass":all(abs(r["residual_privacy_bits"]-0.4)<1e-12 for r in best04)},
    ])

    feasible08,best08=optimize_floor(rows,0.8)
    checks.extend([
        {"name":"budget08:feasible_8","pass":len(feasible08)==8},
        {"name":"budget08:max_score_3","pass":len(best08)==1 and best08[0]["richness"]==3},
        {"name":"budget08:profile_exact","pass":best08[0]["profile"]==[
            COMMON_ONLY,TRIAGE,TRIAGE,COMMON_ONLY,TRIAGE
        ]},
        {"name":"budget08:privacy_exact","pass":abs(best08[0]["residual_privacy_bits"]-0.8)<1e-12},
    ])

    expected_best_by_score={
        0:1.160964047443681,
        1:1.160964047443681,
        2:1.160964047443681,
        3:0.8,
        4:0.6754887502163468,
        5:0.4,
        6:0.4,
        7:0.2,
        8:0.0,
        9:0.0,
        10:0.0,
    }
    for s,expected in expected_best_by_score.items():
        got=max(r["residual_privacy_bits"] for r in rows if r["richness"]==s)
        checks.append({"name":f"score:{s}:max_privacy","pass":abs(got-expected)<1e-12})

    receipt=make_receipt(panels)
    replay=make_receipt(panels)
    checks.append({"name":"receipt:replay_exact","pass":canonical(receipt)==canonical(replay)})

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH34",
        "version":VERSION,
        "verdict":"PASS_AH34" if passed==len(checks) else "FAIL_AH34",
        "checks_passed":passed,
        "checks_total":len(checks),
        "profile_count":len(rows),
        "positive_privacy_profiles":len(safe),
        "zero_privacy_profiles":len(zero),
        "residual_spectrum":{str(k):v for k,v in sorted(spectrum.items(),reverse=True)},
        "minimum_collapse_richness":min_zero,
        "minimum_collapse_profiles":[r["profile"] for r in min_zero_rows],
        "maximum_safe_richness":max_safe,
        "maximum_safe_profiles":[r["profile"] for r in max_safe_rows],
        "pareto_profiles":fr,
        "privacy_budget_0_4":{
            "feasible_count":len(feasible04),
            "best_profiles":list(best04),
        },
        "privacy_budget_0_8":{
            "feasible_count":len(feasible08),
            "best_profiles":list(best08),
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
        "positive_privacy_profiles":len(safe),
        "zero_privacy_profiles":len(zero),
        "minimum_collapse_richness":min_zero,
        "minimum_collapse_profiles":[r["profile"] for r in min_zero_rows],
        "maximum_safe_richness":max_safe,
        "maximum_safe_profiles":[r["profile"] for r in max_safe_rows],
        "pareto_coordinates":[
            (r["richness"],r["residual_privacy_bits"])
            for r in fr
        ],
        "budget_0_4":{
            "feasible":len(feasible04),
            "best":[r["profile"] for r in best04],
        },
        "budget_0_8":{
            "feasible":len(feasible08),
            "best":[r["profile"] for r in best08],
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH34":
        raise SystemExit(1)

if __name__=="__main__":
    main()
