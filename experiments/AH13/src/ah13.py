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

def mutual_information(targets, descriptors) -> float:
    return entropy(targets)-conditional_entropy(targets,descriptors)

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

def make_case(U_name: str, U: Matrix, V_name: str, V: Matrix, k: int) -> dict:
    T1=mul(U,power(B,k))
    T2=mul(power(B,-k),V)
    P2=mul(T1,T2)

    H2=conjugate(T1,B)
    H3=conjugate(P2,C)
    R=mul(H3,H2)
    G=mul(R,A)

    return {
        "label":(U_name,V_name,k),
        "queries":{
            "G":G,
            "H2":H2,
            "H3":H3,
            "P2":P2,
        },
        "descriptors":{
            "label":(U_name,V_name,k),
            "raw":(T1,T2),
            "prefix":(T1,P2),
            "action":(H2,H3),
            "residue":R,
            "cumulative":P2,
            "H2":H2,
            "H3":H3,
            "trace":(
                H2[0][0]+H2[1][1],
                H3[0][0]+H3[1][1],
            ),
        },
    }

QUERY_ORDER=("G","H2","H3","P2")
DESCRIPTORS=("label","raw","prefix","action","residue","cumulative","H2","H3","trace")

ROLES={
    "GLOBAL_OPERATOR":{
        "authorized":("G",),
        "descriptor":"residue",
        "classes":13,
        "entropy":3.625,
        "full_excess":0.25,
    },
    "INTERFACE_INSPECTOR":{
        "authorized":("H2",),
        "descriptor":"H2",
        "classes":3,
        "entropy":1.5,
        "full_excess":2.375,
    },
    "DOWNSTREAM_INSPECTOR":{
        "authorized":("H3",),
        "descriptor":"H3",
        "classes":9,
        "entropy":3.077819531114783,
        "full_excess":0.7971804688852169,
    },
    "ROUTE_AUDITOR":{
        "authorized":("P2",),
        "descriptor":"cumulative",
        "classes":13,
        "entropy":3.625,
        "full_excess":0.25,
    },
    "FULL_AUDITOR":{
        "authorized":QUERY_ORDER,
        "descriptor":"action",
        "classes":15,
        "entropy":3.875,
        "full_excess":0.0,
    },
}

def tuple_query(case, keys):
    return tuple(case["queries"][k] for k in keys)

def descriptor_values(cases, name):
    return [c["descriptors"][name] for c in cases]

def query_values(cases, keys):
    return [tuple_query(c,keys) for c in cases]

def descriptor_report(cases, authorized, descriptor):
    q=query_values(cases,authorized)
    d=descriptor_values(cases,descriptor)
    return {
        "classes":len(set(d)),
        "entropy_bits":entropy(d),
        "conditional_authorized_entropy_bits":conditional_entropy(q,d),
        "sufficient":sufficient(q,d),
    }

def leakage_report(cases, authorized, descriptor):
    unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
    if not unauthorized:
        return {
            "unauthorized_queries":[],
            "unauthorized_entropy_bits":0.0,
            "leakage_bits":0.0,
            "floor_bits":0.0,
            "excess_bits":0.0,
        }

    unauthorized_values=query_values(cases,unauthorized)
    authorized_values=query_values(cases,authorized)
    d=descriptor_values(cases,descriptor)

    leakage=mutual_information(unauthorized_values,d)
    floor=mutual_information(unauthorized_values,authorized_values)

    return {
        "unauthorized_queries":list(unauthorized),
        "unauthorized_entropy_bits":entropy(unauthorized_values),
        "leakage_bits":leakage,
        "floor_bits":floor,
        "excess_bits":leakage-floor,
    }

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    checks=[]
    role_results={}

    full_entropy=entropy(descriptor_values(cases,"action"))

    for role,cfg in ROLES.items():
        authorized=cfg["authorized"]
        selected=cfg["descriptor"]
        selected_report=descriptor_report(cases,authorized,selected)
        selected_leak=leakage_report(cases,authorized,selected)
        full_leak=leakage_report(cases,authorized,"action")

        checks.extend([
            {"name":f"{role}:selected_sufficient","pass":selected_report["sufficient"]},
            {"name":f"{role}:selected_classes","pass":selected_report["classes"]==cfg["classes"]},
            {"name":f"{role}:selected_entropy","pass":abs(selected_report["entropy_bits"]-cfg["entropy"])<1e-12},
            {"name":f"{role}:coarsest_candidate","pass":
                all(
                    (not descriptor_report(cases,authorized,d)["sufficient"]) or
                    descriptor_report(cases,authorized,d)["classes"]>=cfg["classes"]
                    for d in DESCRIPTORS
                )
            },
        ])

        if role!="FULL_AUDITOR":
            checks.extend([
                {"name":f"{role}:retains_less_than_full","pass":selected_report["entropy_bits"]<full_entropy},
                {"name":f"{role}:selected_zero_excess","pass":abs(selected_leak["excess_bits"])<1e-12},
                {"name":f"{role}:full_positive_excess","pass":abs(full_leak["excess_bits"]-cfg["full_excess"])<1e-12 and full_leak["excess_bits"]>0},
            ])
        else:
            checks.append({"name":"FULL_AUDITOR:full_entropy","pass":abs(full_entropy-3.875)<1e-12})

        role_results[role]={
            "authorized_queries":list(authorized),
            "selected_descriptor":selected,
            "selected_report":selected_report,
            "selected_leakage":selected_leak,
            "full_action_leakage":full_leak,
            "retention_reduction_bits":full_entropy-selected_report["entropy_bits"],
        }

    # Capability-versus-authority witnesses.
    h2_values=query_values(cases,("H2",))
    g_values=query_values(cases,("G",))
    residue_values=descriptor_values(cases,"residue")
    p2_values=query_values(cases,("P2",))

    checks.extend([
        {"name":"witness:H2_self_exact","pass":conditional_entropy(h2_values,descriptor_values(cases,"H2"))<1e-12},
        {"name":"witness:G_given_H2_2p375","pass":abs(conditional_entropy(g_values,descriptor_values(cases,"H2"))-2.375)<1e-12},
        {"name":"witness:G_given_residue_zero","pass":conditional_entropy(g_values,residue_values)<1e-12},
        {"name":"witness:H2_given_residue_0p25","pass":abs(conditional_entropy(h2_values,residue_values)-0.25)<1e-12},
        {"name":"witness:P2_given_residue_0p25","pass":abs(conditional_entropy(p2_values,residue_values)-0.25)<1e-12},
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"suite:capability_action_15_classes","pass":len(set(descriptor_values(cases,"action")))==15},
        {"name":"suite:capability_action_3p875_bits","pass":abs(full_entropy-3.875)<1e-12},
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH13",
        "version":"0.1.0",
        "verdict":"PASS_AH13" if passed==len(checks) else "FAIL_AH13",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "capability":{
            "queries":list(QUERY_ORDER),
            "descriptor":"action",
            "classes":15,
            "entropy_bits":full_entropy,
        },
        "roles":role_results,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "histories":len(cases),
        "capability":result["capability"],
        "roles":{
            role:{
                "descriptor":rr["selected_descriptor"],
                "classes":rr["selected_report"]["classes"],
                "entropy":rr["selected_report"]["entropy_bits"],
                "retention_reduction":rr["retention_reduction_bits"],
                "selected_excess_leakage":rr["selected_leakage"]["excess_bits"],
                "full_action_excess_leakage":rr["full_action_leakage"]["excess_bits"],
            }
            for role,rr in role_results.items()
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH13":
        raise SystemExit(1)

if __name__=="__main__":
    main()
