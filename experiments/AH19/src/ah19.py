#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from itertools import combinations
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
        "expected_access":(
            ("E1","E2"),
            ("E2","E3"),
            ("E1","E2","E3"),
        ),
        "expected_minimal":(
            ("E1","E2"),
            ("E2","E3"),
        ),
        "expected_core":("E2",),
        "policy_minimal":(("E1","E2"),),
    },
    "GLOBAL_REAUTH":{
        "target":"G",
        "local":"P2",
        "expected_access":(
            ("E1","E2"),
            ("E2","E3"),
            ("E1","E2","E3"),
        ),
        "expected_minimal":(
            ("E1","E2"),
            ("E2","E3"),
        ),
        "expected_core":("E2",),
        "policy_minimal":(("E1","E2"),),
    },
    "ROUTE_REAUTH":{
        "target":"P2",
        "local":"H3",
        "expected_access":(
            ("E1","E2"),
            ("E2","E3"),
            ("E1","E2","E3"),
        ),
        "expected_minimal":(
            ("E1","E2"),
            ("E2","E3"),
        ),
        "expected_core":("E2",),
        "policy_minimal":(("E2","E3"),),
    },
    "C_CLASS_ALARM":{
        "target":"CFLAG",
        "local":None,
        "expected_access":(
            ("E1",),
            ("E3",),
            ("E1","E2"),
            ("E1","E3"),
            ("E2","E3"),
            ("E1","E2","E3"),
        ),
        "expected_minimal":(
            ("E1",),
            ("E3",),
        ),
        "expected_core":(),
        "policy_minimal":(("E3",),),
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

def access_report(cases, task_cfg):
    target=values(cases,task_cfg["target"])
    entropies={}
    capable=[]
    for coalition in COALITIONS:
        h=conditional_entropy(target,descriptor(cases,task_cfg["local"],coalition))
        entropies[coalition]=h
        if h < 1e-12:
            capable.append(coalition)

    capable=tuple(capable)
    minimal=tuple(
        c for c in capable
        if not any(set(d) < set(c) for d in capable)
    )

    if minimal:
        core=set(minimal[0])
        for c in minimal[1:]:
            core &= set(c)
        core=tuple(s for s in SHARES if s in core)
    else:
        core=()

    return {
        "entropies":entropies,
        "capable":capable,
        "minimal":minimal,
        "core":core,
    }

def upward_closed(family):
    fam=set(family)
    for c in family:
        sc=set(c)
        for d in COALITIONS:
            if sc.issubset(set(d)) and d not in fam:
                return False
    return True

def policy_family(minimal_authorized):
    return tuple(
        c for c in COALITIONS
        if any(set(m).issubset(set(c)) for m in minimal_authorized)
    )

def serialize_coalitions(items):
    return [list(c) for c in items]

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"suite:8_coalitions","pass":len(COALITIONS)==8},
    ]

    task_results={}

    for task,cfg in TASKS.items():
        report=access_report(cases,cfg)
        policy=policy_family(cfg["policy_minimal"])

        checks.extend([
            {"name":f"{task}:access_exact","pass":report["capable"]==cfg["expected_access"]},
            {"name":f"{task}:minimal_exact","pass":report["minimal"]==cfg["expected_minimal"]},
            {"name":f"{task}:core_exact","pass":report["core"]==cfg["expected_core"]},
            {"name":f"{task}:access_upward_closed","pass":upward_closed(report["capable"])},
            {"name":f"{task}:policy_upward_closed","pass":upward_closed(policy)},
            {"name":f"{task}:policy_subset_capability","pass":set(policy).issubset(set(report["capable"]))},
            {"name":f"{task}:policy_strict_subset","pass":set(policy)<set(report["capable"])},
        ])

        # Every minimal capable coalition must itself be sufficient, with every strict subset insufficient.
        for i,c in enumerate(report["minimal"]):
            checks.append({
                "name":f"{task}:minimal_{i}_sufficient",
                "pass":report["entropies"][c] < 1e-12
            })
            for d in COALITIONS:
                if set(d) < set(c):
                    checks.append({
                        "name":f"{task}:minimal_{i}_subset_{'+'.join(d) or 'EMPTY'}_insufficient",
                        "pass":report["entropies"][d] > 0
                    })

        task_results[task]={
            "target":cfg["target"],
            "local":cfg["local"],
            "conditional_entropy_bits":{
                "+".join(c) if c else "EMPTY":report["entropies"][c]
                for c in COALITIONS
            },
            "capable_coalitions":serialize_coalitions(report["capable"]),
            "minimal_capable_coalitions":serialize_coalitions(report["minimal"]),
            "mandatory_core":list(report["core"]),
            "policy_authorized_coalitions":serialize_coalitions(policy),
            "policy_minimal_coalitions":serialize_coalitions(cfg["policy_minimal"]),
        }

    # Cross-task structure comparisons.
    h2=task_results["H2_FULL"]["capable_coalitions"]
    glob=task_results["GLOBAL_REAUTH"]["capable_coalitions"]
    route=task_results["ROUTE_REAUTH"]["capable_coalitions"]
    alarm=task_results["C_CLASS_ALARM"]["capable_coalitions"]

    checks.extend([
        {"name":"cross:H2_equals_GLOBAL","pass":h2==glob},
        {"name":"cross:H2_equals_ROUTE","pass":h2==route},
        {"name":"cross:ALARM_differs_from_H2","pass":alarm!=h2},
        {"name":"cross:E2_mandatory_full_tasks","pass":
            task_results["H2_FULL"]["mandatory_core"]==["E2"] and
            task_results["GLOBAL_REAUTH"]["mandatory_core"]==["E2"] and
            task_results["ROUTE_REAUTH"]["mandatory_core"]==["E2"]
        },
        {"name":"cross:ALARM_no_mandatory_share","pass":
            task_results["C_CLASS_ALARM"]["mandatory_core"]==[]
        },
        {"name":"cross:E1_and_E3_singleton_alarm_capable","pass":
            ["E1"] in alarm and ["E3"] in alarm
        },
        {"name":"cross:E2_singleton_alarm_insufficient","pass":
            ["E2"] not in alarm
        },
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH19",
        "version":"0.1.0",
        "verdict":"PASS_AH19" if passed==len(checks) else "FAIL_AH19",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "keyholes":list(SHARES),
        "coalition_count":len(COALITIONS),
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
        "coalition_count":len(COALITIONS),
        "tasks":{
            name:{
                "capable":tr["capable_coalitions"],
                "minimal":tr["minimal_capable_coalitions"],
                "core":tr["mandatory_core"],
                "policy":tr["policy_authorized_coalitions"],
            }
            for name,tr in task_results.items()
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH19":
        raise SystemExit(1)

if __name__=="__main__":
    main()
