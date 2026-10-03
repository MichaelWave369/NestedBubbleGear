#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from itertools import combinations
from pathlib import Path
import hashlib, json, math

VERSION="0.1.0"

L="Q_LIFETIME"
R="Q_RECENT"
A="Q_ADAPTIVE"
M="Q_MULTI"
CONTRACTS=(L,R,A,M)

ACTORS=("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER","AUDITOR")
DIRECT={
    "HISTORIAN":(L,),
    "OPERATOR":(R,),
    "ADAPTIVE_CONTROLLER":(A,),
    "AUDITOR":(L,R),
}

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)
LAMBDA=Fraction(1,10)
N_MIN=400

def closure(seed):
    s=set(seed)
    changed=True
    while changed:
        changed=False
        before=set(s)
        if M in s:
            s.update((L,R,A))
        if {L,R,A}.issubset(s):
            s.add(M)
        changed=s!=before
    return tuple(c for c in CONTRACTS if c in s)

def actor_coalitions():
    return tuple(
        coalition
        for n in range(len(ACTORS)+1)
        for coalition in combinations(ACTORS,n)
    )

def pooled_direct(coalition,direct=DIRECT):
    pool=set()
    for actor in coalition:
        pool.update(direct[actor])
    return tuple(c for c in CONTRACTS if c in pool)

def dangerous(coalition,direct=DIRECT):
    return M in closure(pooled_direct(coalition,direct))

def minimal_dangerous(coalitions,direct=DIRECT):
    bad=[c for c in coalitions if dangerous(c,direct)]
    return tuple(
        c for c in bad
        if not any(set(d)<set(c) for d in bad)
    )

def minimal_hitting_sets(paths):
    allc=actor_coalitions()
    hits=[
        c for c in allc
        if all(set(c)&set(path) for path in paths)
    ]
    return tuple(
        c for c in hits
        if not any(set(d)<set(c) for d in hits)
    )

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

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for t,d in zip(targets,descriptors):
        groups[d].append(t)
    n=len(targets)
    return sum((len(g)/n)*entropy(g) for g in groups.values())

def target_multi(p):
    return (p["lifetime"],p["recent"],p["adaptive"],arbitration(p))

def descriptor_for_contracts(contracts,p):
    vals=[]
    for c in (L,R,A):
        if c not in contracts:
            continue
        if c==L: vals.append(p["lifetime"])
        elif c==R: vals.append(p["recent"])
        elif c==A: vals.append(p["adaptive"])
    if M in contracts:
        vals.append(target_multi(p))
    return tuple(vals)

def residual_entropy(panels,contracts):
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    desc=[descriptor_for_contracts(contracts,p) for p in ps]
    return conditional_entropy(targets,desc)

def coalition_entropy(panels,coalition):
    return residual_entropy(panels,pooled_direct(coalition))

BASELINE_GRANTS=(
    ("HISTORIAN",L),
    ("OPERATOR",R),
    ("ADAPTIVE_CONTROLLER",A),
    ("AUDITOR",L),
    ("AUDITOR",R),
)

def config_direct(active_grants):
    d={a:[] for a in ACTORS}
    for actor,contract in active_grants:
        d[actor].append(contract)
    return {a:tuple(c for c in CONTRACTS if c in d[a]) for a in ACTORS}

def all_release_configs():
    return tuple(
        tuple(g for g in BASELINE_GRANTS if g in chosen)
        for n in range(len(BASELINE_GRANTS)+1)
        for chosen in combinations(BASELINE_GRANTS,n)
    )

def coverage(active_grants):
    released={contract for _,contract in active_grants}
    return {L,R,A}.issubset(released)

def grand_coalition_safe(active_grants):
    d=config_direct(active_grants)
    return M not in closure(pooled_direct(ACTORS,d))

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def main():
    panels=build_panels()
    coalitions=actor_coalitions()
    checks=[]

    checks.extend([
        {"name":"suite:16_coalitions","pass":len(coalitions)==16},
        {"name":"suite:4_actors","pass":len(ACTORS)==4},
    ])

    # Every singleton individually safe.
    checks.append({
        "name":"singletons:all_derivation_safe",
        "pass":all(not dangerous((a,)) for a in ACTORS)
    })

    expected_bad=(
        ("ADAPTIVE_CONTROLLER","AUDITOR"),
        ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER"),
        ("HISTORIAN","ADAPTIVE_CONTROLLER","AUDITOR"),
        ("OPERATOR","ADAPTIVE_CONTROLLER","AUDITOR"),
        ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER","AUDITOR"),
    )
    bad=tuple(c for c in coalitions if dangerous(c))
    checks.append({"name":"coalitions:dangerous_exact","pass":bad==expected_bad})
    checks.append({"name":"coalitions:dangerous_count_5","pass":len(bad)==5})

    mins=minimal_dangerous(coalitions)
    expected_mins=(
        ("ADAPTIVE_CONTROLLER","AUDITOR"),
        ("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER"),
    )
    checks.append({"name":"coalitions:minimal_dangerous_exact","pass":mins==expected_mins})
    checks.append({"name":"coalitions:minimum_size_2","pass":min(map(len,mins))==2})

    core=set(mins[0])
    for c in mins[1:]:
        core &= set(c)
    checks.append({"name":"coalitions:mandatory_core_adaptive","pass":core=={"ADAPTIVE_CONTROLLER"}})

    cuts=minimal_hitting_sets(mins)
    expected_cuts=(
        ("ADAPTIVE_CONTROLLER",),
        ("HISTORIAN","AUDITOR"),
        ("OPERATOR","AUDITOR"),
    )
    checks.append({"name":"coalitions:minimal_cuts_exact","pass":cuts==expected_cuts})

    # Upward closure of dangerous family.
    checks.append({
        "name":"coalitions:dangerous_upward_closed",
        "pass":all(
            not dangerous(c) or not set(c).issubset(set(d)) or dangerous(d)
            for c in coalitions for d in coalitions
        )
    })

    # Information cross-check for all coalitions.
    coalition_rows=[]
    all_match=True
    for c in coalitions:
        direct=pooled_direct(c)
        eff=closure(direct)
        H=coalition_entropy(panels,c)
        derivable=M in eff
        zero=abs(H)<1e-12
        if derivable!=zero:
            all_match=False
        coalition_rows.append({
            "coalition":list(c),
            "pooled_direct":list(direct),
            "effective":list(eff),
            "residual_entropy_bits":H,
            "multi_derivable":derivable,
        })
    checks.append({"name":"information:closure_zero_entropy_equivalence_all_16","pass":all_match})

    controls={
        "AUDITOR":coalition_entropy(panels,("AUDITOR",)),
        "HISTORIAN_OPERATOR":coalition_entropy(panels,("HISTORIAN","OPERATOR")),
        "HISTORIAN_ADAPTIVE":coalition_entropy(panels,("HISTORIAN","ADAPTIVE_CONTROLLER")),
        "OPERATOR_ADAPTIVE":coalition_entropy(panels,("OPERATOR","ADAPTIVE_CONTROLLER")),
        "AUDITOR_ADAPTIVE":coalition_entropy(panels,("ADAPTIVE_CONTROLLER","AUDITOR")),
        "HISTORIAN_OPERATOR_ADAPTIVE":coalition_entropy(panels,("HISTORIAN","OPERATOR","ADAPTIVE_CONTROLLER")),
    }
    checks.extend([
        {"name":"entropy:auditor_exact","pass":abs(controls["AUDITOR"]-0.39355535745192405)<1e-12},
        {"name":"entropy:historian_operator_exact","pass":abs(controls["HISTORIAN_OPERATOR"]-0.39355535745192405)<1e-12},
        {"name":"entropy:historian_adaptive_exact","pass":abs(controls["HISTORIAN_ADAPTIVE"]-0.2857142857142857)<1e-12},
        {"name":"entropy:operator_adaptive_exact","pass":abs(controls["OPERATOR_ADAPTIVE"]-0.6792696431662097)<1e-12},
        {"name":"entropy:auditor_adaptive_zero","pass":abs(controls["AUDITOR_ADAPTIVE"])<1e-12},
        {"name":"entropy:historian_operator_adaptive_zero","pass":abs(controls["HISTORIAN_OPERATOR_ADAPTIVE"])<1e-12},
    ])

    # Individually safe / collectively unsafe witness.
    checks.extend([
        {"name":"witness:auditor_safe","pass":not dangerous(("AUDITOR",))},
        {"name":"witness:adaptive_safe","pass":not dangerous(("ADAPTIVE_CONTROLLER",))},
        {"name":"witness:auditor_plus_adaptive_unsafe","pass":dangerous(("ADAPTIVE_CONTROLLER","AUDITOR"))},
    ])

    # Exhaustive grant-removal impossibility.
    configs=all_release_configs()
    checks.append({"name":"configs:32_total","pass":len(configs)==32})
    coverage_configs=[cfg for cfg in configs if coverage(cfg)]
    safe_coverage=[cfg for cfg in coverage_configs if grand_coalition_safe(cfg)]
    checks.extend([
        {"name":"configs:coverage_count_positive","pass":len(coverage_configs)>0},
        {"name":"configs:no_coverage_preserving_grand_coalition_safe","pass":len(safe_coverage)==0},
    ])

    # Sanity: removing all grants of any one contract class can make grand coalition safe.
    no_adaptive=tuple(g for g in BASELINE_GRANTS if g[1]!=A)
    checks.extend([
        {"name":"control:no_adaptive_loses_coverage","pass":not coverage(no_adaptive)},
        {"name":"control:no_adaptive_grand_safe","pass":grand_coalition_safe(no_adaptive)},
    ])

    # Deterministic replay.
    replay_rows=[]
    for c in actor_coalitions():
        direct=pooled_direct(c)
        replay_rows.append({
            "coalition":list(c),
            "pooled_direct":list(direct),
            "effective":list(closure(direct)),
            "residual_entropy_bits":coalition_entropy(panels,c),
            "multi_derivable":M in closure(direct),
        })
    checks.append({"name":"replay:coalition_rows_exact","pass":canonical(coalition_rows)==canonical(replay_rows)})

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH31",
        "version":VERSION,
        "verdict":"PASS_AH31" if passed==len(checks) else "FAIL_AH31",
        "checks_passed":passed,
        "checks_total":len(checks),
        "actors":list(ACTORS),
        "direct_authority":{k:list(v) for k,v in DIRECT.items()},
        "coalition_count":len(coalitions),
        "dangerous_coalitions":[list(c) for c in bad],
        "minimal_dangerous_coalitions":[list(c) for c in mins],
        "mandatory_core":sorted(core),
        "minimal_cut_sets":[list(c) for c in cuts],
        "entropy_controls_bits":controls,
        "coalitions":coalition_rows,
        "release_configurations":{
            "total":len(configs),
            "coverage_preserving":len(coverage_configs),
            "coverage_preserving_and_grand_coalition_safe":len(safe_coverage),
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "dangerous_coalitions":result["dangerous_coalitions"],
        "minimal_dangerous_coalitions":result["minimal_dangerous_coalitions"],
        "mandatory_core":result["mandatory_core"],
        "minimal_cut_sets":result["minimal_cut_sets"],
        "entropy_controls_bits":result["entropy_controls_bits"],
        "release_configurations":result["release_configurations"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH31":
        raise SystemExit(1)

if __name__=="__main__":
    main()
