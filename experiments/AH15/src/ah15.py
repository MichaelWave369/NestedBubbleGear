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

def canonical(obj) -> bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def sha(obj) -> str:
    return hashlib.sha256(canonical(obj)).hexdigest()

C=mul(A,B)
BASE={"I":I,"A":A,"B":B,"S":S}
K_VALUES=(-1,0,1)

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
        "action":(H2,H3),
        "P2":P2,
        "H3":H3,
        "residue":R,
        "G":G,
    }

def functional_map(cases, source_key, target_key):
    groups=defaultdict(set)
    for c in cases:
        groups[c[source_key]].add(c[target_key])
    if any(len(v)!=1 for v in groups.values()):
        return None
    return {k:next(iter(v)) for k,v in groups.items()}

def final_receipt(role,descriptor,value):
    body={
        "experiment":"NBG-AH15",
        "version":"0.1.0",
        "role":role,
        "descriptor":descriptor,
        "memory":value,
    }
    body["receipt_hash"]=sha(body)
    return body

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    action=[c["action"] for c in cases]
    p2=[c["P2"] for c in cases]
    h3=[c["H3"] for c in cases]
    residue=[c["residue"] for c in cases]
    g=[c["G"] for c in cases]

    action_to_p2=functional_map(cases,"action","P2")
    p2_to_h3=functional_map(cases,"P2","H3")
    action_to_h3=functional_map(cases,"action","H3")
    residue_to_p2=functional_map(cases,"residue","P2")
    p2_to_g=functional_map(cases,"P2","G")

    sequential=[
        p2_to_h3[action_to_p2[c["action"]]]
        for c in cases
    ]
    direct=[action_to_h3[c["action"]] for c in cases]

    final_receipts_direct=[
        canonical(final_receipt("DOWNSTREAM","H3",v))
        for v in direct
    ]
    final_receipts_sequential=[
        canonical(final_receipt("DOWNSTREAM","H3",v))
        for v in sequential
    ]

    p2_hash_map={x:sha(x) for x in set(p2)}
    p2_hashes=[p2_hash_map[x] for x in p2]

    final_hashes=[
        final_receipt("DOWNSTREAM","H3",x)["receipt_hash"]
        for x in h3
    ]

    h_p2_given_h3=conditional_entropy(p2,h3)
    h_p2_given_final=conditional_entropy(
        p2,
        list(zip(h3,final_hashes))
    )
    h_p2_given_mid=conditional_entropy(
        p2,
        list(zip(h3,p2_hashes))
    )

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"suite:action_15_classes","pass":len(set(action))==15},
        {"name":"suite:P2_13_classes","pass":len(set(p2))==13},
        {"name":"suite:H3_9_classes","pass":len(set(h3))==9},
        {"name":"entropy:action_3p875","pass":abs(entropy(action)-3.875)<1e-12},
        {"name":"entropy:P2_3p625","pass":abs(entropy(p2)-3.625)<1e-12},
        {"name":"entropy:H3_3p0778","pass":abs(entropy(h3)-3.077819531114783)<1e-12},
        {"name":"chain:action_to_P2_functional","pass":action_to_p2 is not None},
        {"name":"chain:P2_to_H3_functional","pass":p2_to_h3 is not None},
        {"name":"chain:action_to_H3_functional","pass":action_to_h3 is not None},
        {"name":"chain:direct_equals_sequential","pass":direct==sequential==h3},
        {"name":"chain:final_receipt_path_independent","pass":final_receipts_direct==final_receipts_sequential},
        {"name":"control:route_downstream_to_route_no_memory_change","pass":p2==p2},
        {"name":"barrier:residue_to_P2_not_functional","pass":residue_to_p2 is None},
        {"name":"barrier:P2_to_G_not_functional","pass":p2_to_g is None},
        {"name":"barrier:H_P2_given_residue_0p25","pass":abs(conditional_entropy(p2,residue)-0.25)<1e-12},
        {"name":"barrier:H_G_given_P2_0p25","pass":abs(conditional_entropy(g,p2)-0.25)<1e-12},
        {"name":"receipt:13_unique_mid_hashes","pass":len(set(p2_hash_map.values()))==13},
        {"name":"receipt:H_P2_given_H3_expected","pass":abs(h_p2_given_h3-0.5471804688852168)<1e-12},
        {"name":"receipt:final_hash_adds_nothing","pass":abs(h_p2_given_final-h_p2_given_h3)<1e-12},
        {"name":"receipt:mid_hash_restores_P2","pass":h_p2_given_mid<1e-12},
    ]

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH15",
        "version":"0.1.0",
        "verdict":"PASS_AH15" if passed==len(checks) else "FAIL_AH15",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "memory_ladder":{
            "FULL":{"classes":len(set(action)),"entropy_bits":entropy(action)},
            "ROUTE_DOWNSTREAM":{"classes":len(set(p2)),"entropy_bits":entropy(p2)},
            "DOWNSTREAM":{"classes":len(set(h3)),"entropy_bits":entropy(h3)},
        },
        "path_independence":{
            "direct_equals_sequential":direct==sequential,
            "final_receipts_equal":final_receipts_direct==final_receipts_sequential,
        },
        "reauthorization_barriers":{
            "GLOBAL_to_ROUTE_local":residue_to_p2 is not None,
            "ROUTE_to_GLOBAL_local":p2_to_g is not None,
            "H_P2_given_residue_bits":conditional_entropy(p2,residue),
            "H_G_given_P2_bits":conditional_entropy(g,p2),
        },
        "receipt_hazard":{
            "P2_classes":len(set(p2)),
            "unique_mid_hashes":len(set(p2_hash_map.values())),
            "H_P2_given_H3_bits":h_p2_given_h3,
            "H_P2_given_H3_final_receipt_bits":h_p2_given_final,
            "H_P2_given_H3_mid_receipt_bits":h_p2_given_mid,
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "memory_ladder":result["memory_ladder"],
        "path_independence":result["path_independence"],
        "reauthorization_barriers":result["reauthorization_barriers"],
        "receipt_hazard":result["receipt_hazard"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH15":
        raise SystemExit(1)

if __name__=="__main__":
    main()
