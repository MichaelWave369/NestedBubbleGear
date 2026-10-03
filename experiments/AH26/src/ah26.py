#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib, json, math

BATCHES=(
    ("B1_SMALL_AMBIGUOUS",(15,4,4,2)),
    ("B2_INDEPENDENT_625",(361,114,114,36)),
    ("B3_COMMON_CAUSE_500",(361,19,19,101)),
    ("B4_COMMON_CAUSE_500",(361,19,19,101)),
    ("B5_INDEPENDENT_312500",(180500,57000,57000,18000)),
    ("B6_INDEPENDENT_625",(361,114,114,36)),
)

EXPECTED_RAW=(
    "INSUFFICIENT_EVIDENCE",
    "INDEPENDENCE_COMPATIBLE",
    "COMMON_MODE_EVIDENCE",
    "COMMON_MODE_EVIDENCE",
    "INDEPENDENCE_COMPATIBLE",
    "INDEPENDENCE_COMPATIBLE",
)

EXPECTED_GOVERNED=(
    "NO_ALERT",
    "NO_ALERT",
    "PENDING_ESCALATION",
    "ACTIVE_ALERT",
    "ACTIVE_PENDING_CLEAR",
    "CLEARED_AFTER_PERSISTENCE",
)

EXPECTED_RELIABILITY=(
    0.8280000000000001,
    0.8473846153846154,
    0.7912173913043478,
    0.769090909090909,
    0.8477447079420659,
    0.8477455325232309,
)

N_MIN=400
P2_FAILURE=0.10

def stats(table):
    n00,n01,n10,n11=table
    N=sum(table)
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

def observed_reliability(s):
    return (1-P2_FAILURE)*(1-s["p11"])

def assumed_reliability(s):
    return (1-P2_FAILURE)*(1-s["p1"]*s["p3"])

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def run_sequence():
    cumulative=[0,0,0,0]
    common_streak=0
    compatible_streak=0
    active=False
    receipts=[]

    for batch_id,increment in BATCHES:
        cumulative=[a+b for a,b in zip(cumulative,increment)]
        s=stats(tuple(cumulative))
        raw=classify(s)

        if raw=="COMMON_MODE_EVIDENCE":
            common_streak+=1
            compatible_streak=0
            if active:
                governed="ACTIVE_ALERT"
            elif common_streak>=2:
                active=True
                governed="ACTIVE_ALERT"
            else:
                governed="PENDING_ESCALATION"

        elif raw=="INDEPENDENCE_COMPATIBLE":
            compatible_streak+=1
            common_streak=0
            if active and compatible_streak>=2:
                active=False
                governed="CLEARED_AFTER_PERSISTENCE"
            elif active:
                governed="ACTIVE_PENDING_CLEAR"
            else:
                governed="NO_ALERT"

        else:
            common_streak=0
            compatible_streak=0
            governed="ACTIVE_ALERT" if active else "NO_ALERT"

        receipt={
            "batch_id":batch_id,
            "incremental_table":list(increment),
            "cumulative_table":list(cumulative),
            "raw_status":raw,
            "governed_state":governed,
            "common_streak":common_streak,
            "compatible_streak":compatible_streak,
            "alert_active":active,
            "stats":s,
            "observed_dual_reliability":observed_reliability(s),
            "independence_assumed_reliability":assumed_reliability(s),
            "naive_alert":raw=="COMMON_MODE_EVIDENCE",
        }
        receipt["receipt_sha256"]=hashlib.sha256(canonical(receipt)).hexdigest()
        receipts.append(receipt)

    return receipts

def main():
    receipts=run_sequence()
    checks=[]

    raw=tuple(r["raw_status"] for r in receipts)
    governed=tuple(r["governed_state"] for r in receipts)
    rel=tuple(r["observed_dual_reliability"] for r in receipts)
    naive=tuple(r["naive_alert"] for r in receipts)

    checks.extend([
        {"name":"sequence:raw_exact","pass":raw==EXPECTED_RAW},
        {"name":"sequence:governed_exact","pass":governed==EXPECTED_GOVERNED},
        {"name":"sequence:reliability_exact","pass":all(abs(a-b)<1e-12 for a,b in zip(rel,EXPECTED_RELIABILITY))},
        {"name":"sequence:naive_exact","pass":naive==(False,False,True,True,False,False)},
        {"name":"sequence:activation_delayed_one_batch","pass":
            receipts[2]["naive_alert"] and not receipts[2]["alert_active"] and receipts[3]["alert_active"]
        },
        {"name":"sequence:clear_delayed_one_batch","pass":
            not receipts[4]["naive_alert"] and receipts[4]["alert_active"] and not receipts[5]["alert_active"]
        },
    ])

    expected_N=(25,650,1150,1650,314150,314775)
    checks.append({"name":"sequence:N_exact","pass":tuple(r["stats"]["N"] for r in receipts)==expected_N})

    checks.extend([
        {"name":"marginals:p1_stays_0p24","pass":all(abs(r["stats"]["p1"]-0.24)<1e-12 for r in receipts)},
        {"name":"marginals:p3_stays_0p24","pass":all(abs(r["stats"]["p3"]-0.24)<1e-12 for r in receipts)},
        {"name":"marginals:assumed_reliability_constant","pass":all(abs(r["independence_assumed_reliability"]-0.84816)<1e-12 for r in receipts)},
        {"name":"B2:compatible_pvalue","pass":abs(receipts[1]["stats"]["chi2_p_value"]-0.9041487156232365)<1e-12},
        {"name":"B3:common_delta","pass":abs(receipts[2]["stats"]["delta"]-0.0632695652173913)<1e-12},
        {"name":"B4:common_delta","pass":abs(receipts[3]["stats"]["delta"]-0.08785454545454545)<1e-12},
        {"name":"B5:compatible_pvalue","pass":abs(receipts[4]["stats"]["chi2_p_value"]-0.1562111806842332)<1e-12},
        {"name":"B4:overstatement","pass":abs((receipts[3]["independence_assumed_reliability"]-receipts[3]["observed_dual_reliability"])-0.07906909090909091)<1e-12},
    ])

    # Persistence counters.
    checks.extend([
        {"name":"streak:B3_common_1","pass":receipts[2]["common_streak"]==1},
        {"name":"streak:B4_common_2","pass":receipts[3]["common_streak"]==2},
        {"name":"streak:B5_compatible_1","pass":receipts[4]["compatible_streak"]==1},
        {"name":"streak:B6_compatible_2","pass":receipts[5]["compatible_streak"]==2},
    ])

    # Replay exact.
    replay=run_sequence()
    checks.extend([
        {"name":"replay:receipts_exact","pass":canonical(receipts)==canonical(replay)},
        {"name":"replay:receipt_hashes_exact","pass":[r["receipt_sha256"] for r in receipts]==[r["receipt_sha256"] for r in replay]},
    ])

    # Semantic guardrails.
    checks.extend([
        {"name":"semantics:compatible_not_proven","pass":all("PROVEN" not in r["raw_status"] for r in receipts)},
        {"name":"semantics:insufficient_is_valid_state","pass":receipts[0]["raw_status"]=="INSUFFICIENT_EVIDENCE"},
        {"name":"semantics:active_survives_one_compatible","pass":receipts[4]["governed_state"]=="ACTIVE_PENDING_CLEAR"},
    ])

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH26",
        "version":"0.1.0",
        "verdict":"PASS_AH26" if passed==len(checks) else "FAIL_AH26",
        "checks_passed":passed,
        "checks_total":len(checks),
        "batches":len(BATCHES),
        "receipts":receipts,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "raw_sequence":list(raw),
        "governed_sequence":list(governed),
        "observed_reliability":list(rel),
        "receipt_hashes":[r["receipt_sha256"] for r in receipts],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH26":
        raise SystemExit(1)

if __name__=="__main__":
    main()
