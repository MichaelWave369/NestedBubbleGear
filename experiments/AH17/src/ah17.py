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

def mutual_information(targets, descriptors) -> float:
    return entropy(targets)-conditional_entropy(targets,descriptors)

def canonical(obj) -> bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def sha(obj) -> str:
    return hashlib.sha256(canonical(obj)).hexdigest()

C=mul(A,B)
BASE={"I":I,"A":A,"B":B,"S":S}
K_VALUES=(-1,0,1)
QUERY_ORDER=("G","H2","H3","P2")

GRANTS={
    "ROUTE_TO_GLOBAL":{
        "local":"P2",
        "target":"G",
        "target_role":"GLOBAL",
        "release":"residue",
        "baseline":0.25,
        "share1":0.125,
        "share2":0.125,
    },
    "DOWNSTREAM_TO_ROUTE":{
        "local":"H3",
        "target":"P2",
        "target_role":"ROUTE",
        "release":"P2",
        "baseline":0.5471804688852168,
        "share1":0.25,
        "share2":0.25,
    },
}

TARGET_ROLE_QUERIES={
    "GLOBAL":("G",),
    "ROUTE":("P2",),
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
        "G":G,
        "H2":H2,
        "H3":H3,
        "P2":P2,
        "residue":R,
        "E1":H2[0][0],
        "E2":H2[1][0],
    }

def qtuple(c,keys):
    return tuple(c[k] for k in keys)

def values(cases,key):
    return [c[key] for c in cases]

def functional_map(cases,source_keys,target_key):
    groups=defaultdict(set)
    for c in cases:
        source=tuple(c[k] for k in source_keys)
        groups[source].add(c[target_key])
    if any(len(v)!=1 for v in groups.values()):
        return None
    return {k:next(iter(v)) for k,v in groups.items()}

def excess_leakage(cases,target_role,descriptor_key):
    authorized=TARGET_ROLE_QUERIES[target_role]
    unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
    y=[qtuple(c,unauthorized) for c in cases]
    q=[qtuple(c,authorized) for c in cases]
    d=values(cases,descriptor_key)
    return mutual_information(y,d)-mutual_information(y,q)

def grant_receipt(grant_id,target_role,descriptor,value):
    body={
        "experiment":"NBG-AH17",
        "version":"0.1.2",
        "grant_id":grant_id,
        "target_role":target_role,
        "descriptor":descriptor,
        "released_memory":value,
        "share_count":2,
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

    e1=values(cases,"E1")
    e2=values(cases,"E2")
    h2=values(cases,"H2")

    pair_to_h2=functional_map(cases,("E1","E2"),"H2")

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"shares:E1_2_classes","pass":len(set(e1))==2},
        {"name":"shares:E2_2_classes","pass":len(set(e2))==2},
        {"name":"shares:joint_3_classes","pass":len(set(zip(e1,e2)))==3},
        {"name":"shares:H2_3_classes","pass":len(set(h2))==3},
        {"name":"shares:E1_entropy","pass":abs(entropy(e1)-0.8112781244591328)<1e-12},
        {"name":"shares:E2_entropy","pass":abs(entropy(e2)-0.8112781244591328)<1e-12},
        {"name":"shares:joint_entropy_1p5","pass":abs(entropy(list(zip(e1,e2)))-1.5)<1e-12},
        {"name":"shares:joint_recovers_H2","pass":pair_to_h2 is not None},
        {"name":"shares:H_H2_given_joint_zero","pass":conditional_entropy(h2,list(zip(e1,e2)))<1e-12},
    ]

    grant_results={}

    for gid,cfg in GRANTS.items():
        local=values(cases,cfg["local"])
        target=values(cases,cfg["target"])
        release=values(cases,cfg["release"])

        h0=conditional_entropy(target,local)
        h1=conditional_entropy(target,list(zip(local,e1)))
        h2c=conditional_entropy(target,list(zip(local,e2)))
        h12=conditional_entropy(target,list(zip(local,e1,e2)))

        release_map=functional_map(cases,(cfg["local"],"E1","E2"),cfg["release"])
        derived=[
            release_map[(c[cfg["local"]],c["E1"],c["E2"])]
            for c in cases
        ]

        target_given_release=conditional_entropy(target,release)
        selected_excess=excess_leakage(cases,cfg["target_role"],cfg["release"])

        receipts=[
            grant_receipt(gid,cfg["target_role"],cfg["release"],v)
            for v in release
        ]
        receipt_hashes=[r["receipt_hash"] for r in receipts]

        authorized=TARGET_ROLE_QUERIES[cfg["target_role"]]
        unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
        y=[qtuple(c,unauthorized) for c in cases]

        h_y_release=conditional_entropy(y,release)
        h_y_receipt=conditional_entropy(y,list(zip(release,receipt_hashes)))

        checks.extend([
            {"name":f"{gid}:baseline","pass":abs(h0-cfg["baseline"])<1e-12 and h0>0},
            {"name":f"{gid}:share1_insufficient","pass":abs(h1-cfg["share1"])<1e-12 and h1>0},
            {"name":f"{gid}:share2_insufficient","pass":abs(h2c-cfg["share2"])<1e-12 and h2c>0},
            {"name":f"{gid}:joint_sufficient","pass":h12<1e-12},
            {"name":f"{gid}:release_functional","pass":release_map is not None},
            {"name":f"{gid}:derived_release_exact","pass":derived==release},
            {"name":f"{gid}:release_answers_target","pass":target_given_release<1e-12},
            {"name":f"{gid}:selected_zero_excess","pass":abs(selected_excess)<1e-12},
            {"name":f"{gid}:receipt_no_extra","pass":abs(h_y_receipt-h_y_release)<1e-12},
        ])

        grant_results[gid]={
            "local_descriptor":cfg["local"],
            "target_query":cfg["target"],
            "target_role":cfg["target_role"],
            "released_descriptor":cfg["release"],
            "baseline_conditional_bits":h0,
            "share1_conditional_bits":h1,
            "share2_conditional_bits":h2c,
            "joint_conditional_bits":h12,
            "release_target_conditional_bits":target_given_release,
            "selected_excess_leakage_bits":selected_excess,
            "unauthorized_conditional_after_release_bits":h_y_release,
            "unauthorized_conditional_with_receipt_bits":h_y_receipt,
        }

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH17",
        "version":"0.1.2",
        "verdict":"PASS_AH17" if passed==len(checks) else "FAIL_AH17",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "shares":{
            "E1":"H2[0][0]",
            "E2":"H2[1][0]",
            "E1_classes":len(set(e1)),
            "E2_classes":len(set(e2)),
            "joint_classes":len(set(zip(e1,e2))),
            "H2_classes":len(set(h2)),
            "E1_entropy_bits":entropy(e1),
            "E2_entropy_bits":entropy(e2),
            "joint_entropy_bits":entropy(list(zip(e1,e2))),
            "H2_entropy_bits":entropy(h2),
        },
        "grants":grant_results,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "histories":len(cases),
        "shares":result["shares"],
        "grants":grant_results,
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH17":
        raise SystemExit(1)

if __name__=="__main__":
    main()
