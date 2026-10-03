#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path
import hashlib, json, math

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)

LAMBDA=Fraction(1,10)
N_MIN=400
VERSION="0.1.0"

CONTRACTS={
    "Q_LIFETIME":{"horizon":"LIFETIME","source":"lifetime"},
    "Q_RECENT":{"horizon":"RECENT_2","source":"recent2"},
    "Q_ADAPTIVE":{"horizon":"DISCOUNTED_0.1","source":"adaptive"},
    "Q_MULTI":{"horizon":"MULTI","source":"multi"},
}

ROLE_AUTHORITY={
    "HISTORIAN":("Q_LIFETIME",),
    "OPERATOR":("Q_RECENT",),
    "ADAPTIVE_CONTROLLER":("Q_ADAPTIVE",),
    "AUDITOR":("Q_LIFETIME","Q_RECENT"),
    "TRI_HORIZON_ANALYST":("Q_LIFETIME","Q_RECENT","Q_ADAPTIVE"),
    "ROOT_GOVERNOR":("Q_LIFETIME","Q_RECENT","Q_ADAPTIVE","Q_MULTI"),
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
        state=classify(s)
        views[name]={
            "status":state,
            "signal":signal(state),
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

def substrate_release(p,contract):
    if contract=="Q_MULTI":
        return {
            "horizon":"MULTI",
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
            "arbitration":arbitration(p),
            "source_memory":"MULTI_HORIZON",
        }
    meta=CONTRACTS[contract]
    v=p["views"][meta["source"]]
    return {
        "horizon":meta["horizon"],
        "evidence_status":v["status"],
        "scoped_signal":v["signal"],
        "source_memory":meta["source"],
    }

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def receipt_hash(body):
    return hashlib.sha256(canonical(body)).hexdigest()

def role_query(panels,role,panel_id,contract):
    if role not in ROLE_AUTHORITY:
        body={"version":VERSION,"role":role,"panel_id":panel_id,"authority":"DENY","refusal":"REFUSE_UNKNOWN_ROLE"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if panel_id not in panels:
        body={"version":VERSION,"role":role,"panel_id":panel_id,"authority":"DENY","refusal":"REFUSE_UNKNOWN_PANEL"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if contract is None:
        body={"version":VERSION,"role":role,"panel_id":panel_id,"authority":"DENY","refusal":"REFUSE_UNDERSPECIFIED_HORIZON"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if contract not in CONTRACTS:
        body={"version":VERSION,"role":role,"panel_id":panel_id,"requested_contract":contract,"authority":"DENY","refusal":"REFUSE_UNKNOWN_QUERY_CONTRACT"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    if contract not in ROLE_AUTHORITY[role]:
        body={"version":VERSION,"role":role,"panel_id":panel_id,"requested_contract":contract,"authority":"DENY","refusal":"REFUSE_UNAUTHORIZED_HORIZON"}
        body["receipt_hash"]=receipt_hash(body)
        return body

    body={
        "version":VERSION,
        "role":role,
        "panel_id":panel_id,
        "query_contract":contract,
        "authority":"ALLOW",
        "release":substrate_release(panels[panel_id],contract),
    }
    body["receipt_hash"]=receipt_hash(body)
    return body

def role_projection(p,role):
    states={}
    if "Q_LIFETIME" in ROLE_AUTHORITY[role]:
        states["lifetime"]=p["views"]["lifetime"]["status"]
    if "Q_RECENT" in ROLE_AUTHORITY[role]:
        states["recent2"]=p["views"]["recent2"]["status"]
    if "Q_ADAPTIVE" in ROLE_AUTHORITY[role]:
        states["adaptive"]=p["views"]["adaptive"]["status"]
    if "Q_MULTI" in ROLE_AUTHORITY[role]:
        states["multi_arbitration"]=arbitration(p)
    return states

def derive_multi_from_singles(panels,role,panel_id):
    required=("Q_LIFETIME","Q_RECENT","Q_ADAPTIVE")
    if not all(c in ROLE_AUTHORITY[role] for c in required):
        return None
    p=panels[panel_id]
    states={
        "lifetime":p["views"]["lifetime"]["status"],
        "recent2":p["views"]["recent2"]["status"],
        "adaptive":p["views"]["adaptive"]["status"],
    }
    signals={k:signal(v) for k,v in states.items()}
    life=states["lifetime"]; recent=states["recent2"]
    if life==recent:
        arb="CONSISTENT"
    elif recent=="COMMON_MODE_EVIDENCE" and life!="COMMON_MODE_EVIDENCE":
        arb="RECENT_RISK_ONLY"
    elif life=="COMMON_MODE_EVIDENCE" and recent!="COMMON_MODE_EVIDENCE":
        arb="LIFETIME_RISK_ONLY"
    else:
        arb="HORIZON_CONFLICT"
    return {
        "horizon":"MULTI",
        "states":states,
        "signals":signals,
        "arbitration":arb,
        "source_memory":"DERIVED_FROM_AUTHORIZED_SINGLES",
    }

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for t,d in zip(targets,descriptors):
        groups[d].append(t)
    n=len(targets)
    return sum((len(g)/n)*entropy(g) for g in groups.values())

def multi_target(p):
    return (
        p["views"]["lifetime"]["status"],
        p["views"]["recent2"]["status"],
        p["views"]["adaptive"]["status"],
        arbitration(p),
    )

def main():
    panels=build_panels()
    checks=[]

    # Authority matrix exact.
    expected_roles={
        "HISTORIAN":("Q_LIFETIME",),
        "OPERATOR":("Q_RECENT",),
        "ADAPTIVE_CONTROLLER":("Q_ADAPTIVE",),
        "AUDITOR":("Q_LIFETIME","Q_RECENT"),
        "TRI_HORIZON_ANALYST":("Q_LIFETIME","Q_RECENT","Q_ADAPTIVE"),
        "ROOT_GOVERNOR":("Q_LIFETIME","Q_RECENT","Q_ADAPTIVE","Q_MULTI"),
    }
    checks.append({"name":"authority:matrix_exact","pass":ROLE_AUTHORITY==expected_roles})

    # Capability != authority witness.
    substrate=substrate_release(panels["A_RECENT_RISK"],"Q_RECENT")
    historian_denied=role_query(panels,"HISTORIAN","A_RECENT_RISK","Q_RECENT")
    checks.extend([
        {"name":"capability:substrate_can_recent","pass":substrate["evidence_status"]=="COMMON_MODE_EVIDENCE"},
        {"name":"authority:historian_recent_denied","pass":historian_denied["refusal"]=="REFUSE_UNAUTHORIZED_HORIZON"},
    ])

    # Release invariance witnesses compare release payloads only, not caller-supplied panel ids.
    hF=role_query(panels,"HISTORIAN","F_ORDER_A","Q_LIFETIME")["release"]
    hG=role_query(panels,"HISTORIAN","G_ORDER_B","Q_LIFETIME")["release"]
    oC=role_query(panels,"OPERATOR","C_CONSISTENT_COMPATIBLE","Q_RECENT")["release"]
    oD=role_query(panels,"OPERATOR","D_LIFETIME_RISK","Q_RECENT")["release"]
    aC=role_query(panels,"ADAPTIVE_CONTROLLER","C_CONSISTENT_COMPATIBLE","Q_ADAPTIVE")["release"]
    aF=role_query(panels,"ADAPTIVE_CONTROLLER","F_ORDER_A","Q_ADAPTIVE")["release"]

    checks.extend([
        {"name":"invariance:historian_same_release","pass":hF==hG},
        {"name":"invariance:historian_recent_differs","pass":panels["F_ORDER_A"]["views"]["recent2"]["status"]!=panels["G_ORDER_B"]["views"]["recent2"]["status"]},
        {"name":"invariance:operator_same_release","pass":oC==oD},
        {"name":"invariance:operator_lifetime_differs","pass":panels["C_CONSISTENT_COMPATIBLE"]["views"]["lifetime"]["status"]!=panels["D_LIFETIME_RISK"]["views"]["lifetime"]["status"]},
        {"name":"invariance:adaptive_same_release","pass":aC==aF},
        {"name":"invariance:adaptive_lifetime_differs","pass":panels["C_CONSISTENT_COMPATIBLE"]["views"]["lifetime"]["status"]!=panels["F_ORDER_A"]["views"]["lifetime"]["status"]},
    ])

    # Auditor snapshot witness.
    auditor_A=role_projection(panels["A_RECENT_RISK"],"AUDITOR")
    auditor_B=role_projection(panels["B_THREE_WAY_SPLIT"],"AUDITOR")
    checks.extend([
        {"name":"invariance:auditor_projection_same","pass":auditor_A==auditor_B},
        {"name":"invariance:auditor_adaptive_differs","pass":panels["A_RECENT_RISK"]["views"]["adaptive"]["status"]!=panels["B_THREE_WAY_SPLIT"]["views"]["adaptive"]["status"]},
    ])

    # Denied Q_MULTI for TRI, yet derivable from singles.
    tri_denials=[]
    tri_derivation=[]
    for pid,p in panels.items():
        denied=role_query(panels,"TRI_HORIZON_ANALYST",pid,"Q_MULTI")
        derived=derive_multi_from_singles(panels,"TRI_HORIZON_ANALYST",pid)
        direct=substrate_release(p,"Q_MULTI")
        tri_denials.append(denied["refusal"]=="REFUSE_UNAUTHORIZED_HORIZON")
        comparable={k:derived[k] for k in ("horizon","states","signals","arbitration")}
        expected={k:direct[k] for k in ("horizon","states","signals","arbitration")}
        tri_derivation.append(comparable==expected)

    checks.extend([
        {"name":"tri:Q_MULTI_denied_all_panels","pass":all(tri_denials)},
        {"name":"tri:Q_MULTI_derivable_all_panels","pass":all(tri_derivation)},
    ])

    # Conditional entropy over uniform seven-panel ensemble.
    panel_list=list(panels.values())
    target=[multi_target(p) for p in panel_list]
    life=[p["views"]["lifetime"]["status"] for p in panel_list]
    recent=[p["views"]["recent2"]["status"] for p in panel_list]
    adaptive=[p["views"]["adaptive"]["status"] for p in panel_list]
    auditor_desc=list(zip(life,recent))
    tri_desc=list(zip(life,recent,adaptive))

    H_multi_given_auditor=conditional_entropy(target,auditor_desc)
    H_multi_given_tri=conditional_entropy(target,tri_desc)
    H_recent_given_life=conditional_entropy(recent,life)
    H_life_given_recent=conditional_entropy(life,recent)
    H_multi_given_adaptive=conditional_entropy(target,adaptive)

    checks.extend([
        {"name":"entropy:auditor_residual","pass":abs(H_multi_given_auditor-0.39355535745192405)<1e-12},
        {"name":"entropy:tri_zero","pass":abs(H_multi_given_tri)<1e-12},
        {"name":"entropy:historian_recent_residual","pass":abs(H_recent_given_life-0.7493017854052187)<1e-12},
        {"name":"entropy:operator_lifetime_residual","pass":abs(H_life_given_recent-1.1428571428571428)<1e-12},
        {"name":"entropy:adaptive_multi_residual","pass":abs(H_multi_given_adaptive-1.1428571428571428)<1e-12},
    ])

    # Root still cannot omit horizon.
    root_none=role_query(panels,"ROOT_GOVERNOR","A_RECENT_RISK",None)
    checks.append({"name":"root:underspecified_refused","pass":root_none["refusal"]=="REFUSE_UNDERSPECIFIED_HORIZON"})

    # Denied receipts contain no evidence payload fields.
    denied_receipts=[]
    for role in ROLE_AUTHORITY:
        for contract in CONTRACTS:
            if contract not in ROLE_AUTHORITY[role]:
                denied_receipts.append(role_query(panels,role,"A_RECENT_RISK",contract))
    forbidden={"release","evidence_status","states","signals","arbitration","scoped_signal"}
    checks.append({
        "name":"receipts:denials_no_evidence_fields",
        "pass":all(not(forbidden & set(r.keys())) for r in denied_receipts)
    })

    # Accepted receipts are replay exact and contain ALLOW.
    accepted=[
        role_query(panels,role,pid,contract)
        for role in ROLE_AUTHORITY
        for pid in panels
        for contract in ROLE_AUTHORITY[role]
    ]
    replay=[
        role_query(panels,role,pid,contract)
        for role in ROLE_AUTHORITY
        for pid in panels
        for contract in ROLE_AUTHORITY[role]
    ]
    checks.extend([
        {"name":"receipts:accepted_allow","pass":all(r["authority"]=="ALLOW" for r in accepted)},
        {"name":"replay:accepted_exact","pass":canonical(accepted)==canonical(replay)},
    ])

    # Unknown role refusal.
    unknown=role_query(panels,"NO_SUCH_ROLE","A_RECENT_RISK","Q_LIFETIME")
    checks.append({"name":"authority:unknown_role_refused","pass":unknown["refusal"]=="REFUSE_UNKNOWN_ROLE"})

    passed=sum(c["pass"] for c in checks)
    result={
        "experiment":"NBG-AH29",
        "version":VERSION,
        "verdict":"PASS_AH29" if passed==len(checks) else "FAIL_AH29",
        "checks_passed":passed,
        "checks_total":len(checks),
        "roles":{k:list(v) for k,v in ROLE_AUTHORITY.items()},
        "panel_count":len(panels),
        "entropy_bits":{
            "H_multi_given_auditor":H_multi_given_auditor,
            "H_multi_given_tri":H_multi_given_tri,
            "H_recent_given_lifetime":H_recent_given_life,
            "H_lifetime_given_recent":H_life_given_recent,
            "H_multi_given_adaptive":H_multi_given_adaptive,
        },
        "witnesses":{
            "historian_F_G_same_release":hF==hG,
            "operator_C_D_same_release":oC==oD,
            "adaptive_C_F_same_release":aC==aF,
            "auditor_A_B_same_projection":auditor_A==auditor_B,
            "tri_multi_denied_all":all(tri_denials),
            "tri_multi_derivable_all":all(tri_derivation),
        },
        "sample_denial":historian_denied,
        "sample_root_underspecified":root_none,
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    payload=(json.dumps(result,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(payload)

    print(json.dumps({
        "verdict":result["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "entropy_bits":result["entropy_bits"],
        "witnesses":result["witnesses"],
        "result_sha256":hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result["verdict"]!="PASS_AH29":
        raise SystemExit(1)

if __name__=="__main__":
    main()
