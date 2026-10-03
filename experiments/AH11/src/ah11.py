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

def matrix_list(X: Matrix):
    return [list(X[0]),list(X[1])]

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

C: Matrix = mul(A,B)

BASE: dict[str,Matrix] = {
    "I":I,
    "A":A,
    "B":B,
    "S":S,
}

K_VALUES=(-1,0,1)

def case(U_name: str, U: Matrix, V_name: str, V: Matrix, k: int) -> dict:
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

    return {
        "U_name":U_name,
        "V_name":V_name,
        "k":k,
        "T1":matrix_list(T1),
        "T2":matrix_list(T2),
        "P2":matrix_list(P2),
        "H2_at_0":matrix_list(H2),
        "H3_at_0":matrix_list(H3),
        "residue_R":matrix_list(R),
        "global_G":matrix_list(G),
        "_descriptors":descriptors,
        "_G":G,
    }

def descriptor_report(cases, key: str) -> dict:
    targets=[c["_G"] for c in cases]
    values=[c["_descriptors"][key] for c in cases]
    return {
        "classes":len(set(values)),
        "entropy_bits":entropy(values),
        "conditional_global_entropy_bits":conditional_entropy(targets,values),
        "sufficient":sufficient(targets,values),
    }

def main():
    cases=[
        case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    reports={key:descriptor_report(cases,key) for key in (
        "label","raw","prefix","action","residue",
        "cumulative","H2","H3","trace"
    )}

    targets=[c["_G"] for c in cases]
    global_entropy=entropy(targets)
    global_classes=len(set(targets))

    # Same cumulative transport but different global result.
    witness_a=next(c for c in cases if c["U_name"]=="I" and c["V_name"]=="A" and c["k"]==0)
    witness_b=next(c for c in cases if c["U_name"]=="A" and c["V_name"]=="I" and c["k"]==0)

    # Gauge-like k family for fixed base pair A,B.
    gauge=[c for c in cases if c["U_name"]=="A" and c["V_name"]=="B"]
    gauge_same_P2=len({json.dumps(c["P2"]) for c in gauge})==1
    gauge_same_action=len({json.dumps((c["H2_at_0"],c["H3_at_0"])) for c in gauge})==1
    gauge_same_residue=len({json.dumps(c["residue_R"]) for c in gauge})==1
    gauge_same_global=len({json.dumps(c["global_G"]) for c in gauge})==1
    gauge_distinct_labels=len({(c["U_name"],c["V_name"],c["k"]) for c in gauge})==3

    expected={
        "label":(48,True),
        "raw":(46,True),
        "prefix":(46,True),
        "action":(15,True),
        "residue":(13,True),
        "cumulative":(13,False),
        "H2":(3,False),
        "H3":(9,False),
        "trace":(1,False),
    }

    checks=[]
    for key,(classes,suff) in expected.items():
        checks.extend([
            {"name":f"{key}:class_count","pass":reports[key]["classes"]==classes},
            {"name":f"{key}:sufficiency","pass":reports[key]["sufficient"]==suff},
        ])

    checks.extend([
        {"name":"suite:48_labeled_histories","pass":len(cases)==48},
        {"name":"suite:13_global_classes","pass":global_classes==13},
        {"name":"entropy:global_3p625","pass":abs(global_entropy-3.625)<1e-12},
        {"name":"entropy:label_log2_48","pass":abs(reports["label"]["entropy_bits"]-math.log2(48))<1e-12},
        {"name":"entropy:action_3p875","pass":abs(reports["action"]["entropy_bits"]-3.875)<1e-12},
        {"name":"entropy:residue_3p625","pass":abs(reports["residue"]["entropy_bits"]-3.625)<1e-12},
        {"name":"entropy:residue_conditional_zero","pass":reports["residue"]["conditional_global_entropy_bits"]<1e-12},
        {"name":"entropy:cumulative_conditional_0p25","pass":abs(reports["cumulative"]["conditional_global_entropy_bits"]-0.25)<1e-12},
        {"name":"witness:same_cumulative","pass":witness_a["P2"]==witness_b["P2"]==[[1,1],[0,1]]},
        {"name":"witness:different_global","pass":witness_a["global_G"]==[[2,1],[1,1]] and witness_b["global_G"]==[[5,2],[2,1]]},
        {"name":"gauge:three_distinct_labels","pass":gauge_distinct_labels},
        {"name":"gauge:same_P2","pass":gauge_same_P2},
        {"name":"gauge:same_action","pass":gauge_same_action},
        {"name":"gauge:same_residue","pass":gauge_same_residue},
        {"name":"gauge:same_global","pass":gauge_same_global},
        {"name":"coarsest_candidate:residue","pass":
            reports["residue"]["sufficient"] and
            all(
                (not reports[key]["sufficient"]) or reports[key]["classes"]>=reports["residue"]["classes"]
                for key in reports
            )
        },
    ])

    passed=sum(c["pass"] for c in checks)

    clean_cases=[]
    for c in cases:
        clean={k:v for k,v in c.items() if not k.startswith("_")}
        clean_cases.append(clean)

    result={
        "experiment":"NBG-AH11",
        "version":"0.1.0",
        "verdict":"PASS_AH11" if passed==len(checks) else "FAIL_AH11",
        "checks_passed":passed,
        "checks_total":len(checks),
        "labeled_histories":len(cases),
        "global_classes":global_classes,
        "global_entropy_bits":global_entropy,
        "descriptor_reports":reports,
        "same_capacity_wrong_information_witness":{
            "history_IA":{k:v for k,v in witness_a.items() if not k.startswith("_")},
            "history_AI":{k:v for k,v in witness_b.items() if not k.startswith("_")},
        },
        "gauge_like_family_AB":[{k:v for k,v in c.items() if not k.startswith("_")} for c in gauge],
        "cases":clean_cases,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "labeled_histories":len(cases),
        "global_classes":global_classes,
        "global_entropy_bits":global_entropy,
        "descriptor_reports":reports,
        "witness_P2":witness_a["P2"],
        "witness_G_IA":witness_a["global_G"],
        "witness_G_AI":witness_b["global_G"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH11":
        raise SystemExit(1)

if __name__=="__main__":
    main()
