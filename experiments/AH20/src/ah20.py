#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from itertools import combinations
from math import comb
from pathlib import Path
import hashlib, json, math

Matrix = tuple[tuple[int,int],tuple[int,int]]

I: Matrix = ((1,0),(0,1))
A: Matrix = ((1,1),(0,1))
B: Matrix = ((1,0),(1,1))
S: Matrix = ((0,-1),(1,0))

def mul(X: Matrix, Y: Matrix) -> Matrix:
    return (
        (X[0][0]*Y[0][0] + X[0][1]*Y[1][0],
         X[0][0]*Y[0][1] + X[0][1]*Y[1][1]),
        (X[1][0]*Y[0][0] + X[1][1]*Y[1][0],
         X[1][0]*Y[0][1] + X[1][1]*Y[1][1]),
    )

def det(X: Matrix) -> int:
    return X[0][0]*X[1][1] - X[0][1]*X[1][0]

def inv(X: Matrix) -> Matrix:
    if det(X) != 1:
        raise ValueError("determinant must be +1")
    return ((X[1][1],-X[0][1]),(-X[1][0],X[0][0]))

def power(X: Matrix, n: int) -> Matrix:
    if n < 0:
        return power(inv(X),-n)
    out=I
    for _ in range(n):
        out=mul(out,X)
    return out

def conjugate(T: Matrix, H: Matrix) -> Matrix:
    return mul(mul(T,H),inv(T))

def entropy(values) -> float:
    c=Counter(values)
    n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets, descriptors) -> float:
    groups=defaultdict(list)
    for target,desc in zip(targets,descriptors):
        groups[desc].append(target)
    n=len(targets)
    return sum((len(group)/n)*entropy(group) for group in groups.values())

C=mul(A,B)
BASE={"I":I,"A":A,"B":B,"S":S}
K_VALUES=(-1,0,1)
SHARES=("E1","E2","E3")
COALITIONS=tuple(
    coalition
    for r in range(len(SHARES)+1)
    for coalition in combinations(SHARES,r)
)
H2_C=((2,-1),(1,0))

TASKS={
    "H2_FULL":{
        "target":"H2",
        "local":None,
        "policy_minimal":(("E1","E2"),),
        "expected_cap_cuts":(("E2",),("E1","E3")),
        "expected_policy_cuts":(("E1",),("E2",)),
        "expected_cap_poly":(1,-1,-1,1),
        "expected_policy_poly":(1,-2,1,0),
        "expected_induced_singletons":(("E1",),),
    },
    "GLOBAL_REAUTH":{
        "target":"G",
        "local":"P2",
        "policy_minimal":(("E1","E2"),),
        "expected_cap_cuts":(("E2",),("E1","E3")),
        "expected_policy_cuts":(("E1",),("E2",)),
        "expected_cap_poly":(1,-1,-1,1),
        "expected_policy_poly":(1,-2,1,0),
        "expected_induced_singletons":(("E1",),),
    },
    "ROUTE_REAUTH":{
        "target":"P2",
        "local":"H3",
        "policy_minimal":(("E2","E3"),),
        "expected_cap_cuts":(("E2",),("E1","E3")),
        "expected_policy_cuts":(("E2",),("E3",)),
        "expected_cap_poly":(1,-1,-1,1),
        "expected_policy_poly":(1,-2,1,0),
        "expected_induced_singletons":(("E3",),),
    },
    "C_CLASS_ALARM":{
        "target":"CFLAG",
        "local":None,
        "policy_minimal":(("E3",),),
        "expected_cap_cuts":(("E1","E3"),),
        "expected_policy_cuts":(("E3",),),
        "expected_cap_poly":(1,0,-1,0),
        "expected_policy_poly":(1,-1,0,0),
        "expected_induced_singletons":(("E3",),),
    },
}

def make_case(un,U,vn,V,k):
    T1=mul(U,power(B,k))
    T2=mul(power(B,-k),V)
    P2=mul(T1,T2)
    H2=conjugate(T1,B)
    H3=conjugate(P2,C)
    R=mul(H3,H2)
    G=mul(R,A)
    return {
        "label":(un,vn,k),
        "H2":H2,
        "H3":H3,
        "P2":P2,
        "G":G,
        "CFLAG":int(H2==H2_C),
        "E1":H2[0][0],
        "E2":H2[1][0],
        "E3":H2[1][1],
    }

def values(cases,key):
    return [c[key] for c in cases]

def descriptor(cases, local, coalition):
    out=[]
    for c in cases:
        row=[]
        if local is not None:
            row.append(c[local])
        row.extend(c[s] for s in coalition)
        out.append(tuple(row))
    return out

def capability_family(cases,cfg):
    target=values(cases,cfg["target"])
    return tuple(
        coalition for coalition in COALITIONS
        if conditional_entropy(
            target,
            descriptor(cases,cfg["local"],coalition)
        ) < 1e-12
    )

def policy_family(minimal_authorized):
    return tuple(
        c for c in COALITIONS
        if any(set(m).issubset(set(c)) for m in minimal_authorized)
    )

def minimal_success(family):
    fam=set(family)
    return tuple(
        c for c in family
        if not any(set(d)<set(c) for d in fam)
    )

def survives(failure_set,family):
    F=set(failure_set)
    return any(F.isdisjoint(set(c)) for c in family)

def failure_family(family):
    return tuple(
        F for F in COALITIONS
        if not survives(F,family)
    )

def minimal_cuts(family):
    failures=failure_family(family)
    return tuple(
        F for F in failures
        if not any(set(G)<set(F) for G in failures)
    )

def upward_closed_failure(family):
    failed=set(failure_family(family))
    for F in failed:
        for G in COALITIONS:
            if set(F).issubset(set(G)) and G not in failed:
                return False
    return True

def minimal_hitting_sets(success_minimal):
    hits=[]
    for F in COALITIONS:
        if all(set(F)&set(C) for C in success_minimal):
            hits.append(F)
    return tuple(
        F for F in hits
        if not any(set(G)<set(F) for G in hits)
    )

def reliability_coeffs(family):
    coeff=[0,0,0,0]
    n=len(SHARES)
    for F in COALITIONS:
        if survives(F,family):
            k=len(F)
            alive=n-k
            # exact-state probability p^k(1-p)^alive
            for j in range(alive+1):
                coeff[k+j]+=comb(alive,j)*((-1)**j)
    return tuple(coeff)

def poly_eval(coeff,p):
    return sum(c*(p**i) for i,c in enumerate(coeff))

def singleton_cuts(cuts):
    return tuple(c for c in cuts if len(c)==1)

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"suite:8_failure_sets","pass":len(COALITIONS)==8},
    ]
    task_results={}

    for task,cfg in TASKS.items():
        cap=capability_family(cases,cfg)
        pol=policy_family(cfg["policy_minimal"])

        cap_min=minimal_success(cap)
        pol_min=minimal_success(pol)

        cap_cuts=minimal_cuts(cap)
        pol_cuts=minimal_cuts(pol)

        cap_hit=minimal_hitting_sets(cap_min)
        pol_hit=minimal_hitting_sets(pol_min)

        cap_poly=reliability_coeffs(cap)
        pol_poly=reliability_coeffs(pol)

        cap_single=singleton_cuts(cap_cuts)
        pol_single=singleton_cuts(pol_cuts)
        induced=tuple(c for c in pol_single if c not in cap_single)

        checks.extend([
            {"name":f"{task}:cap_cuts_exact","pass":cap_cuts==cfg["expected_cap_cuts"]},
            {"name":f"{task}:policy_cuts_exact","pass":pol_cuts==cfg["expected_policy_cuts"]},
            {"name":f"{task}:cap_failure_upward_closed","pass":upward_closed_failure(cap)},
            {"name":f"{task}:policy_failure_upward_closed","pass":upward_closed_failure(pol)},
            {"name":f"{task}:cap_hitting_duality","pass":cap_hit==cap_cuts},
            {"name":f"{task}:policy_hitting_duality","pass":pol_hit==pol_cuts},
            {"name":f"{task}:cap_poly_exact","pass":cap_poly==cfg["expected_cap_poly"]},
            {"name":f"{task}:policy_poly_exact","pass":pol_poly==cfg["expected_policy_poly"]},
            {"name":f"{task}:induced_singletons_exact","pass":induced==cfg["expected_induced_singletons"]},
        ])

        # Policy reliability can never exceed capability reliability in the frozen p probes.
        for p in (0.0,0.1,0.25,0.5,0.75,1.0):
            checks.append({
                "name":f"{task}:policy_not_more_reliable_p{p}",
                "pass":poly_eval(pol_poly,p) <= poly_eval(cap_poly,p)+1e-12
            })

        task_results[task]={
            "capability_family":[list(c) for c in cap],
            "policy_family":[list(c) for c in pol],
            "capability_minimal_success":[list(c) for c in cap_min],
            "policy_minimal_success":[list(c) for c in pol_min],
            "capability_minimal_cuts":[list(c) for c in cap_cuts],
            "policy_minimal_cuts":[list(c) for c in pol_cuts],
            "policy_induced_singleton_cuts":[list(c) for c in induced],
            "capability_reliability_coeffs":list(cap_poly),
            "policy_reliability_coeffs":list(pol_poly),
            "reliability":{
                "p_0_1":{
                    "capability":poly_eval(cap_poly,0.1),
                    "policy":poly_eval(pol_poly,0.1),
                    "gap":poly_eval(cap_poly,0.1)-poly_eval(pol_poly,0.1),
                },
                "p_0_5":{
                    "capability":poly_eval(cap_poly,0.5),
                    "policy":poly_eval(pol_poly,0.5),
                    "gap":poly_eval(cap_poly,0.5)-poly_eval(pol_poly,0.5),
                },
            },
        }

    # Cross-task frozen spot checks.
    checks.extend([
        {"name":"cross:full_cap_p0p1_0p891","pass":
            abs(task_results["H2_FULL"]["reliability"]["p_0_1"]["capability"]-0.891)<1e-12
        },
        {"name":"cross:full_policy_p0p1_0p81","pass":
            abs(task_results["H2_FULL"]["reliability"]["p_0_1"]["policy"]-0.81)<1e-12
        },
        {"name":"cross:full_gap_p0p1_0p081","pass":
            abs(task_results["H2_FULL"]["reliability"]["p_0_1"]["gap"]-0.081)<1e-12
        },
        {"name":"cross:alarm_cap_p0p1_0p99","pass":
            abs(task_results["C_CLASS_ALARM"]["reliability"]["p_0_1"]["capability"]-0.99)<1e-12
        },
        {"name":"cross:alarm_policy_p0p1_0p9","pass":
            abs(task_results["C_CLASS_ALARM"]["reliability"]["p_0_1"]["policy"]-0.9)<1e-12
        },
        {"name":"cross:alarm_gap_p0p5_0p25","pass":
            abs(task_results["C_CLASS_ALARM"]["reliability"]["p_0_5"]["gap"]-0.25)<1e-12
        },
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH20",
        "version":"0.1.0",
        "verdict":"PASS_AH20" if passed==len(checks) else "FAIL_AH20",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "failure_sets":len(COALITIONS),
        "tasks":task_results,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "histories":len(cases),
        "failure_sets":len(COALITIONS),
        "tasks":{
            k:{
                "cap_cuts":v["capability_minimal_cuts"],
                "policy_cuts":v["policy_minimal_cuts"],
                "policy_induced_singletons":v["policy_induced_singleton_cuts"],
                "cap_poly":v["capability_reliability_coeffs"],
                "policy_poly":v["policy_reliability_coeffs"],
                "p0.1":v["reliability"]["p_0_1"],
            }
            for k,v in task_results.items()
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH20":
        raise SystemExit(1)

if __name__=="__main__":
    main()
