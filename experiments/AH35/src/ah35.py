#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from itertools import product, combinations
from pathlib import Path
import hashlib, json, math

VERSION="0.1.1"

L="Q_LIFETIME"
R="Q_RECENT"
A="Q_ADAPTIVE"

GRANTS=(
    ("HISTORIAN",L,"H_L"),
    ("OPERATOR",R,"O_R"),
    ("ADAPTIVE_CONTROLLER",A,"A_A"),
    ("AUDITOR",L,"U_L"),
    ("AUDITOR",R,"U_R"),
)

COMMON_ONLY="COMMON_ONLY"
TRIAGE="TRIAGE"
FULL_STATUS="FULL_STATUS"
MODES=(COMMON_ONLY,TRIAGE,FULL_STATUS)
RANK={COMMON_ONLY:0,TRIAGE:1,FULL_STATUS:2}

ATOMS=(
    "H_L:T","H_L:F",
    "O_R:T","O_R:F",
    "A_A:T","A_A:F",
    "U_L:T","U_L:F",
    "U_R:T","U_R:F",
)

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
        for i,(actor,contract,_) in enumerate(GRANTS)
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
        "residual_privacy_bits":conditional_entropy(targets,desc),
    }

def atoms_for_profile(profile):
    atoms=[]
    for (_,_,short),mode in zip(GRANTS,profile):
        if RANK[mode]>=1:
            atoms.append(short+":T")
        if RANK[mode]>=2:
            atoms.append(short+":F")
    return tuple(a for a in ATOMS if a in atoms)

def profile_for_atoms(atom_set):
    s=set(atom_set)
    profile=[]
    for _,_,short in GRANTS:
        if short+":F" in s:
            if short+":T" not in s:
                return None
            profile.append(FULL_STATUS)
        elif short+":T" in s:
            profile.append(TRIAGE)
        else:
            profile.append(COMMON_ONLY)
    return tuple(profile)

def valid_upgrade_sets():
    return tuple(atoms_for_profile(p) for p in all_profiles())

def is_dangerous(panels,atom_set):
    profile=profile_for_atoms(atom_set)
    if profile is None:
        raise ValueError("invalid upgrade set")
    return abs(evaluate(panels,profile)["residual_privacy_bits"])<1e-12

def minimal_dangerous_sets(panels):
    valid=valid_upgrade_sets()
    bad=[x for x in valid if is_dangerous(panels,x)]
    return tuple(
        x for x in bad
        if not any(set(y)<set(x) for y in bad)
    )

def inclusion_minimal_hitting_sets(paths):
    out=[]
    for n in range(len(ATOMS)+1):
        for comb in combinations(ATOMS,n):
            s=set(comb)
            if not all(s & set(path) for path in paths):
                continue
            if any(set(prev)<s for prev in out):
                continue
            out.append(comb)
    return tuple(out)

def profiles_avoiding(cut):
    c=set(cut)
    return tuple(
        p for p in all_profiles()
        if not (set(atoms_for_profile(p)) & c)
    )

def cut_stats(panels,cut):
    permitted=profiles_avoiding(cut)
    rows=[evaluate(panels,p) for p in permitted]
    return {
        "cut":list(cut),
        "cost":len(cut),
        "permitted_profiles":len(rows),
        "max_richness":max(r["richness"] for r in rows),
        "min_residual_privacy_bits":min(r["residual_privacy_bits"] for r in rows),
        "all_safe":all(r["residual_privacy_bits"]>1e-12 for r in rows),
    }

def all_hitting_sets(paths):
    out=[]
    for n in range(len(ATOMS)+1):
        for comb in combinations(ATOMS,n):
            if all(set(comb)&set(path) for path in paths):
                out.append(comb)
    return tuple(out)

def policy_pareto(rows):
    out=[]
    for x in rows:
        dominated=False
        for y in rows:
            weak=(
                y["cost"]<=x["cost"] and
                y["max_richness"]>=x["max_richness"] and
                y["min_residual_privacy_bits"]>=x["min_residual_privacy_bits"]-1e-12
            )
            strict=(
                y["cost"]<x["cost"] or
                y["max_richness"]>x["max_richness"] or
                y["min_residual_privacy_bits"]>x["min_residual_privacy_bits"]+1e-12
            )
            if weak and strict:
                dominated=True
                break
        if not dominated:
            out.append(x)
    return tuple(sorted(out,key=lambda r:(r["cost"],-r["max_richness"],-r["min_residual_privacy_bits"],tuple(r["cut"]))))

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def main():
    panels=build_panels()
    checks=[]

    valid=valid_upgrade_sets()
    rows=[evaluate(panels,profile_for_atoms(x)) for x in valid]
    dangerous=[x for x,r in zip(valid,rows) if abs(r["residual_privacy_bits"])<1e-12]

    checks.extend([
        {"name":"suite:10_atoms","pass":len(ATOMS)==10},
        {"name":"suite:243_valid_upgrade_sets","pass":len(valid)==243 and len(set(valid))==243},
        {"name":"suite:137_dangerous","pass":len(dangerous)==137},
        {"name":"suite:106_safe","pass":len(valid)-len(dangerous)==106},
    ])

    checks.append({
        "name":"access:dangerous_upward_closed",
        "pass":all(
            not set(x).issubset(set(y)) or y in dangerous
            for x in dangerous
            for y in valid
        )
    })

    mins=minimal_dangerous_sets(panels)
    expected_mins=(
        ("U_L:T","U_L:F","U_R:T","U_R:F"),
        ("A_A:T","U_L:T","U_R:T","U_R:F"),
        ("A_A:T","A_A:F","U_L:T"),
        ("O_R:T","O_R:F","U_L:T","U_L:F"),
        ("O_R:T","O_R:F","A_A:T","U_L:T"),
        ("H_L:T","A_A:T","U_R:T","U_R:F"),
        ("H_L:T","A_A:T","A_A:F"),
        ("H_L:T","O_R:T","O_R:F","A_A:T"),
        ("H_L:T","H_L:F","U_R:T","U_R:F"),
        ("H_L:T","H_L:F","O_R:T","O_R:F"),
    )
    checks.extend([
        {"name":"paths:10_minimal","pass":len(mins)==10},
        {"name":"paths:exact","pass":mins==expected_mins},
        {"name":"paths:min_size_3","pass":min(map(len,mins))==3},
        {"name":"paths:two_size3","pass":sum(len(x)==3 for x in mins)==2},
    ])

    core=set(mins[0])
    for x in mins[1:]:
        core &= set(x)
    checks.append({"name":"paths:mandatory_core_empty","pass":core==set()})

    cuts=inclusion_minimal_hitting_sets(mins)
    expected_cuts=(
        ("H_L:T","U_L:T"),
        ("H_L:T","A_A:T","U_L:F"),
        ("H_L:F","A_A:T","U_L:T"),
        ("H_L:F","A_A:T","U_L:F"),
        ("O_R:T","A_A:T","U_R:T"),
        ("O_R:T","A_A:T","U_R:F"),
        ("O_R:T","A_A:F","U_R:T"),
        ("O_R:T","A_A:F","U_R:F"),
        ("O_R:F","A_A:T","U_R:T"),
        ("O_R:F","A_A:T","U_R:F"),
        ("O_R:F","A_A:F","U_R:T"),
        ("O_R:F","A_A:F","U_R:F"),
    )
    checks.extend([
        {"name":"cuts:12_inclusion_minimal","pass":len(cuts)==12},
        {"name":"cuts:exact","pass":cuts==expected_cuts},
        {"name":"cuts:unique_size2","pass":[c for c in cuts if len(c)==2]==[("H_L:T","U_L:T")]},
    ])

    checks.append({
        "name":"cuts:all_operationally_safe",
        "pass":all(cut_stats(panels,c)["all_safe"] for c in cuts)
    })
    checks.append({
        "name":"cuts:all_minimal_operationally",
        "pass":all(
            all(
                not all(set(sub)&set(path) for path in mins)
                for k in range(len(c))
                for sub in [c[:k]+c[k+1:]]
            )
            for c in cuts
        )
    })

    mincut=("H_L:T","U_L:T")
    minstats=cut_stats(panels,mincut)
    checks.extend([
        {"name":"mincut:cost2","pass":minstats["cost"]==2},
        {"name":"mincut:27_profiles","pass":minstats["permitted_profiles"]==27},
        {"name":"mincut:max_richness6","pass":minstats["max_richness"]==6},
        {"name":"mincut:min_privacy0p4","pass":abs(minstats["min_residual_privacy_bits"]-0.4)<1e-12},
    ])

    profile_rows=[evaluate(panels,p) for p in all_profiles()]
    checks.extend([
        {"name":"scalar:all_score_le2_safe","pass":all(r["residual_privacy_bits"]>1e-12 for r in profile_rows if r["richness"]<=2)},
        {"name":"scalar:score3_has_danger","pass":any(abs(r["residual_privacy_bits"])<1e-12 for r in profile_rows if r["richness"]==3)},
        {"name":"scalar:guaranteed_safe_cap2","pass":
            max(s for s in range(11) if all(r["residual_privacy_bits"]>1e-12 for r in profile_rows if r["richness"]<=s))==2
        },
        {"name":"structural:triple_scalar_cap","pass":minstats["max_richness"]==3*2},
    ])

    cutrows=[cut_stats(panels,c) for c in cuts]
    maxrich=max(r["max_richness"] for r in cutrows)
    maxcuts=[r for r in cutrows if r["max_richness"]==maxrich]
    checks.extend([
        {"name":"cuts:max_permitted_richness7","pass":maxrich==7},
        {"name":"cuts:unique_maxrich_cut","pass":len(maxcuts)==1 and tuple(maxcuts[0]["cut"])==("O_R:F","A_A:F","U_R:F")},
        {"name":"cuts:maxrich_worst_privacy0p2","pass":abs(maxcuts[0]["min_residual_privacy_bits"]-0.2)<1e-12},
    ])

    hitrows=[cut_stats(panels,c) for c in all_hitting_sets(mins)]
    frontier=policy_pareto(hitrows)
    coords=tuple((r["cost"],r["max_richness"],r["min_residual_privacy_bits"]) for r in frontier)
    expected_coords=(
        (2,6,0.4),
        (3,7,0.2),
        (3,4,0.6754887502163468),
        (5,3,0.8),
        (5,2,1.160964047443681),
    )
    checks.extend([
        {"name":"policy_frontier:5_points","pass":len(frontier)==5},
        {"name":"policy_frontier:coords_exact","pass":all(
            a[0]==b[0] and a[1]==b[1] and abs(a[2]-b[2])<1e-12
            for a,b in zip(coords,expected_coords)
        )},
    ])

    replay_mins=minimal_dangerous_sets(panels)
    replay_cuts=inclusion_minimal_hitting_sets(replay_mins)
    checks.append({
        "name":"replay:paths_cuts_exact",
        "pass":canonical({"mins":mins,"cuts":cuts})==canonical({"mins":replay_mins,"cuts":replay_cuts})
    })

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH35",
        "version":VERSION,
        "verdict":"PASS_AH35" if passed==len(checks) else "FAIL_AH35",
        "checks_passed":passed,
        "checks_total":len(checks),
        "atoms":list(ATOMS),
        "valid_upgrade_sets":len(valid),
        "dangerous_upgrade_sets":len(dangerous),
        "safe_upgrade_sets":len(valid)-len(dangerous),
        "minimal_dangerous_sets":[list(x) for x in mins],
        "mandatory_core":sorted(core),
        "minimal_cut_sets":[list(x) for x in cuts],
        "unique_minimum_cut":list(mincut),
        "unique_minimum_cut_stats":minstats,
        "scalar_guaranteed_safe_richness_cap":2,
        "utility_maximal_minimal_cut":maxcuts[0],
        "policy_frontier":frontier,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "valid_upgrade_sets":result["valid_upgrade_sets"],
        "dangerous_upgrade_sets":result["dangerous_upgrade_sets"],
        "minimal_dangerous_count":len(mins),
        "minimal_cut_count":len(cuts),
        "mandatory_core":result["mandatory_core"],
        "unique_minimum_cut":result["unique_minimum_cut"],
        "unique_minimum_cut_stats":result["unique_minimum_cut_stats"],
        "utility_maximal_minimal_cut":result["utility_maximal_minimal_cut"],
        "policy_frontier_coordinates":[
            [r["cost"],r["max_richness"],r["min_residual_privacy_bits"]]
            for r in frontier
        ],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH35":
        raise SystemExit(1)

if __name__=="__main__":
    main()
