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

ROLE_DIRECT={
    "HISTORIAN":(L,),
    "OPERATOR":(R,),
    "ADAPTIVE_CONTROLLER":(A,),
    "AUDITOR":(L,R),
    "TRI_HORIZON_ANALYST":(L,R,A),
    "ROOT_GOVERNOR":(L,R,A,M),
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

def all_subsets(items):
    return tuple(
        tuple(c for c in items if c in subset)
        for n in range(len(items)+1)
        for subset in combinations(items,n)
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

def descriptor_for(contracts,p):
    vals=[]
    for c in CONTRACTS:
        if c not in contracts:
            continue
        if c==L: vals.append(p["lifetime"])
        elif c==R: vals.append(p["recent"])
        elif c==A: vals.append(p["adaptive"])
        elif c==M: vals.append(target_multi(p))
    return tuple(vals)

def residual_entropy(panels,contracts):
    ps=list(panels.values())
    target=[target_multi(p) for p in ps]
    desc=[descriptor_for(contracts,p) for p in ps]
    return conditional_entropy(target,desc)

def deny_audit(direct,deny=M):
    if deny in closure(direct):
        return "INTERFACE_ONLY_DENY" if deny not in direct else "DIRECTLY_GRANTED"
    return "DERIVATION_SAFE_DENY"

def synthesize_hardening(baseline,required,deny=M):
    base=set(baseline); req=set(required)
    candidates=[]
    for n in range(len(baseline)+1):
        for keep in combinations(baseline,n):
            ks=set(keep)
            if not req.issubset(ks):
                continue
            if deny in closure(keep):
                continue
            removed=tuple(c for c in baseline if c not in ks)
            candidates.append({
                "keep":tuple(c for c in CONTRACTS if c in ks),
                "removed":removed,
                "remove_count":len(removed),
            })
    if not candidates:
        return None,()
    candidates.sort(key=lambda x:(x["remove_count"],x["removed"],x["keep"]))
    return candidates[0],tuple(candidates)

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def make_receipt(panels):
    baseline=ROLE_DIRECT["TRI_HORIZON_ANALYST"]
    required=(L,R)
    selected,candidates=synthesize_hardening(baseline,required,M)
    hardened=selected["keep"]
    body={
        "version":VERSION,
        "role":"TRI_HORIZON_ANALYST",
        "baseline_direct_authority":list(baseline),
        "baseline_effective_authority":list(closure(baseline)),
        "required_direct_releases":list(required),
        "effective_deny_target":M,
        "selected_hardened_direct_authority":list(hardened),
        "selected_hardened_effective_authority":list(closure(hardened)),
        "removed_releases":list(selected["removed"]),
        "removal_count":selected["remove_count"],
        "baseline_residual_entropy_bits":residual_entropy(panels,baseline),
        "hardened_residual_entropy_bits":residual_entropy(panels,hardened),
        "deny_audit_before":deny_audit(baseline,M),
        "deny_audit_after":deny_audit(hardened,M),
        "feasible_candidate_count":len(candidates),
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    panels=build_panels()
    checks=[]

    expected_eff={
        "HISTORIAN":(L,),
        "OPERATOR":(R,),
        "ADAPTIVE_CONTROLLER":(A,),
        "AUDITOR":(L,R),
        "TRI_HORIZON_ANALYST":(L,R,A,M),
        "ROOT_GOVERNOR":(L,R,A,M),
    }
    for role,direct in ROLE_DIRECT.items():
        checks.append({
            "name":f"role:{role}:effective_exact",
            "pass":closure(direct)==expected_eff[role]
        })

    checks.extend([
        {"name":"tri:direct_excludes_multi","pass":M not in ROLE_DIRECT["TRI_HORIZON_ANALYST"]},
        {"name":"tri:effective_includes_multi","pass":M in closure(ROLE_DIRECT["TRI_HORIZON_ANALYST"])},
        {"name":"control:multi_alone_closes_all","pass":closure((M,))==(L,R,A,M)},
    ])

    subsets=all_subsets(CONTRACTS)
    checks.extend([
        {"name":"closure:16_subsets","pass":len(subsets)==16},
        {"name":"closure:extensive","pass":all(set(s).issubset(set(closure(s))) for s in subsets)},
        {"name":"closure:idempotent","pass":all(closure(closure(s))==closure(s) for s in subsets)},
        {"name":"closure:monotone","pass":all(
            not set(s).issubset(set(t)) or set(closure(s)).issubset(set(closure(t)))
            for s in subsets for t in subsets
        )},
    ])

    baseline=(L,R,A)
    one_removed={
        "remove_L":(R,A),
        "remove_R":(L,A),
        "remove_A":(L,R),
    }
    checks.append({
        "name":"controls:any_single_removal_breaks_multi",
        "pass":all(M not in closure(v) for v in one_removed.values())
    })

    selected,candidates=synthesize_hardening(baseline,(L,R),M)
    checks.extend([
        {"name":"synthesis:solution_exists","pass":selected is not None},
        {"name":"synthesis:keep_LR","pass":selected["keep"]==(L,R)},
        {"name":"synthesis:remove_A_only","pass":selected["removed"]==(A,)},
        {"name":"synthesis:minimum_one","pass":selected["remove_count"]==1},
        {"name":"synthesis:unique_minimum","pass":
            sum(1 for c in candidates if c["remove_count"]==selected["remove_count"])==1
        },
        {"name":"synthesis:hardened_multi_not_derivable","pass":M not in closure(selected["keep"])},
        {"name":"synthesis:required_preserved","pass":{L,R}.issubset(set(selected["keep"]))},
    ])

    ent_full=residual_entropy(panels,(L,R,A))
    ent_lr=residual_entropy(panels,(L,R))
    ent_la=residual_entropy(panels,(L,A))
    ent_ra=residual_entropy(panels,(R,A))
    checks.extend([
        {"name":"entropy:full_zero","pass":abs(ent_full)<1e-12},
        {"name":"entropy:LR_exact","pass":abs(ent_lr-0.39355535745192405)<1e-12},
        {"name":"entropy:LA_exact","pass":abs(ent_la-0.2857142857142857)<1e-12},
        {"name":"entropy:RA_exact","pass":abs(ent_ra-0.6792696431662097)<1e-12},
        {"name":"entropy:all_one_removals_positive","pass":all(x>0 for x in (ent_lr,ent_la,ent_ra))},
    ])

    checks.extend([
        {"name":"deny:baseline_interface_only","pass":deny_audit(baseline,M)=="INTERFACE_ONLY_DENY"},
        {"name":"deny:hardened_derivation_safe","pass":deny_audit((L,R),M)=="DERIVATION_SAFE_DENY"},
    ])

    receipt=make_receipt(panels)
    replay=make_receipt(panels)
    checks.extend([
        {"name":"receipt:removed_A","pass":receipt["removed_releases"]==[A]},
        {"name":"receipt:before_after_exact","pass":
            receipt["deny_audit_before"]=="INTERFACE_ONLY_DENY" and
            receipt["deny_audit_after"]=="DERIVATION_SAFE_DENY"
        },
        {"name":"receipt:replay_exact","pass":canonical(receipt)==canonical(replay)},
    ])

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH30",
        "version":VERSION,
        "verdict":"PASS_AH30" if passed==len(checks) else "FAIL_AH30",
        "checks_passed":passed,
        "checks_total":len(checks),
        "contracts":list(CONTRACTS),
        "direct_authority":{k:list(v) for k,v in ROLE_DIRECT.items()},
        "effective_authority":{k:list(closure(v)) for k,v in ROLE_DIRECT.items()},
        "entropy_bits":{
            "H_multi_given_LRA":ent_full,
            "H_multi_given_LR":ent_lr,
            "H_multi_given_LA":ent_la,
            "H_multi_given_RA":ent_ra,
        },
        "hardening_receipt":receipt,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "direct_authority":result["direct_authority"],
        "effective_authority":result["effective_authority"],
        "entropy_bits":result["entropy_bits"],
        "hardening_receipt":receipt,
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH30":
        raise SystemExit(1)

if __name__=="__main__":
    main()
