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
        raise ValueError(f"frozen harness requires det=1, got {d}")
    return ((X[1][1],-X[0][1]),(-X[1][0],X[0][0]))

def sub(X: Matrix, Y: Matrix) -> Matrix:
    return tuple(tuple(X[r][c]-Y[r][c] for c in range(2)) for r in range(2))  # type: ignore

def trace(X: Matrix) -> int:
    return X[0][0]+X[1][1]

def power(X: Matrix, n: int) -> Matrix:
    if n < 0:
        return power(inv(X), -n)
    out=I
    for _ in range(n):
        out=mul(out,X)
    return out

def commute(X: Matrix, Y: Matrix) -> bool:
    return mul(X,Y)==mul(Y,X)

def frob2(X: Matrix) -> int:
    return sum(v*v for row in X for v in row)

def matrix_list(X: Matrix):
    return [list(X[0]),list(X[1])]

CONNECTORS: dict[str,Matrix] = {
    "I": I,
    "B": B,
    "B2": power(B,2),
    "B_INV": inv(B),
    "A": A,
    "A2": power(A,2),
    "A_INV": inv(A),
    "AB": mul(A,B),
    "BA": mul(B,A),
    "S": S,
    "AS": mul(A,S),
    "SA": mul(S,A),
}

def evaluate_connector(name: str, T: Matrix) -> dict:
    a=T
    b=B
    c=mul(inv(A),T)
    d=e=f=g=I

    H_left=mul(mul(mul(a,d),inv(f)),inv(c))
    H_right=mul(mul(mul(b,e),inv(g)),inv(d))

    outer_direct=mul(mul(mul(mul(mul(a,b),e),inv(g)),inv(f)),inv(c))
    right_at_base=mul(mul(T,B),inv(T))
    outer_transport=mul(right_at_base,A)
    outer_naive=mul(B,A)

    comm=commute(T,B)
    defect=sub(outer_direct,outer_naive)
    defect_formula=mul(sub(right_at_base,B),A)

    C=mul(A,B)
    shifted=mul(mul(inv(C),outer_direct),C)

    checks = {
        "connector_det_one": det(T)==1,
        "left_local_loop_is_A": H_left==A,
        "right_local_loop_is_B": H_right==B,
        "direct_equals_transport": outer_direct==outer_transport,
        "defect_identity": defect==defect_formula,
        "naive_equal_iff_commutes": (outer_naive==outer_direct)==comm,
        "basepoint_trace_invariant": trace(shifted)==trace(outer_direct),
        "basepoint_det_invariant": det(shifted)==det(outer_direct)==1,
    }

    return {
        "name":name,
        "T":matrix_list(T),
        "commutes_with_B":comm,
        "H_left":matrix_list(H_left),
        "H_right":matrix_list(H_right),
        "outer_direct":matrix_list(outer_direct),
        "outer_transport":matrix_list(outer_transport),
        "outer_naive":matrix_list(outer_naive),
        "transport_defect":matrix_list(defect),
        "transport_defect_frobenius_sq":frob2(defect),
        "trace_outer":trace(outer_direct),
        "trace_naive":trace(outer_naive),
        "shifted_basepoint":matrix_list(shifted),
        "checks":checks,
    }

def main():
    cases=[evaluate_connector(name,T) for name,T in CONNECTORS.items()]
    checks=[]
    for case in cases:
        for key,val in case["checks"].items():
            checks.append({"name":f"{case['name']}:{key}","pass":bool(val)})

    commuting=sum(c["commutes_with_B"] for c in cases)
    noncommuting=len(cases)-commuting
    naive_equal=sum(c["outer_direct"]==c["outer_naive"] for c in cases)
    transport_equal=sum(c["outer_direct"]==c["outer_transport"] for c in cases)

    by={c["name"]:c for c in cases}
    global_checks=[
        {"name":"suite:12_connectors","pass":len(cases)==12},
        {"name":"suite:4_commuting","pass":commuting==4},
        {"name":"suite:8_noncommuting","pass":noncommuting==8},
        {"name":"suite:4_naive_equal","pass":naive_equal==4},
        {"name":"suite:12_transport_equal","pass":transport_equal==12},
        {"name":"primary_BA_outer","pass":by["BA"]["outer_direct"]==[[3,2],[4,3]]},
        {"name":"primary_BA_naive","pass":by["BA"]["outer_naive"]==[[1,1],[1,2]]},
        {"name":"primary_BA_trace_split","pass":by["BA"]["trace_outer"]==6 and by["BA"]["trace_naive"]==3},
        {"name":"S_exact_outer_identity","pass":by["S"]["outer_direct"]==[[1,0],[0,1]]},
        {"name":"S_naive_nonidentity","pass":by["S"]["outer_naive"]!=[[1,0],[0,1]]},
    ]
    checks.extend(global_checks)

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH9",
        "version":"0.1.0",
        "verdict":"PASS_AH9" if passed==len(checks) else "FAIL_AH9",
        "checks_passed":passed,
        "checks_total":len(checks),
        "connector_count":len(cases),
        "commuting_connectors":commuting,
        "noncommuting_connectors":noncommuting,
        "naive_equal_count":naive_equal,
        "transport_equal_count":transport_equal,
        "primary_witness":{
            "connector":"BA",
            "outer_direct":by["BA"]["outer_direct"],
            "outer_naive":by["BA"]["outer_naive"],
            "trace_outer":by["BA"]["trace_outer"],
            "trace_naive":by["BA"]["trace_naive"],
        },
        "exact_cancellation_witness":{
            "connector":"S",
            "outer_direct":by["S"]["outer_direct"],
            "outer_naive":by["S"]["outer_naive"],
        },
        "cases":cases,
        "checks":checks,
    }
    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)
    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "connector_count":len(cases),
        "commuting":commuting,
        "noncommuting":noncommuting,
        "naive_equal":naive_equal,
        "transport_equal":transport_equal,
        "BA_outer":by["BA"]["outer_direct"],
        "BA_naive":by["BA"]["outer_naive"],
        "S_outer":by["S"]["outer_direct"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))
    if result["verdict"]!="PASS_AH9":
        raise SystemExit(1)

if __name__=="__main__":
    main()
