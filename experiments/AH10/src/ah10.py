#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib, json

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
    d=det(X)
    if d != 1:
        raise ValueError(f"determinant must be +1, got {d}")
    return ((X[1][1],-X[0][1]),(-X[1][0],X[0][0]))

def trace(X: Matrix) -> int:
    return X[0][0]+X[1][1]

def conjugate(T: Matrix, H: Matrix) -> Matrix:
    return mul(mul(T,H),inv(T))

def matrix_list(X: Matrix):
    return [list(X[0]),list(X[1])]

C: Matrix = mul(A,B)

CONNECTORS: dict[str,Matrix] = {
    "I": I,
    "A": A,
    "B": B,
    "S": S,
}

def evaluate(name1: str, T1: Matrix, name2: str, T2: Matrix) -> dict:
    # Explicit horizontal three-cell edge complex.
    t1=T1
    t2=T2
    t3=I

    b1=mul(inv(A),T1)
    b2=mul(inv(B),T2)
    b3=inv(C)

    H1=mul(t1,inv(b1))
    H2=mul(t2,inv(b2))
    H3=mul(t3,inv(b3))

    outer_direct=mul(mul(mul(mul(mul(t1,t2),t3),inv(b3)),inv(b2)),inv(b1))

    H2_at_0=conjugate(T1,H2)
    T02=mul(T1,T2)
    H3_at_0=conjugate(T02,H3)
    outer_transport=mul(mul(H3_at_0,H2_at_0),H1)

    H12=mul(H2_at_0,H1)
    left_group=mul(H3_at_0,H12)

    H23_at_1=mul(conjugate(T2,H3),H2)
    right_group=mul(conjugate(T1,H23_at_1),H1)

    naive=mul(mul(H3,H2),H1)
    omit2=mul(mul(conjugate(T1,H3),H2_at_0),H1)
    omit1=mul(mul(conjugate(T2,H3),H2),H1)

    Q=mul(A,B)
    shifted=conjugate(inv(Q),outer_direct)

    checks={
        "local_H1_is_A": H1==A,
        "local_H2_is_B": H2==B,
        "local_H3_is_C": H3==C,
        "direct_equals_transport": outer_direct==outer_transport,
        "left_group_equals_direct": left_group==outer_direct,
        "right_group_equals_direct": right_group==outer_direct,
        "left_equals_right": left_group==right_group,
        "basepoint_trace_invariant": trace(shifted)==trace(outer_direct),
        "basepoint_det_invariant": det(shifted)==det(outer_direct)==1,
    }

    return {
        "T1_name":name1,
        "T2_name":name2,
        "T1":matrix_list(T1),
        "T2":matrix_list(T2),
        "H1":matrix_list(H1),
        "H2":matrix_list(H2),
        "H3":matrix_list(H3),
        "outer_direct":matrix_list(outer_direct),
        "outer_transport":matrix_list(outer_transport),
        "left_group":matrix_list(left_group),
        "right_group":matrix_list(right_group),
        "naive":matrix_list(naive),
        "omit2":matrix_list(omit2),
        "omit1":matrix_list(omit1),
        "trace_outer":trace(outer_direct),
        "trace_naive":trace(naive),
        "naive_equal":naive==outer_direct,
        "omit2_equal":omit2==outer_direct,
        "omit1_equal":omit1==outer_direct,
        "checks":checks,
    }

def main():
    cases=[
        evaluate(n1,T1,n2,T2)
        for n1,T1 in CONNECTORS.items()
        for n2,T2 in CONNECTORS.items()
    ]

    checks=[]
    for case in cases:
        label=f"{case['T1_name']}:{case['T2_name']}"
        for key,val in case["checks"].items():
            checks.append({"name":f"{label}:{key}","pass":bool(val)})

    naive_equal=sum(c["naive_equal"] for c in cases)
    omit2_equal=sum(c["omit2_equal"] for c in cases)
    omit1_equal=sum(c["omit1_equal"] for c in cases)

    by={(c["T1_name"],c["T2_name"]):c for c in cases}

    global_checks=[
        {"name":"suite:16_connector_pairs","pass":len(cases)==16},
        {"name":"suite:transport_16_of_16","pass":sum(c["outer_direct"]==c["outer_transport"] for c in cases)==16},
        {"name":"suite:left_group_16_of_16","pass":sum(c["left_group"]==c["outer_direct"] for c in cases)==16},
        {"name":"suite:right_group_16_of_16","pass":sum(c["right_group"]==c["outer_direct"] for c in cases)==16},
        {"name":"suite:naive_1_of_16","pass":naive_equal==1},
        {"name":"suite:omit2_4_of_16","pass":omit2_equal==4},
        {"name":"suite:omit1_4_of_16","pass":omit1_equal==4},
        {"name":"primary:A_B_outer","pass":by[("A","B")]["outer_direct"]==[[5,3],[3,2]]},
        {"name":"primary:A_B_naive","pass":by[("A","B")]["naive"]==[[3,4],[2,3]]},
        {"name":"primary:A_B_trace_split","pass":by[("A","B")]["trace_outer"]==7 and by[("A","B")]["trace_naive"]==6},
        {"name":"cancel:B_S_outer_identity","pass":by[("B","S")]["outer_direct"]==[[1,0],[0,1]]},
        {"name":"cancel:B_S_naive_nonidentity","pass":by[("B","S")]["naive"]!=[[1,0],[0,1]]},
        {"name":"cancel:B_S_omit2_nonidentity","pass":by[("B","S")]["omit2"]!=[[1,0],[0,1]]},
        {"name":"cancel:B_S_omit1_nonidentity","pass":by[("B","S")]["omit1"]!=[[1,0],[0,1]]},
    ]
    checks.extend(global_checks)

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH10",
        "version":"0.1.0",
        "verdict":"PASS_AH10" if passed==len(checks) else "FAIL_AH10",
        "checks_passed":passed,
        "checks_total":len(checks),
        "connector_pair_count":len(cases),
        "transport_equal_count":sum(c["outer_direct"]==c["outer_transport"] for c in cases),
        "left_group_equal_count":sum(c["left_group"]==c["outer_direct"] for c in cases),
        "right_group_equal_count":sum(c["right_group"]==c["outer_direct"] for c in cases),
        "naive_equal_count":naive_equal,
        "omit2_equal_count":omit2_equal,
        "omit1_equal_count":omit1_equal,
        "primary_witness":by[("A","B")],
        "exact_cancellation_witness":by[("B","S")],
        "cases":cases,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "connector_pairs":len(cases),
        "transport_equal":result["transport_equal_count"],
        "left_group_equal":result["left_group_equal_count"],
        "right_group_equal":result["right_group_equal_count"],
        "naive_equal":naive_equal,
        "omit2_equal":omit2_equal,
        "omit1_equal":omit1_equal,
        "A_B_outer":by[("A","B")]["outer_direct"],
        "A_B_naive":by[("A","B")]["naive"],
        "B_S_outer":by[("B","S")]["outer_direct"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH10":
        raise SystemExit(1)

if __name__=="__main__":
    main()
