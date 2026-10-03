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

def canonical(obj) -> bytes:
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def hash_obj(obj) -> str:
    return hashlib.sha256(canonical(obj)).hexdigest()

C: Matrix = mul(A,B)
BASE={"I":I,"A":A,"B":B,"S":S}
K_VALUES=(-1,0,1)
QUERY_ORDER=("G","H2","H3","P2")

ROLES={
    "GLOBAL_OPERATOR":{
        "authorized":("G",),
        "descriptor":"residue",
        "classes":13,
        "entropy":3.625,
        "revoked_entropy":0.25,
    },
    "INTERFACE_INSPECTOR":{
        "authorized":("H2",),
        "descriptor":"H2",
        "classes":3,
        "entropy":1.5,
        "revoked_entropy":2.375,
    },
    "DOWNSTREAM_INSPECTOR":{
        "authorized":("H3",),
        "descriptor":"H3",
        "classes":9,
        "entropy":3.077819531114783,
        "revoked_entropy":0.7971804688852168,
    },
    "ROUTE_AUDITOR":{
        "authorized":("P2",),
        "descriptor":"P2",
        "classes":13,
        "entropy":3.625,
        "revoked_entropy":0.25,
    },
}

def make_case(U_name,U,V_name,V,k):
    T1=mul(U,power(B,k))
    T2=mul(power(B,-k),V)
    P2=mul(T1,T2)
    H2=conjugate(T1,B)
    H3=conjugate(P2,C)
    R=mul(H3,H2)
    G=mul(R,A)
    return {
        "label":(U_name,V_name,k),
        "G":G,
        "H2":H2,
        "H3":H3,
        "P2":P2,
        "residue":R,
        "action":(H2,H3),
    }

def query_tuple(c,keys):
    return tuple(c[k] for k in keys)

def values(cases,key):
    return [c[key] for c in cases]

def downgrade_map(cases,target_key):
    groups=defaultdict(set)
    for c in cases:
        groups[c["action"]].add(c[target_key])
    if any(len(v)!=1 for v in groups.values()):
        raise ValueError(f"{target_key} is not a function of old action memory")
    return {old:next(iter(newset)) for old,newset in groups.items()}

def new_receipt(role,descriptor,new_value):
    body={
        "experiment":"NBG-AH14",
        "version":"0.1.0",
        "policy_id":f"FULL_TO_{role}",
        "role":role,
        "descriptor":descriptor,
        "new_memory":new_value,
    }
    body["receipt_hash"]=hash_obj(body)
    return body

def old_receipt(old_action):
    return hash_obj(old_action)

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    old_values=values(cases,"action")
    old_classes=set(old_values)
    old_hashes={v:old_receipt(v) for v in old_classes}

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"suite:15_old_action_classes","pass":len(old_classes)==15},
        {"name":"receipt:15_unique_old_hashes","pass":len(set(old_hashes.values()))==15},
    ]

    role_results={}

    for role,cfg in ROLES.items():
        target_key=cfg["descriptor"]
        authorized=cfg["authorized"]
        revoked=tuple(k for k in QUERY_ORDER if k not in authorized)

        dmap=downgrade_map(cases,target_key)

        new_values=[dmap[c["action"]] for c in cases]
        direct_values=values(cases,target_key)
        authorized_values=[query_tuple(c,authorized) for c in cases]
        revoked_values=[query_tuple(c,revoked) for c in cases]

        new_receipts=[
            new_receipt(role,target_key,dmap[c["action"]])
            for c in cases
        ]
        new_receipt_hashes=[r["receipt_hash"] for r in new_receipts]
        old_receipt_hashes=[old_hashes[c["action"]] for c in cases]

        h_authorized=conditional_entropy(authorized_values,new_values)
        h_revoked_old=conditional_entropy(revoked_values,old_values)
        h_revoked_new=conditional_entropy(revoked_values,new_values)
        h_revoked_new_receipt=conditional_entropy(
            revoked_values,
            list(zip(new_values,new_receipt_hashes))
        )
        h_revoked_old_receipt=conditional_entropy(
            revoked_values,
            list(zip(new_values,old_receipt_hashes))
        )

        replay_a=[
            canonical(new_receipt(role,target_key,dmap[c["action"]]))
            for c in cases
        ]
        replay_b=[
            canonical(new_receipt(role,target_key,dmap[c["action"]]))
            for c in cases
        ]

        checks.extend([
            {"name":f"{role}:functional_downgrade","pass":len(dmap)==15},
            {"name":f"{role}:matches_direct_target","pass":new_values==direct_values},
            {"name":f"{role}:target_classes","pass":len(set(new_values))==cfg["classes"]},
            {"name":f"{role}:target_entropy","pass":abs(entropy(new_values)-cfg["entropy"])<1e-12},
            {"name":f"{role}:authorized_preserved","pass":h_authorized<1e-12},
            {"name":f"{role}:old_revoked_exact","pass":h_revoked_old<1e-12},
            {"name":f"{role}:revoked_uncertainty_restored","pass":abs(h_revoked_new-cfg["revoked_entropy"])<1e-12 and h_revoked_new>0},
            {"name":f"{role}:new_receipt_no_extra","pass":abs(h_revoked_new_receipt-h_revoked_new)<1e-12},
            {"name":f"{role}:old_receipt_reveals_revoked","pass":h_revoked_old_receipt<1e-12},
            {"name":f"{role}:receipt_replay_exact","pass":replay_a==replay_b},
        ])

        role_results[role]={
            "target_descriptor":target_key,
            "old_classes":15,
            "new_classes":len(set(new_values)),
            "old_entropy_bits":entropy(old_values),
            "new_entropy_bits":entropy(new_values),
            "authorized_conditional_entropy_bits":h_authorized,
            "revoked_conditional_entropy_before_bits":h_revoked_old,
            "revoked_conditional_entropy_after_bits":h_revoked_new,
            "revoked_conditional_entropy_with_new_receipt_bits":h_revoked_new_receipt,
            "revoked_conditional_entropy_with_old_receipt_bits":h_revoked_old_receipt,
            "retention_reduction_bits":entropy(old_values)-entropy(new_values),
        }

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH14",
        "version":"0.1.0",
        "verdict":"PASS_AH14" if passed==len(checks) else "FAIL_AH14",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "old_action_classes":len(old_classes),
        "old_action_entropy_bits":entropy(old_values),
        "old_receipt_unique_hashes":len(set(old_hashes.values())),
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
        "old_action_classes":len(old_classes),
        "roles":role_results,
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH14":
        raise SystemExit(1)

if __name__=="__main__":
    main()
