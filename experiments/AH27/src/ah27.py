#!/usr/bin/env python3
from __future__ import annotations
from fractions import Fraction
from pathlib import Path
import hashlib, json, math

ARCHIVE=(57760,18240,18240,5760)
I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)

PRIMARY=(
    ("R1_I",I_BATCH),
    ("R2_C",C_BATCH),
    ("R3_C",C_BATCH),
    ("R4_I",I_BATCH),
    ("R5_I",I_BATCH),
)

LAMBDA=Fraction(1,10)
P2_FAILURE=0.10
N_MIN=400

EXPECTED_LIFETIME=(
    "INDEPENDENCE_COMPATIBLE",
    "INSUFFICIENT_EVIDENCE",
    "INSUFFICIENT_EVIDENCE",
    "INSUFFICIENT_EVIDENCE",
    "INSUFFICIENT_EVIDENCE",
)
EXPECTED_RECENT=(
    "INDEPENDENCE_COMPATIBLE",
    "COMMON_MODE_EVIDENCE",
    "COMMON_MODE_EVIDENCE",
    "COMMON_MODE_EVIDENCE",
    "INDEPENDENCE_COMPATIBLE",
)
EXPECTED_DISCOUNTED=(
    "INDEPENDENCE_COMPATIBLE",
    "COMMON_MODE_EVIDENCE",
    "COMMON_MODE_EVIDENCE",
    "INSUFFICIENT_EVIDENCE",
    "INDEPENDENCE_COMPATIBLE",
)

EXPECTED_RECENT_RELIABILITY=(
    0.84816,
    0.78318,
    0.7182,
    0.78318,
    0.84816,
)

EXPECTED_LIFETIME_RELIABILITY=(
    0.84816,
    0.8450657142857143,
    0.8421153488372093,
    0.8422527272727273,
    0.842384,
)

def add_tables(*tables):
    return tuple(sum(xs) for xs in zip(*tables))

def stats(table):
    vals=[float(x) for x in table]
    n00,n01,n10,n11=vals
    N=sum(vals)
    p1=(n10+n11)/N
    p3=(n01+n11)/N
    p11=n11/N
    delta=p11-p1*p3

    rows=(n00+n01,n10+n11)
    cols=(n00+n10,n01+n11)
    obs=((n00,n01),(n10,n11))
    chi2=0.0
    mi=0.0
    for i in range(2):
        for j in range(2):
            expected=rows[i]*cols[j]/N
            chi2+=(obs[i][j]-expected)**2/expected
            if obs[i][j]:
                pij=obs[i][j]/N
                pi=rows[i]/N
                pj=cols[j]/N
                mi+=pij*math.log2(pij/(pi*pj))

    p_value=math.erfc(math.sqrt(chi2/2.0))
    return {
        "N":N,
        "p1":p1,
        "p3":p3,
        "p11":p11,
        "delta":delta,
        "mutual_information_bits":mi,
        "chi2":chi2,
        "chi2_p_value":p_value,
    }

def classify(s):
    if s["N"]<N_MIN:
        return "INSUFFICIENT_EVIDENCE"
    if s["chi2_p_value"]<=1e-3 and s["delta"]>=0.02:
        return "COMMON_MODE_EVIDENCE"
    if s["chi2_p_value"]<=1e-3 and s["delta"]<=-0.02:
        return "DEPENDENCE_OTHER_DIRECTION"
    if s["chi2_p_value"]>=0.10 and abs(s["delta"])<=0.01:
        return "INDEPENDENCE_COMPATIBLE"
    return "INSUFFICIENT_EVIDENCE"

def reliability(s):
    return (1-P2_FAILURE)*(1-s["p11"])

def discounted_step(previous,batch):
    return tuple(LAMBDA*x+Fraction(y,1) for x,y in zip(previous,batch))

def run_primary():
    cumulative=ARCHIVE
    discounted=tuple(Fraction(x,1) for x in ARCHIVE)
    seen=[]
    rows=[]

    for batch_id,batch in PRIMARY:
        seen.append(batch)
        cumulative=add_tables(cumulative,batch)
        recent=add_tables(*seen[-2:])
        discounted=discounted_step(discounted,batch)

        views={}
        for name,table in (
            ("lifetime",cumulative),
            ("recent2",recent),
            ("discounted",discounted),
        ):
            s=stats(table)
            views[name]={
                "table":[float(x) for x in table],
                "stats":s,
                "status":classify(s),
                "reliability":reliability(s),
            }

        rows.append({
            "batch_id":batch_id,
            "batch":list(batch),
            "views":views,
        })

    return rows

def final_views(sequence):
    cumulative=ARCHIVE
    discounted=tuple(Fraction(x,1) for x in ARCHIVE)
    for batch in sequence:
        cumulative=add_tables(cumulative,batch)
        discounted=discounted_step(discounted,batch)
    recent=add_tables(*sequence[-2:])
    out={}
    for name,table in (
        ("lifetime",cumulative),
        ("recent2",recent),
        ("discounted",discounted),
    ):
        s=stats(table)
        out[name]={
            "table":[float(x) for x in table],
            "stats":s,
            "status":classify(s),
            "reliability":reliability(s),
        }
    return out

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def main():
    primary=run_primary()

    life_status=tuple(r["views"]["lifetime"]["status"] for r in primary)
    recent_status=tuple(r["views"]["recent2"]["status"] for r in primary)
    disc_status=tuple(r["views"]["discounted"]["status"] for r in primary)

    life_rel=tuple(r["views"]["lifetime"]["reliability"] for r in primary)
    recent_rel=tuple(r["views"]["recent2"]["reliability"] for r in primary)

    checks=[
        {"name":"primary:lifetime_status_exact","pass":life_status==EXPECTED_LIFETIME},
        {"name":"primary:recent_status_exact","pass":recent_status==EXPECTED_RECENT},
        {"name":"primary:discounted_status_exact","pass":disc_status==EXPECTED_DISCOUNTED},
        {"name":"primary:recent_reliability_exact","pass":all(abs(a-b)<1e-12 for a,b in zip(recent_rel,EXPECTED_RECENT_RELIABILITY))},
        {"name":"primary:lifetime_reliability_exact","pass":all(abs(a-b)<1e-12 for a,b in zip(life_rel,EXPECTED_LIFETIME_RELIABILITY))},
    ]

    # Marginals remain identical across every view and step.
    checks.extend([
        {"name":"primary:all_p1_0p24","pass":all(abs(r["views"][v]["stats"]["p1"]-0.24)<1e-12 for r in primary for v in ("lifetime","recent2","discounted"))},
        {"name":"primary:all_p3_0p24","pass":all(abs(r["views"][v]["stats"]["p3"]-0.24)<1e-12 for r in primary for v in ("lifetime","recent2","discounted"))},
    ])

    # Horizon disagreements.
    checks.extend([
        {"name":"horizon:R2_lifetime_vs_recent","pass":
            primary[1]["views"]["lifetime"]["status"]=="INSUFFICIENT_EVIDENCE" and
            primary[1]["views"]["recent2"]["status"]=="COMMON_MODE_EVIDENCE"
        },
        {"name":"horizon:R2_lifetime_vs_discounted","pass":
            primary[1]["views"]["lifetime"]["status"]=="INSUFFICIENT_EVIDENCE" and
            primary[1]["views"]["discounted"]["status"]=="COMMON_MODE_EVIDENCE"
        },
        {"name":"horizon:R4_three_way_split","pass":
            primary[3]["views"]["lifetime"]["status"]=="INSUFFICIENT_EVIDENCE" and
            primary[3]["views"]["recent2"]["status"]=="COMMON_MODE_EVIDENCE" and
            primary[3]["views"]["discounted"]["status"]=="INSUFFICIENT_EVIDENCE"
        },
        {"name":"horizon:R5_recent_discounted_clear","pass":
            primary[4]["views"]["recent2"]["status"]=="INDEPENDENCE_COMPATIBLE" and
            primary[4]["views"]["discounted"]["status"]=="INDEPENDENCE_COMPATIBLE"
        },
    ])

    # Frozen numeric spot checks.
    checks.extend([
        {"name":"numeric:R2_lifetime_delta","pass":abs(primary[1]["views"]["lifetime"]["stats"]["delta"]-0.00343809523809524)<1e-12},
        {"name":"numeric:R2_recent_delta","pass":abs(primary[1]["views"]["recent2"]["stats"]["delta"]-0.0722)<1e-12},
        {"name":"numeric:R3_recent_mi","pass":abs(primary[2]["views"]["recent2"]["stats"]["mutual_information_bits"]-0.42610481405706996)<1e-12},
        {"name":"numeric:R3_discounted_delta","pass":abs(primary[2]["views"]["discounted"]["stats"]["delta"]-0.1381217391304348)<1e-12},
        {"name":"numeric:R5_discounted_delta","pass":abs(primary[4]["views"]["discounted"]["stats"]["delta"]-0.0014290598290598241)<1e-12},
    ])

    # Same-lifetime / different-recent order witness.
    history_A=(C_BATCH,C_BATCH,I_BATCH,I_BATCH)
    history_B=(I_BATCH,I_BATCH,C_BATCH,C_BATCH)
    A=final_views(history_A)
    B=final_views(history_B)

    checks.extend([
        {"name":"witness:lifetime_tables_equal","pass":A["lifetime"]["table"]==B["lifetime"]["table"]},
        {"name":"witness:lifetime_status_equal","pass":A["lifetime"]["status"]==B["lifetime"]["status"]=="INSUFFICIENT_EVIDENCE"},
        {"name":"witness:recent_status_differs","pass":
            A["recent2"]["status"]=="INDEPENDENCE_COMPATIBLE" and
            B["recent2"]["status"]=="COMMON_MODE_EVIDENCE"
        },
        {"name":"witness:discounted_status_differs","pass":
            A["discounted"]["status"]=="INDEPENDENCE_COMPATIBLE" and
            B["discounted"]["status"]=="COMMON_MODE_EVIDENCE"
        },
        {"name":"witness:recent_tables_differ","pass":A["recent2"]["table"]!=B["recent2"]["table"]},
        {"name":"witness:discounted_tables_differ","pass":A["discounted"]["table"]!=B["discounted"]["table"]},
        {"name":"witness:lifetime_table_exact","pass":A["lifetime"]["table"]==[64258.0,19342.0,19342.0,7058.0]},
    ])

    # Replay exactness.
    replay=run_primary()
    checks.extend([
        {"name":"replay:primary_exact","pass":canonical(primary)==canonical(replay)},
        {"name":"replay:witness_exact","pass":canonical({"A":A,"B":B})==canonical({"A":final_views(history_A),"B":final_views(history_B)})},
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH27",
        "version":"0.1.0",
        "verdict":"PASS_AH27" if passed==len(checks) else "FAIL_AH27",
        "checks_passed":passed,
        "checks_total":len(checks),
        "lambda":"1/10",
        "archive":list(ARCHIVE),
        "primary":primary,
        "order_witness":{
            "history_A":["C","C","I","I"],
            "history_B":["I","I","C","C"],
            "A":A,
            "B":B,
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "lifetime_status":list(life_status),
        "recent_status":list(recent_status),
        "discounted_status":list(disc_status),
        "recent_reliability":list(recent_rel),
        "lifetime_reliability":list(life_rel),
        "witness":{
            "same_lifetime":A["lifetime"]["table"]==B["lifetime"]["table"],
            "A_recent":A["recent2"]["status"],
            "B_recent":B["recent2"]["status"],
            "A_discounted":A["discounted"]["status"],
            "B_discounted":B["discounted"]["status"],
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH27":
        raise SystemExit(1)

if __name__=="__main__":
    main()
