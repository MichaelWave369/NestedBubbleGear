#!/usr/bin/env python3
from __future__ import annotations
from itertools import product
from pathlib import Path
import hashlib, json

SHARES=("E1","E2","E3")

POLICIES={
    "P12":{
        "minimal_success":(("E1","E2"),),
        "cost":0,
        "induced_singletons":1,
    },
    "P23":{
        "minimal_success":(("E2","E3"),),
        "cost":0,
        "induced_singletons":1,
    },
    "P_BOTH":{
        "minimal_success":(("E1","E2"),("E2","E3")),
        "cost":1,
        "induced_singletons":0,
    },
}

INDEPENDENT_REGIMES={
    "BALANCED":(0.10,0.10,0.10),
    "E1_FRAGILE":(0.30,0.10,0.05),
    "E3_FRAGILE":(0.05,0.10,0.30),
    "E2_FRAGILE":(0.05,0.30,0.05),
    "EDGE_MATCHED_INDEP":(0.24,0.10,0.24),
}

EXPECTED_RELIABILITY={
    "BALANCED":{"P12":0.81,"P23":0.81,"P_BOTH":0.891},
    "E1_FRAGILE":{"P12":0.63,"P23":0.855,"P_BOTH":0.8865},
    "E3_FRAGILE":{"P12":0.855,"P23":0.63,"P_BOTH":0.8865},
    "E2_FRAGILE":{"P12":0.665,"P23":0.665,"P_BOTH":0.69825},
    "EDGE_MATCHED_INDEP":{"P12":0.684,"P23":0.684,"P_BOTH":0.84816},
    "EDGE_COMMON_CAUSE":{"P12":0.684,"P23":0.684,"P_BOTH":0.7182},
}

EXPECTED_FRONTIER={
    "BALANCED":("P12","P23","P_BOTH"),
    "E1_FRAGILE":("P23","P_BOTH"),
    "E3_FRAGILE":("P12","P_BOTH"),
    "E2_FRAGILE":("P12","P23","P_BOTH"),
    "EDGE_MATCHED_INDEP":("P12","P23","P_BOTH"),
    "EDGE_COMMON_CAUSE":("P12","P23","P_BOTH"),
}

def independent_distribution(p):
    out={}
    for bits in product((0,1),repeat=3):
        prob=1.0
        for i,failed in enumerate(bits):
            prob*=p[i] if failed else 1-p[i]
        out[bits]=prob
    return out

def correlated_edge_distribution(c=0.20,q=0.05,p2=0.10):
    out={}
    for common in (0,1):
        pc=c if common else 1-c
        for e2 in (0,1):
            pe2=p2 if e2 else 1-p2
            if common:
                bits=(1,e2,1)
                out[bits]=out.get(bits,0.0)+pc*pe2
            else:
                for e1 in (0,1):
                    pe1=q if e1 else 1-q
                    for e3 in (0,1):
                        pe3=q if e3 else 1-q
                        bits=(e1,e2,e3)
                        out[bits]=out.get(bits,0.0)+pc*pe2*pe1*pe3
    return out

def survives(bits,minimal_success):
    index={name:i for i,name in enumerate(SHARES)}
    return any(all(bits[index[s]]==0 for s in coalition) for coalition in minimal_success)

def reliability(dist,policy_name):
    fam=POLICIES[policy_name]["minimal_success"]
    return sum(prob for bits,prob in dist.items() if survives(bits,fam))

def marginals(dist):
    return tuple(
        sum(prob for bits,prob in dist.items() if bits[i])
        for i in range(3)
    )

def dominates(a,b,rel):
    pa=POLICIES[a]; pb=POLICIES[b]
    weak=(
        pa["cost"]<=pb["cost"] and
        pa["induced_singletons"]<=pb["induced_singletons"] and
        rel[a]>=rel[b]-1e-12
    )
    strict=(
        pa["cost"]<pb["cost"] or
        pa["induced_singletons"]<pb["induced_singletons"] or
        rel[a]>rel[b]+1e-12
    )
    return weak and strict

def frontier(rel):
    names=tuple(POLICIES)
    return tuple(
        p for p in names
        if not any(dominates(q,p,rel) for q in names if q!=p)
    )

def main():
    regimes={name:independent_distribution(p) for name,p in INDEPENDENT_REGIMES.items()}
    regimes["EDGE_COMMON_CAUSE"]=correlated_edge_distribution()

    checks=[]
    results={}

    checks.append({"name":"corr:distribution_normalized","pass":abs(sum(regimes["EDGE_COMMON_CAUSE"].values())-1.0)<1e-12})

    matched_marg=marginals(regimes["EDGE_MATCHED_INDEP"])
    corr_marg=marginals(regimes["EDGE_COMMON_CAUSE"])
    checks.extend([
        {"name":"corr:matched_marginals_equal","pass":all(abs(a-b)<1e-12 for a,b in zip(matched_marg,corr_marg))},
        {"name":"corr:marginals_exact","pass":all(abs(a-b)<1e-12 for a,b in zip(corr_marg,(0.24,0.10,0.24)))},
    ])

    for regime,dist in regimes.items():
        rel={p:reliability(dist,p) for p in POLICIES}
        fr=frontier(rel)
        checks.append({
            "name":f"{regime}:reliability_exact",
            "pass":all(abs(rel[p]-EXPECTED_RELIABILITY[regime][p])<1e-12 for p in POLICIES)
        })
        checks.append({
            "name":f"{regime}:frontier_exact",
            "pass":fr==EXPECTED_FRONTIER[regime]
        })
        checks.append({
            "name":f"{regime}:P_BOTH_best_or_tied",
            "pass":rel["P_BOTH"]>=max(rel["P12"],rel["P23"])-1e-12
        })
        results[regime]={
            "reliability":rel,
            "frontier":list(fr),
            "marginals":list(marginals(dist)),
        }

    checks.extend([
        {"name":"ranking:E1_fragile_prefers_P23","pass":results["E1_FRAGILE"]["reliability"]["P23"]>results["E1_FRAGILE"]["reliability"]["P12"]},
        {"name":"ranking:E3_fragile_prefers_P12","pass":results["E3_FRAGILE"]["reliability"]["P12"]>results["E3_FRAGILE"]["reliability"]["P23"]},
        {"name":"ranking:reversal_exact","pass":
            "P12" not in results["E1_FRAGILE"]["frontier"] and
            "P23" not in results["E3_FRAGILE"]["frontier"] and
            "P23" in results["E1_FRAGILE"]["frontier"] and
            "P12" in results["E3_FRAGILE"]["frontier"]
        },
    ])

    gain_ind=results["EDGE_MATCHED_INDEP"]["reliability"]["P_BOTH"]-max(
        results["EDGE_MATCHED_INDEP"]["reliability"]["P12"],
        results["EDGE_MATCHED_INDEP"]["reliability"]["P23"],
    )
    gain_corr=results["EDGE_COMMON_CAUSE"]["reliability"]["P_BOTH"]-max(
        results["EDGE_COMMON_CAUSE"]["reliability"]["P12"],
        results["EDGE_COMMON_CAUSE"]["reliability"]["P23"],
    )
    penalty=gain_ind-gain_corr

    checks.extend([
        {"name":"corr:single_path_P12_unchanged","pass":abs(results["EDGE_MATCHED_INDEP"]["reliability"]["P12"]-results["EDGE_COMMON_CAUSE"]["reliability"]["P12"])<1e-12},
        {"name":"corr:single_path_P23_unchanged","pass":abs(results["EDGE_MATCHED_INDEP"]["reliability"]["P23"]-results["EDGE_COMMON_CAUSE"]["reliability"]["P23"])<1e-12},
        {"name":"corr:dual_path_drops","pass":results["EDGE_COMMON_CAUSE"]["reliability"]["P_BOTH"]<results["EDGE_MATCHED_INDEP"]["reliability"]["P_BOTH"]},
        {"name":"corr:independent_gain_exact","pass":abs(gain_ind-0.16416)<1e-12},
        {"name":"corr:correlated_gain_exact","pass":abs(gain_corr-0.0342)<1e-12},
        {"name":"corr:penalty_exact","pass":abs(penalty-0.12996)<1e-12},
    ])

    worst={p:min(results[r]["reliability"][p] for r in results) for p in POLICIES}
    regret={}
    for p in POLICIES:
        regret[p]=max(
            results[r]["reliability"]["P_BOTH"]-results[r]["reliability"][p]
            for r in results
        )

    checks.extend([
        {"name":"robust:P12_worst_0p63","pass":abs(worst["P12"]-0.63)<1e-12},
        {"name":"robust:P23_worst_0p63","pass":abs(worst["P23"]-0.63)<1e-12},
        {"name":"robust:PBOTH_worst_0p69825","pass":abs(worst["P_BOTH"]-0.69825)<1e-12},
        {"name":"robust:P12_regret_0p2565","pass":abs(regret["P12"]-0.2565)<1e-12},
        {"name":"robust:P23_regret_0p2565","pass":abs(regret["P23"]-0.2565)<1e-12},
        {"name":"robust:PBOTH_regret_zero","pass":abs(regret["P_BOTH"])<1e-12},
    ])

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH24",
        "version":"0.1.0",
        "verdict":"PASS_AH24" if passed==len(checks) else "FAIL_AH24",
        "checks_passed":passed,
        "checks_total":len(checks),
        "policies":POLICIES,
        "regimes":results,
        "matched_marginal_control":{
            "independent_marginals":list(matched_marg),
            "correlated_marginals":list(corr_marg),
            "redundancy_gain_independent":gain_ind,
            "redundancy_gain_correlated":gain_corr,
            "correlation_penalty":penalty,
        },
        "robust":{
            "worst_reliability":worst,
            "max_regret_vs_P_BOTH":regret,
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "regimes":{r:{"reliability":x["reliability"],"frontier":x["frontier"]} for r,x in results.items()},
        "matched_marginal_control":result["matched_marginal_control"],
        "robust":result["robust"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH24":
        raise SystemExit(1)

if __name__=="__main__":
    main()
