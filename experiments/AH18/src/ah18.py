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
SHARES=("E1","E2","E3")
PAIRS=(("E1","E2"),("E1","E3"),("E2","E3"))

GRANTS={
    "ROUTE_TO_GLOBAL":{
        "local":"P2",
        "target":"G",
        "target_role":"GLOBAL",
        "release":"residue",
        "authorized_pair":("E1","E2"),
        "capable_but_denied_pair":("E2","E3"),
        "insufficient_pair":("E1","E3"),
        "baseline":0.25,
        "single":0.125,
        "insufficient_pair_entropy":0.125,
    },
    "DOWNSTREAM_TO_ROUTE":{
        "local":"H3",
        "target":"P2",
        "target_role":"ROUTE",
        "release":"P2",
        "authorized_pair":("E2","E3"),
        "capable_but_denied_pair":("E1","E2"),
        "insufficient_pair":("E1","E3"),
        "baseline":0.5471804688852168,
        "single":0.25,
        "insufficient_pair_entropy":0.25,
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
        "E3":H2[1][1],
    }

def values(cases,key):
    return [c[key] for c in cases]

def qtuple(c,keys):
    return tuple(c[k] for k in keys)

def coalition_values(cases, coalition):
    return [tuple(c[s] for s in coalition) for c in cases]

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

def grant_receipt(grant_id,target_role,coalition_id,descriptor,value):
    body={
        "experiment":"NBG-AH18",
        "version":"0.1.0",
        "grant_id":grant_id,
        "target_role":target_role,
        "coalition_id":coalition_id,
        "descriptor":descriptor,
        "released_memory":value,
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

    h2=values(cases,"H2")

    checks=[
        {"name":"suite:48_histories","pass":len(cases)==48},
        {"name":"H2:3_classes","pass":len(set(h2))==3},
        {"name":"H2:1p5_bits","pass":abs(entropy(h2)-1.5)<1e-12},
    ]

    share_report={}
    for share in SHARES:
        vals=values(cases,share)
        share_report[share]={
            "classes":len(set(vals)),
            "entropy_bits":entropy(vals),
            "H_H2_given_share_bits":conditional_entropy(h2,vals),
        }
        checks.extend([
            {"name":f"{share}:2_classes","pass":len(set(vals))==2},
            {"name":f"{share}:entropy_0p811","pass":abs(entropy(vals)-0.8112781244591328)<1e-12},
            {"name":f"{share}:H2_insufficient","pass":conditional_entropy(h2,vals)>0},
        ])

    pair_report={}
    expected_pairs={
        ("E1","E2"):(3,1.5,0.0,True),
        ("E1","E3"):(2,0.8112781244591328,0.6887218755408672,False),
        ("E2","E3"):(3,1.5,0.0,True),
    }

    for pair in PAIRS:
        vals=coalition_values(cases,pair)
        hcond=conditional_entropy(h2,vals)
        exp_classes,exp_entropy,exp_hcond,capable=expected_pairs[pair]
        pair_report["+".join(pair)]={
            "classes":len(set(vals)),
            "entropy_bits":entropy(vals),
            "H_H2_given_pair_bits":hcond,
            "capable":hcond<1e-12,
        }
        checks.extend([
            {"name":f"{pair}:classes","pass":len(set(vals))==exp_classes},
            {"name":f"{pair}:entropy","pass":abs(entropy(vals)-exp_entropy)<1e-12},
            {"name":f"{pair}:H2_conditional","pass":abs(hcond-exp_hcond)<1e-12},
            {"name":f"{pair}:capability","pass":(hcond<1e-12)==capable},
        ])

    checks.extend([
        {"name":"redundancy:E3_function_of_E1","pass":functional_map(cases,("E1",),"E3") is not None},
        {"name":"redundancy:E1_function_of_E3","pass":functional_map(cases,("E3",),"E1") is not None},
        {"name":"access:minimal_capable_pairs","pass":
            pair_report["E1+E2"]["capable"] and
            pair_report["E2+E3"]["capable"] and
            not pair_report["E1+E3"]["capable"]
        },
    ])

    grant_results={}

    for gid,cfg in GRANTS.items():
        local=values(cases,cfg["local"])
        target=values(cases,cfg["target"])
        release=values(cases,cfg["release"])

        baseline=conditional_entropy(target,local)

        singleton_results={}
        for s in SHARES:
            h=conditional_entropy(target,list(zip(local,values(cases,s))))
            singleton_results[s]=h
            checks.append({"name":f"{gid}:{s}_single","pass":abs(h-cfg["single"])<1e-12 and h>0})

        pair_results={}
        for pair in PAIRS:
            h=conditional_entropy(target,[
                tuple([c[cfg["local"]]]+[c[s] for s in pair])
                for c in cases
            ])
            pair_results["+".join(pair)]=h

        auth=cfg["authorized_pair"]
        denied=cfg["capable_but_denied_pair"]
        insufficient=cfg["insufficient_pair"]

        auth_map=functional_map(cases,(cfg["local"],)+auth,cfg["release"])
        auth_release=[
            auth_map[tuple([c[cfg["local"]]]+[c[s] for s in auth])]
            for c in cases
        ]

        checks.extend([
            {"name":f"{gid}:baseline","pass":abs(baseline-cfg["baseline"])<1e-12},
            {"name":f"{gid}:authorized_pair_capable","pass":pair_results["+".join(auth)]<1e-12},
            {"name":f"{gid}:denied_pair_mathematically_capable","pass":pair_results["+".join(denied)]<1e-12},
            {"name":f"{gid}:insufficient_pair_rejected","pass":abs(pair_results["+".join(insufficient)]-cfg["insufficient_pair_entropy"])<1e-12 and pair_results["+".join(insufficient)]>0},
            {"name":f"{gid}:authorized_release_functional","pass":auth_map is not None},
            {"name":f"{gid}:authorized_release_exact","pass":auth_release==release},
            {"name":f"{gid}:release_answers_target","pass":conditional_entropy(target,release)<1e-12},
            {"name":f"{gid}:release_zero_excess","pass":abs(excess_leakage(cases,cfg["target_role"],cfg["release"]))<1e-12},
        ])

        coalition_id="+".join(auth)
        receipts=[
            grant_receipt(gid,cfg["target_role"],coalition_id,cfg["release"],v)
            for v in release
        ]
        receipt_hashes=[r["receipt_hash"] for r in receipts]
        authorized=TARGET_ROLE_QUERIES[cfg["target_role"]]
        unauthorized=tuple(k for k in QUERY_ORDER if k not in authorized)
        y=[qtuple(c,unauthorized) for c in cases]
        h_y_release=conditional_entropy(y,release)
        h_y_receipt=conditional_entropy(y,list(zip(release,receipt_hashes)))
        checks.append({"name":f"{gid}:receipt_no_extra","pass":abs(h_y_release-h_y_receipt)<1e-12})

        grant_results[gid]={
            "local_descriptor":cfg["local"],
            "target_query":cfg["target"],
            "target_role":cfg["target_role"],
            "authorized_pair":list(auth),
            "capable_but_policy_denied_pair":list(denied),
            "insufficient_pair":list(insufficient),
            "baseline_conditional_bits":baseline,
            "singleton_conditional_bits":singleton_results,
            "pair_conditional_bits":pair_results,
            "released_descriptor":cfg["release"],
            "release_target_conditional_bits":conditional_entropy(target,release),
            "release_excess_leakage_bits":excess_leakage(cases,cfg["target_role"],cfg["release"]),
        }

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH18",
        "version":"0.1.0",
        "verdict":"PASS_AH18" if passed==len(checks) else "FAIL_AH18",
        "checks_passed":passed,
        "checks_total":len(checks),
        "histories":len(cases),
        "shares":share_report,
        "pairs":pair_report,
        "minimal_capable_coalitions":[["E1","E2"],["E2","E3"]],
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
        "shares":share_report,
        "pairs":pair_report,
        "minimal_capable_coalitions":result["minimal_capable_coalitions"],
        "grants":grant_results,
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH18":
        raise SystemExit(1)

if __name__=="__main__":
    main()
