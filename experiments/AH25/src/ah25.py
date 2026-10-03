#!/usr/bin/env python3
from __future__ import annotations
from pathlib import Path
import hashlib, json, math

DATASETS={
    "MATCHED_INDEPENDENT":(5776,1824,1824,576),
    "MATCHED_COMMON_CAUSE":(7220,380,380,2020),
    "MATCHED_ANTI_DEPENDENCE":(5200,2400,2400,0),
    "SMALL_AMBIGUOUS":(15,4,4,2),
}

EXPECTED_STATUS={
    "MATCHED_INDEPENDENT":"INDEPENDENCE_COMPATIBLE",
    "MATCHED_COMMON_CAUSE":"COMMON_MODE_EVIDENCE",
    "MATCHED_ANTI_DEPENDENCE":"DEPENDENCE_OTHER_DIRECTION",
    "SMALL_AMBIGUOUS":"INSUFFICIENT_EVIDENCE",
}

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
    if s["N"] < N_MIN:
        return "INSUFFICIENT_EVIDENCE"
    if s["chi2_p_value"] <= 1e-3 and s["delta"] >= 0.02:
        return "COMMON_MODE_EVIDENCE"
    if s["chi2_p_value"] <= 1e-3 and s["delta"] <= -0.02:
        return "DEPENDENCE_OTHER_DIRECTION"
    if s["chi2_p_value"] >= 0.10 and abs(s["delta"]) <= 0.01:
        return "INDEPENDENCE_COMPATIBLE"
    return "INSUFFICIENT_EVIDENCE"

def marginal_descriptor(s):
    return (s["p1"],s["p3"])

def observed_dual_reliability(s,p2=P2_FAILURE):
    return (1-p2)*(1-s["p11"])

def independence_assumed_reliability(s,p2=P2_FAILURE):
    return (1-p2)*(1-s["p1"]*s["p3"])

def overstatement(s,p2=P2_FAILURE):
    return independence_assumed_reliability(s,p2)-observed_dual_reliability(s,p2)

def main():
    checks=[]
    reports={}

    expected_numeric={
        "MATCHED_INDEPENDENT":{
            "delta":0.0,
            "mi":0.0,
            "chi2":0.0,
            "rel":0.84816,
            "over":0.0,
        },
        "MATCHED_COMMON_CAUSE":{
            "delta":0.1444,
            "mi":0.42610481405706996,
            "chi2":6267.361111111111,
            "rel":0.7182,
            "over":0.12996,
        },
        "MATCHED_ANTI_DEPENDENCE":{
            "delta":-0.0576,
            "mi":0.11123502277384265,
            "chi2":997.2299168975069,
            "rel":0.9,
            "over":-0.05184,
        },
        "SMALL_AMBIGUOUS":{
            "delta":0.0224,
        },
    }

    for name,table in DATASETS.items():
        s=stats(table)
        status=classify(s)
        checks.append({"name":f"{name}:status","pass":status==EXPECTED_STATUS[name]})
        checks.append({"name":f"{name}:delta","pass":abs(s["delta"]-expected_numeric[name]["delta"])<1e-12})

        if "mi" in expected_numeric[name]:
            checks.extend([
                {"name":f"{name}:mi","pass":abs(s["mutual_information_bits"]-expected_numeric[name]["mi"])<1e-12},
                {"name":f"{name}:chi2","pass":abs(s["chi2"]-expected_numeric[name]["chi2"])<1e-9},
                {"name":f"{name}:reliability","pass":abs(observed_dual_reliability(s)-expected_numeric[name]["rel"])<1e-12},
                {"name":f"{name}:overstatement","pass":abs(overstatement(s)-expected_numeric[name]["over"])<1e-12},
            ])

        reports[name]={
            **s,
            "status":status,
            "marginal_descriptor":list(marginal_descriptor(s)),
            "observed_dual_reliability":observed_dual_reliability(s),
            "independence_assumed_reliability":independence_assumed_reliability(s),
            "reliability_overstatement":overstatement(s),
        }

    large=("MATCHED_INDEPENDENT","MATCHED_COMMON_CAUSE","MATCHED_ANTI_DEPENDENCE")
    checks.extend([
        {"name":"matched:all_large_marginals_equal","pass":
            len({marginal_descriptor(reports[n]) for n in large})==1
        },
        {"name":"matched:all_large_marginals_0p24","pass":
            all(abs(reports[n]["p1"]-0.24)<1e-12 and abs(reports[n]["p3"]-0.24)<1e-12 for n in large)
        },
        {"name":"matched:joint_rates_differ","pass":
            len({reports[n]["p11"] for n in large})==3
        },
        {"name":"matched:statuses_differ","pass":
            len({reports[n]["status"] for n in large})==3
        },
        {"name":"matched:assumed_reliability_same","pass":
            len({round(reports[n]["independence_assumed_reliability"],12) for n in large})==1
        },
        {"name":"matched:observed_reliability_differs","pass":
            len({round(reports[n]["observed_dual_reliability"],12) for n in large})==3
        },
        {"name":"matched:common_cause_reproduces_AH24","pass":
            abs(reports["MATCHED_COMMON_CAUSE"]["observed_dual_reliability"]-0.7182)<1e-12
        },
        {"name":"matched:independent_reproduces_AH24","pass":
            abs(reports["MATCHED_INDEPENDENT"]["observed_dual_reliability"]-0.84816)<1e-12
        },
        {"name":"small:refusal_due_sample_floor","pass":
            reports["SMALL_AMBIGUOUS"]["N"]<N_MIN and reports["SMALL_AMBIGUOUS"]["status"]=="INSUFFICIENT_EVIDENCE"
        },
        {"name":"semantics:compatible_not_proof","pass":
            reports["MATCHED_INDEPENDENT"]["status"]=="INDEPENDENCE_COMPATIBLE"
        },
    ])

    passed=sum(c["pass"] for c in checks)

    result={
        "experiment":"NBG-AH25",
        "version":"0.1.0",
        "verdict":"PASS_AH25" if passed==len(checks) else "FAIL_AH25",
        "checks_passed":passed,
        "checks_total":len(checks),
        "sample_floor":N_MIN,
        "p2_failure":P2_FAILURE,
        "datasets":reports,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "datasets":{
            n:{
                "N":r["N"],
                "marginals":r["marginal_descriptor"],
                "p11":r["p11"],
                "delta":r["delta"],
                "mi_bits":r["mutual_information_bits"],
                "chi2":r["chi2"],
                "p_value":r["chi2_p_value"],
                "status":r["status"],
                "observed_dual_reliability":r["observed_dual_reliability"],
                "independence_assumed_reliability":r["independence_assumed_reliability"],
                "overstatement":r["reliability_overstatement"],
            }
            for n,r in reports.items()
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH25":
        raise SystemExit(1)

if __name__=="__main__":
    main()
