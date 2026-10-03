#!/usr/bin/env python3
from __future__ import annotations
from fractions import Fraction
from pathlib import Path
import hashlib, json, math

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)

LAMBDA=Fraction(1,10)
N_MIN=400
VERSION="0.1.1"

CONTRACTS={
    "Q_LIFETIME":{"horizon":"LIFETIME","source":"lifetime"},
    "Q_RECENT":{"horizon":"RECENT_2","source":"recent2"},
    "Q_ADAPTIVE":{"horizon":"DISCOUNTED_0.1","source":"adaptive"},
    "Q_MULTI":{"horizon":"MULTI","source":"multi"},
}

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
    for i in range(2):
        for j in range(2):
            expected=rows[i]*cols[j]/N
            chi2+=(obs[i][j]-expected)**2/expected
    p_value=math.erfc(math.sqrt(chi2/2.0))
    return {"N":N,"p1":p1,"p3":p3,"p11":p11,"delta":delta,"chi2":chi2,"chi2_p_value":p_value}

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

def signal(status):
    return {
        "COMMON_MODE_EVIDENCE":"RISK_SIGNAL",
        "INDEPENDENCE_COMPATIBLE":"NO_COMMON_MODE_SIGNAL",
        "INSUFFICIENT_EVIDENCE":"UNCERTAIN",
        "DEPENDENCE_OTHER_DIRECTION":"OTHER_DEPENDENCE_SIGNAL",
    }[status]

def discounted_final(archive,batches):
    d=tuple(Fraction(x,1) for x in archive)
    for batch in batches:
        d=tuple(LAMBDA*x+Fraction(y,1) for x,y in zip(d,batch))
    return d

def panel(panel_id,archive,batches):
    lifetime=add_tables(archive,*batches)
    recent=add_tables(*batches[-2:]) if len(batches)>=2 else batches[-1]
    adaptive=discounted_final(archive,batches)
    views={}
    for name,table in (("lifetime",lifetime),("recent2",recent),("adaptive",adaptive)):
        s=stats(table)
        views[name]={
            "table":[float(x) for x in table],
            "stats":s,
            "status":classify(s),
            "signal":signal(classify(s)),
        }
    return {"panel_id":panel_id,"views":views}

def arbitration(p):
    life=p["views"]["lifetime"]["status"]
    recent=p["views"]["recent2"]["status"]
    if life==recent:
        return "CONSISTENT"
    if recent=="COMMON_MODE_EVIDENCE" and life!="COMMON_MODE_EVIDENCE":
        return "RECENT_RISK_ONLY"
    if life=="COMMON_MODE_EVIDENCE" and recent!="COMMON_MODE_EVIDENCE":
        return "LIFETIME_RISK_ONLY"
    return "HORIZON_CONFLICT"

def build_panels():
    return {
        "A_RECENT_RISK":panel("A_RECENT_RISK",INDEP_ARCHIVE,(I_BATCH,C_BATCH)),
        "B_THREE_WAY_SPLIT":panel("B_THREE_WAY_SPLIT",INDEP_ARCHIVE,(I_BATCH,C_BATCH,C_BATCH,I_BATCH)),
        "C_CONSISTENT_COMPATIBLE":panel("C_CONSISTENT_COMPATIBLE",INDEP_ARCHIVE,(I_BATCH,I_BATCH)),
        "D_LIFETIME_RISK":panel("D_LIFETIME_RISK",COMMON_ARCHIVE,(I_BATCH,I_BATCH)),
        "E_CONSISTENT_RISK":panel("E_CONSISTENT_RISK",COMMON_ARCHIVE,(C_BATCH,C_BATCH)),
        "F_ORDER_A":panel("F_ORDER_A",INDEP_ARCHIVE,(C_BATCH,C_BATCH,I_BATCH,I_BATCH)),
        "G_ORDER_B":panel("G_ORDER_B",INDEP_ARCHIVE,(I_BATCH,I_BATCH,C_BATCH,C_BATCH)),
    }

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def receipt_hash(body):
    return hashlib.sha256(canonical(body)).hexdigest()

def query(panels,panel_id,contract):
    if panel_id not in panels:
        body={"version":VERSION,"panel_id":panel_id,"refusal":"REFUSE_UNKNOWN_PANEL"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if contract is None:
        body={"version":VERSION,"panel_id":panel_id,"refusal":"REFUSE_UNDERSPECIFIED_HORIZON"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if contract not in CONTRACTS:
        body={"version":VERSION,"panel_id":panel_id,"refusal":"REFUSE_UNKNOWN_QUERY_CONTRACT"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    p=panels[panel_id]
    meta=CONTRACTS[contract]

    if contract=="Q_MULTI":
        body={
            "version":VERSION,
            "panel_id":panel_id,
            "query_contract":contract,
            "horizon":meta["horizon"],
            "arbitration":arbitration(p),
            "states":{
                "lifetime":p["views"]["lifetime"]["status"],
                "recent2":p["views"]["recent2"]["status"],
                "adaptive":p["views"]["adaptive"]["status"],
            },
            "signals":{
                "lifetime":p["views"]["lifetime"]["signal"],
                "recent2":p["views"]["recent2"]["signal"],
                "adaptive":p["views"]["adaptive"]["signal"],
            },
            "source_memory":"MULTI_HORIZON",
        }
    else:
        source=meta["source"]
        v=p["views"][source]
        body={
            "version":VERSION,
            "panel_id":panel_id,
            "query_contract":contract,
            "horizon":meta["horizon"],
            "evidence_status":v["status"],
            "scoped_signal":v["signal"],
            "source_memory":source,
        }

    body["receipt_hash"]=receipt_hash(body)
    return body

def main():
    panels=build_panels()
    checks=[]

    expected={
        "A_RECENT_RISK":("INSUFFICIENT_EVIDENCE","COMMON_MODE_EVIDENCE","COMMON_MODE_EVIDENCE","RECENT_RISK_ONLY"),
        "B_THREE_WAY_SPLIT":("INSUFFICIENT_EVIDENCE","COMMON_MODE_EVIDENCE","INSUFFICIENT_EVIDENCE","RECENT_RISK_ONLY"),
        "C_CONSISTENT_COMPATIBLE":("INDEPENDENCE_COMPATIBLE","INDEPENDENCE_COMPATIBLE","INDEPENDENCE_COMPATIBLE","CONSISTENT"),
        "D_LIFETIME_RISK":("COMMON_MODE_EVIDENCE","INDEPENDENCE_COMPATIBLE","COMMON_MODE_EVIDENCE","LIFETIME_RISK_ONLY"),
        "E_CONSISTENT_RISK":("COMMON_MODE_EVIDENCE","COMMON_MODE_EVIDENCE","COMMON_MODE_EVIDENCE","CONSISTENT"),
        "F_ORDER_A":("INSUFFICIENT_EVIDENCE","INDEPENDENCE_COMPATIBLE","INDEPENDENCE_COMPATIBLE","HORIZON_CONFLICT"),
        "G_ORDER_B":("INSUFFICIENT_EVIDENCE","COMMON_MODE_EVIDENCE","COMMON_MODE_EVIDENCE","RECENT_RISK_ONLY"),
    }

    for pid,p in panels.items():
        got=(
            p["views"]["lifetime"]["status"],
            p["views"]["recent2"]["status"],
            p["views"]["adaptive"]["status"],
            arbitration(p),
        )
        checks.append({"name":f"{pid}:states_exact","pass":got==expected[pid]})

    # Same-lifetime governance witness.
    F=panels["F_ORDER_A"]
    G=panels["G_ORDER_B"]
    checks.extend([
        {"name":"witness:lifetime_tables_equal","pass":F["views"]["lifetime"]["table"]==G["views"]["lifetime"]["table"]},
        {"name":"witness:lifetime_status_equal","pass":F["views"]["lifetime"]["status"]==G["views"]["lifetime"]["status"]=="INSUFFICIENT_EVIDENCE"},
        {"name":"witness:arbitration_differs","pass":arbitration(F)=="HORIZON_CONFLICT" and arbitration(G)=="RECENT_RISK_ONLY"},
    ])

    # Contract routing/refusal.
    q_recent=query(panels,"A_RECENT_RISK","Q_RECENT")
    q_life=query(panels,"A_RECENT_RISK","Q_LIFETIME")
    q_adapt=query(panels,"A_RECENT_RISK","Q_ADAPTIVE")
    q_multi=query(panels,"A_RECENT_RISK","Q_MULTI")
    q_none=query(panels,"A_RECENT_RISK",None)
    q_bad=query(panels,"A_RECENT_RISK","Q_WHATEVER")

    checks.extend([
        {"name":"query:recent_exact","pass":q_recent["evidence_status"]=="COMMON_MODE_EVIDENCE" and q_recent["horizon"]=="RECENT_2"},
        {"name":"query:lifetime_exact","pass":q_life["evidence_status"]=="INSUFFICIENT_EVIDENCE" and q_life["horizon"]=="LIFETIME"},
        {"name":"query:adaptive_exact","pass":q_adapt["evidence_status"]=="COMMON_MODE_EVIDENCE" and q_adapt["horizon"]=="DISCOUNTED_0.1"},
        {"name":"query:multi_exact","pass":q_multi["arbitration"]=="RECENT_RISK_ONLY" and q_multi["horizon"]=="MULTI"},
        {"name":"query:missing_horizon_refused","pass":q_none["refusal"]=="REFUSE_UNDERSPECIFIED_HORIZON"},
        {"name":"query:unknown_contract_refused","pass":q_bad["refusal"]=="REFUSE_UNKNOWN_QUERY_CONTRACT"},
    ])

    # No accepted query can omit horizon.
    accepted=[]
    for pid in panels:
        for contract in CONTRACTS:
            accepted.append(query(panels,pid,contract))
    checks.append({"name":"receipts:accepted_have_horizon","pass":all("horizon" in r for r in accepted)})

    # No user-visible semantic field may call a state SAFE.
    serialized=json.dumps({"panels":panels,"accepted":accepted},sort_keys=True)
    checks.append({"name":"semantics:no_SAFE_token","pass":"SAFE" not in serialized})

    # Multi query never collapses a conflict into one evidence_status.
    conflict_multi=query(panels,"F_ORDER_A","Q_MULTI")
    checks.extend([
        {"name":"multi:conflict_visible","pass":conflict_multi["arbitration"]=="HORIZON_CONFLICT"},
        {"name":"multi:no_synthetic_evidence_status","pass":"evidence_status" not in conflict_multi},
    ])

    # Replay-exact receipts.
    replay=[query(panels,pid,c) for pid in panels for c in CONTRACTS]
    checks.extend([
        {"name":"replay:accepted_receipts_exact","pass":canonical(accepted)==canonical(replay)},
        {"name":"replay:refusal_exact","pass":canonical(q_none)==canonical(query(panels,"A_RECENT_RISK",None))},
    ])

    # Hashes unique for contract-specific requests on same panel.
    hashes=[query(panels,"A_RECENT_RISK",c)["receipt_hash"] for c in CONTRACTS]
    checks.append({"name":"receipts:contract_hashes_distinct","pass":len(set(hashes))==len(hashes)})

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH28",
        "version":VERSION,
        "verdict":"PASS_AH28" if passed==len(checks) else "FAIL_AH28",
        "checks_passed":passed,
        "checks_total":len(checks),
        "panels":panels,
        "arbitration":{pid:arbitration(p) for pid,p in panels.items()},
        "sample_queries":{
            "Q_RECENT":q_recent,
            "Q_LIFETIME":q_life,
            "Q_ADAPTIVE":q_adapt,
            "Q_MULTI":q_multi,
            "MISSING":q_none,
            "UNKNOWN":q_bad,
        },
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "arbitration":result["arbitration"],
        "sample_queries":result["sample_queries"],
        "witness":{
            "same_lifetime":F["views"]["lifetime"]["table"]==G["views"]["lifetime"]["table"],
            "F_arbitration":arbitration(F),
            "G_arbitration":arbitration(G),
        },
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH28":
        raise SystemExit(1)

if __name__=="__main__":
    main()
