#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
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
        raise ValueError("frozen model requires determinant +1")
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

def trace(X: Matrix) -> int:
    return X[0][0]+X[1][1]

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

def sufficient(targets, descriptors) -> bool:
    return conditional_entropy(targets,descriptors) < 1e-12

def mlist(X: Matrix):
    return [list(X[0]),list(X[1])]

C: Matrix = mul(A,B)

BASE: dict[str,Matrix] = {
    "I":I,
    "A":A,
    "B":B,
    "S":S,
}

K_VALUES=(-1,0,1)

def make_case(U_name: str, U: Matrix, V_name: str, V: Matrix, k: int) -> dict:
    T1=mul(U,power(B,k))
    T2=mul(power(B,-k),V)
    P2=mul(T1,T2)

    H2=conjugate(T1,B)
    H3=conjugate(P2,C)
    R=mul(H3,H2)
    G=mul(R,A)

    descriptors={
        "label":(U_name,V_name,k),
        "raw":(T1,T2),
        "prefix":(T1,P2),
        "action":(H2,H3),
        "residue":R,
        "cumulative":P2,
        "H2":H2,
        "H3":H3,
        "trace":(trace(H2),trace(H3)),
    }

    targets={
        "G":G,
        "H2":H2,
        "H3":H3,
        "P2":P2,
        "ALL":(G,H2,H3,P2),
    }

    return {
        "label":(U_name,V_name,k),
        "T1":T1,
        "T2":T2,
        "P2":P2,
        "H2":H2,
        "H3":H3,
        "R":R,
        "G":G,
        "descriptors":descriptors,
        "targets":targets,
    }

def report(cases, task: str, descriptor: str) -> dict:
    targets=[c["targets"][task] for c in cases]
    values=[c["descriptors"][descriptor] for c in cases]
    return {
        "descriptor_classes":len(set(values)),
        "descriptor_entropy_bits":entropy(values),
        "target_classes":len(set(targets)),
        "target_entropy_bits":entropy(targets),
        "conditional_entropy_bits":conditional_entropy(targets,values),
        "sufficient":sufficient(targets,values),
    }

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    descriptor_names=("label","raw","prefix","action","residue","cumulative","H2","H3","trace")
    task_names=("G","H2","H3","P2","ALL")

    matrix={
        task:{
            desc:report(cases,task,desc)
            for desc in descriptor_names
        }
        for task in task_names
    }

    expected_coarsest={
        "G":("residue",13,3.625),
        "H2":("H2",3,1.5),
        "H3":("H3",9,3.077819531114783),
        "P2":("cumulative",13,3.625),
        "ALL":("action",15,3.875),
    }

    checks=[]

    for task,(desc,classes,hbits) in expected_coarsest.items():
        r=matrix[task][desc]
        checks.extend([
            {"name":f"{task}:chosen_sufficient","pass":r["sufficient"]},
            {"name":f"{task}:chosen_classes","pass":r["descriptor_classes"]==classes},
            {"name":f"{task}:chosen_entropy","pass":abs(r["descriptor_entropy_bits"]-hbits)<1e-12},
            {"name":f"{task}:coarsest_candidate","pass":
                all(
                    (not matrix[task][d]["sufficient"]) or
                    matrix[task][d]["descriptor_classes"]>=classes
                    for d in descriptor_names
                )
            },
        ])

    checks.extend([
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"cross:residue_G_zero","pass":matrix["G"]["residue"]["conditional_entropy_bits"]<1e-12},
        {"name":"cross:residue_H2_0p25","pass":abs(matrix["H2"]["residue"]["conditional_entropy_bits"]-0.25)<1e-12},
        {"name":"cross:residue_P2_0p25","pass":abs(matrix["P2"]["residue"]["conditional_entropy_bits"]-0.25)<1e-12},
        {"name":"cross:cumulative_G_0p25","pass":abs(matrix["G"]["cumulative"]["conditional_entropy_bits"]-0.25)<1e-12},
        {"name":"broad:action_sufficient","pass":matrix["ALL"]["action"]["sufficient"]},
        {"name":"broad:residue_insufficient","pass":not matrix["ALL"]["residue"]["sufficient"]},
        {"name":"broad:cumulative_insufficient","pass":not matrix["ALL"]["cumulative"]["sufficient"]},
        {"name":"broad:15_classes","pass":matrix["ALL"]["action"]["descriptor_classes"]==15 and matrix["ALL"]["action"]["target_classes"]==15},
    ])

    # Witness A: same residue/global, different H2 and P2.
    wa=next(c for c in cases if c["label"]==("I","A",-1))
    wb=next(c for c in cases if c["label"]==("S","S",-1))
    checks.extend([
        {"name":"witness_residue:same_R","pass":wa["R"]==wb["R"]==((2,-1),(1,0))},
        {"name":"witness_residue:same_G","pass":wa["G"]==wb["G"]==((2,1),(1,1))},
        {"name":"witness_residue:different_H2","pass":wa["H2"]!=wb["H2"]},
        {"name":"witness_residue:different_P2","pass":wa["P2"]!=wb["P2"]},
    ])

    # Witness B: same cumulative, different global.
    ca=next(c for c in cases if c["label"]==("I","A",0))
    cb=next(c for c in cases if c["label"]==("A","I",0))
    checks.extend([
        {"name":"witness_cumulative:same_P2","pass":ca["P2"]==cb["P2"]==A},
        {"name":"witness_cumulative:different_G","pass":ca["G"]!=cb["G"]},
    ])

    passed=sum(c["pass"] for c in checks)

    def clean_case(c):
        return {
            "label":list(c["label"]),
            "P2":mlist(c["P2"]),
            "H2":mlist(c["H2"]),
            "H3":mlist(c["H3"]),
            "R":mlist(c["R"]),
            "G":mlist(c["G"]),
        }

    result={
        "experiment":"NBG-AH12",
        "version":"0.1.0",
        "verdict":"PASS_AH12" if passed==len(checks) else "FAIL_AH12",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "query_families":{
            task:{
                "chosen_descriptor":expected_coarsest[task][0],
                "chosen_report":matrix[task][expected_coarsest[task][0]],
            }
            for task in task_names
        },
        "cross_task":{
            "H_G_given_residue":matrix["G"]["residue"]["conditional_entropy_bits"],
            "H_H2_given_residue":matrix["H2"]["residue"]["conditional_entropy_bits"],
            "H_P2_given_residue":matrix["P2"]["residue"]["conditional_entropy_bits"],
            "H_G_given_cumulative":matrix["G"]["cumulative"]["conditional_entropy_bits"],
        },
        "sufficiency_matrix":matrix,
        "residue_witness":{
            "history_1":clean_case(wa),
            "history_2":clean_case(wb),
        },
        "cumulative_witness":{
            "history_1":clean_case(ca),
            "history_2":clean_case(cb),
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "histories":len(cases),
        "query_families":{
            q:{
                "descriptor":result["query_families"][q]["chosen_descriptor"],
                "classes":result["query_families"][q]["chosen_report"]["descriptor_classes"],
                "entropy":result["query_families"][q]["chosen_report"]["descriptor_entropy_bits"],
            }
            for q in task_names
        },
        "cross_task":result["cross_task"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH12":
        raise SystemExit(1)

if __name__=="__main__":
    main()
