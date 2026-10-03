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

TARGET_ROLE_QUERIES={
    "GLOBAL":("G",),
    "ROUTE":("P2",),
}

GRANTS={
    "GLOBAL_TO_ROUTE":{
        "local":"residue",
        "target_query":"P2",
        "target_role":"ROUTE",
        "release":"P2",
        "local_barrier":0.25,
        "full_excess":0.25,
    },
    "ROUTE_TO_GLOBAL":{
        "local":"P2",
        "target_query":"G",
        "target_role":"GLOBAL",
        "release":"residue",
        "local_barrier":0.25,
        "full_excess":0.25,
    },
    "INTERFACE_TO_GLOBAL":{
        "local":"H2",
        "target_query":"G",
        "target_role":"GLOBAL",
        "release":"residue",
        "local_barrier":2.375,
        "full_excess":0.25,
    },
    "DOWNSTREAM_TO_ROUTE":{
        "local":"H3",
        "target_query":"P2",
        "target_role":"ROUTE",
        "release":"P2",
        "local_barrier":0.5471804688852168,
        "full_excess":0.25,
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
        "G":G,
        "H2":H2,
        "H3":H3,
        "P2":P2,
        "residue":R,
        "action":(H2,H3),
    }

def qtuple(c,keys):
    return tuple(c[k] for k in keys)

def values(cases,key):
    return [c[key] for c in cases]

def functional_map(cases,source_key,target_key):
    groups=defaultdict(set)
    for c in cases:
        groups[c[source_key]].add(c[target_key])
    if any(len(v)!=1 for v in groups.values()):
        return None
    return {k:next(iter(v)) for k,v in groups.items()}

def grant_receipt(grant_id,target_role,descriptor,value):
    body={
        "experiment":"NBG-AH16",
        "version":"0.1.0",
        "grant_id":grant_id,
        "target_role":target_role,
        "descriptor":descriptor,
        "released_memory":value,
    }
    body["receipt_hash"]=sha(body)
    return body

def excess_leakage(cases,target_role,descriptor_key):
    authorized=TARGET_ROLE_QUERIES[target_role]
    unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
    y=[qtuple(c,unauthorized) for c in cases]
    q=[qtuple(c,authorized) for c in cases]
    d=values(cases,descriptor_key)
    return mutual_information(y,d)-mutual_information(y,q)

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    escrow=values(cases,"action")
    escrow_classes=set(escrow)
    escrow_hash_map={x:sha(x) for x in escrow_classes}

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"escrow:15_classes","pass":len(escrow_classes)==15},
        {"name":"escrow:3p875_bits","pass":abs(entropy(escrow)-3.875)<1e-12},
        {"name":"escrow:15_unique_hashes","pass":len(set(escrow_hash_map.values()))==15},
    ]

    grant_results={}

    for grant_id,cfg in GRANTS.items():
        local=values(cases,cfg["local"])
        target=values(cases,cfg["target_query"])
        release=values(cases,cfg["release"])

        local_barrier=conditional_entropy(target,local)
        with_escrow=conditional_entropy(target,list(zip(local,escrow)))

        escrow_to_release=functional_map(cases,"action",cfg["release"])
        derived_release=[escrow_to_release[c["action"]] for c in cases]

        target_given_release=conditional_entropy(target,release)

        selected_excess=excess_leakage(cases,cfg["target_role"],cfg["release"])
        full_excess=excess_leakage(cases,cfg["target_role"],"action")

        receipts=[
            grant_receipt(grant_id,cfg["target_role"],cfg["release"],v)
            for v in release
        ]
        receipt_hashes=[r["receipt_hash"] for r in receipts]

        authorized=TARGET_ROLE_QUERIES[cfg["target_role"]]
        unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
        unauthorized_values=[qtuple(c,unauthorized) for c in cases]

        h_unauth_release=conditional_entropy(unauthorized_values,release)
        h_unauth_receipt=conditional_entropy(
            unauthorized_values,
            list(zip(release,receipt_hashes))
        )

        escrow_hashes=[escrow_hash_map[c["action"]] for c in cases]
        h_unauth_escrow_commit=conditional_entropy(
            unauthorized_values,
            list(zip(release,escrow_hashes))
        )

        checks.extend([
            {"name":f"{grant_id}:local_barrier","pass":abs(local_barrier-cfg["local_barrier"])<1e-12 and local_barrier>0},
            {"name":f"{grant_id}:escrow_resolves","pass":with_escrow<1e-12},
            {"name":f"{grant_id}:escrow_to_release_functional","pass":escrow_to_release is not None},
            {"name":f"{grant_id}:derived_release_exact","pass":derived_release==release},
            {"name":f"{grant_id}:release_answers_target","pass":target_given_release<1e-12},
            {"name":f"{grant_id}:selected_zero_excess","pass":abs(selected_excess)<1e-12},
            {"name":f"{grant_id}:full_positive_excess","pass":abs(full_excess-cfg["full_excess"])<1e-12 and full_excess>0},
            {"name":f"{grant_id}:receipt_no_extra","pass":abs(h_unauth_receipt-h_unauth_release)<1e-12},
            {"name":f"{grant_id}:escrow_commit_restores_unauthorized","pass":h_unauth_escrow_commit<1e-12},
        ])

        grant_results[grant_id]={
            "local_descriptor":cfg["local"],
            "target_query":cfg["target_query"],
            "target_role":cfg["target_role"],
            "released_descriptor":cfg["release"],
            "local_barrier_bits":local_barrier,
            "with_escrow_conditional_bits":with_escrow,
            "release_target_conditional_bits":target_given_release,
            "selected_excess_leakage_bits":selected_excess,
            "full_escrow_excess_leakage_bits":full_excess,
            "unauthorized_conditional_after_release_bits":h_unauth_release,
            "unauthorized_conditional_with_grant_receipt_bits":h_unauth_receipt,
            "unauthorized_conditional_with_escrow_commitment_bits":h_unauth_escrow_commit,
        }

    # Escrow degradation controls.
    p2=values(cases,"P2")
    g=values(cases,"G")
    h3=values(cases,"H3")
    residue=values(cases,"residue")

    degraded={
        "H_P2_given_H3":conditional_entropy(p2,h3),
        "H_P2_given_residue":conditional_entropy(p2,residue),
        "H_G_given_P2":conditional_entropy(g,p2),
    }

    checks.extend([
        {"name":"degraded:H3_cannot_restore_ROUTE","pass":abs(degraded["H_P2_given_H3"]-0.5471804688852168)<1e-12},
        {"name":"degraded:residue_cannot_restore_ROUTE","pass":abs(degraded["H_P2_given_residue"]-0.25)<1e-12},
        {"name":"degraded:P2_cannot_restore_GLOBAL","pass":abs(degraded["H_G_given_P2"]-0.25)<1e-12},
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH16",
        "version":"0.1.0",
        "verdict":"PASS_AH16" if passed==len(checks) else "FAIL_AH16",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "escrow":{
            "descriptor":"action",
            "classes":len(escrow_classes),
            "entropy_bits":entropy(escrow),
            "unique_commitment_hashes":len(set(escrow_hash_map.values())),
        },
        "grants":grant_results,
        "degraded_escrow_controls":degraded,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "histories":len(cases),
        "escrow":result["escrow"],
        "grants":grant_results,
        "degraded_escrow_controls":degraded,
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH16":
        raise SystemExit(1)

if __name__=="__main__":
    main()
