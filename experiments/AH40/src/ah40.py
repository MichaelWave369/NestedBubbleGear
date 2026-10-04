#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from itertools import combinations
from pathlib import Path
import hashlib, hmac, json, math

VERSION="0.1.0"

L="Q_LIFETIME"
R="Q_RECENT"
A="Q_ADAPTIVE"

GRANTS=(
    ("HISTORIAN",L),
    ("OPERATOR",R),
    ("ADAPTIVE_CONTROLLER",A),
    ("AUDITOR",L),
    ("AUDITOR",R),
)

COMMON_ONLY="COMMON_ONLY"
TRIAGE="TRIAGE"
FULL_STATUS="FULL_STATUS"

EPOCH0_PROFILE=(TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY)
EPOCH1_PROFILE=(COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY)

VERIFIERS=("VERIFIER_A","VERIFIER_B","VERIFIER_C")
VERIFY_ONLY="VERIFY_ONLY"
DECLASSIFY="DECLASSIFY_EPOCH0"

KEYSPACE=tuple(f"AH38-KEY-{i}".encode() for i in range(8))
ACTUAL_KEY=KEYSPACE[3]

VERIFY_RECEIPT={
    "epoch":0,
    "verification":"VERIFIED",
    "action":"VERIFY_ONLY",
    "schema":"AH40-E0",
}

I_BATCH=(1444,456,456,144)
C_BATCH=(1805,95,95,505)
ANTI_BATCH=(1300,600,600,0)
INDEP_ARCHIVE=(57760,18240,18240,5760)
COMMON_ARCHIVE=(72200,3800,3800,20200)
ANTI_ARCHIVE=(52000,24000,24000,0)
LAMBDA=Fraction(1,10)
N_MIN=400

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

def discounted_final(archive,batches):
    d=tuple(Fraction(x,1) for x in archive)
    for batch in batches:
        d=tuple(LAMBDA*x+Fraction(y,1) for x,y in zip(d,batch))
    return d

def panel(archive,batches):
    lifetime=add_tables(archive,*batches)
    recent=add_tables(*batches[-2:]) if len(batches)>=2 else batches[-1]
    adaptive=discounted_final(archive,batches)
    return {
        "lifetime":classify(stats(lifetime)),
        "recent":classify(stats(recent)),
        "adaptive":classify(stats(adaptive)),
    }

def arbitration(p):
    life=p["lifetime"]; recent=p["recent"]
    if life==recent:
        return "CONSISTENT"
    if recent=="COMMON_MODE_EVIDENCE" and life!="COMMON_MODE_EVIDENCE":
        return "RECENT_RISK_ONLY"
    if life=="COMMON_MODE_EVIDENCE" and recent!="COMMON_MODE_EVIDENCE":
        return "LIFETIME_RISK_ONLY"
    return "HORIZON_CONFLICT"

def build_panels():
    return {
        "A":panel(INDEP_ARCHIVE,(I_BATCH,C_BATCH)),
        "B":panel(INDEP_ARCHIVE,(I_BATCH,C_BATCH,C_BATCH,I_BATCH)),
        "C":panel(INDEP_ARCHIVE,(I_BATCH,I_BATCH)),
        "D":panel(COMMON_ARCHIVE,(I_BATCH,I_BATCH)),
        "E":panel(COMMON_ARCHIVE,(C_BATCH,C_BATCH)),
        "F":panel(INDEP_ARCHIVE,(C_BATCH,C_BATCH,I_BATCH,I_BATCH)),
        "G":panel(INDEP_ARCHIVE,(I_BATCH,I_BATCH,C_BATCH,C_BATCH)),
        "H_ANTI_ALL":panel(ANTI_ARCHIVE,(ANTI_BATCH,ANTI_BATCH)),
        "I_ANTI_ARCHIVE_RECENT_CLEAN":panel(ANTI_ARCHIVE,(I_BATCH,I_BATCH)),
        "J_RECENT_ANTI":panel(INDEP_ARCHIVE,(ANTI_BATCH,ANTI_BATCH)),
    }

def target_multi(p):
    return (p["lifetime"],p["recent"],p["adaptive"],arbitration(p))

def transform(status,mode):
    if mode==COMMON_ONLY:
        return "COMMON" if status=="COMMON_MODE_EVIDENCE" else "NOT_COMMON"
    if mode==TRIAGE:
        if status=="COMMON_MODE_EVIDENCE":
            return "COMMON"
        if status=="INSUFFICIENT_EVIDENCE":
            return "UNKNOWN"
        return "KNOWN_NON_COMMON"
    if mode==FULL_STATUS:
        return status
    raise KeyError(mode)

def horizon_status(p,contract):
    if contract==L: return p["lifetime"]
    if contract==R: return p["recent"]
    if contract==A: return p["adaptive"]
    raise KeyError(contract)

def snapshot(p,profile):
    return tuple(
        (actor,contract,transform(horizon_status(p,contract),profile[i]))
        for i,(actor,contract) in enumerate(GRANTS)
    )

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def hmac_tag(key,z0):
    return hmac.new(key,canonical(z0),hashlib.sha256).hexdigest()

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for t,d in zip(targets,descriptors):
        groups[d].append(t)
    n=len(targets)
    return sum((len(g)/n)*entropy(g) for g in groups.values())

def descriptor_stats(targets,descriptors):
    return {
        "residual_privacy_bits":conditional_entropy(targets,descriptors),
        "descriptor_classes":len(set(descriptors)),
    }

def coalitions():
    return tuple(
        c
        for n in range(len(VERIFIERS)+1)
        for c in combinations(VERIFIERS,n)
    )

def verify_capable(coalition):
    return len(coalition)>=2

def declassify_capable(coalition):
    return len(coalition)==3

def action_receipt(coalition,action):
    coalition=list(coalition)
    if action==VERIFY_ONLY:
        if not verify_capable(coalition):
            return {
                "action":action,
                "coalition":coalition,
                "authority":"DENY",
                "refusal":"REFUSE_VERIFICATION_QUORUM",
            }
        return {
            "action":action,
            "coalition":coalition,
            "authority":"ALLOW",
            "public_output":VERIFY_RECEIPT,
            "status":"VERIFIED_WITHOUT_PUBLIC_DECLASSIFICATION",
        }

    if action==DECLASSIFY:
        if not declassify_capable(coalition):
            return {
                "action":action,
                "coalition":coalition,
                "authority":"DENY",
                "refusal":"REFUSE_DECLASSIFICATION_QUORUM",
            }
        return {
            "action":action,
            "coalition":coalition,
            "authority":"ALLOW",
            "status":"DECLASSIFIED_BY_3_OF_3_QUORUM",
        }
    raise KeyError(action)

def run_experiment():
    panels=build_panels()
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    z0=[snapshot(p,EPOCH0_PROFILE) for p in ps]
    z1=[snapshot(p,EPOCH1_PROFILE) for p in ps]
    tags=[hmac_tag(ACTUAL_KEY,x) for x in z0]
    verified=[canonical(VERIFY_RECEIPT).decode("utf-8") for _ in ps]

    coalition_rows=[]
    for c in coalitions():
        vr=action_receipt(c,VERIFY_ONLY)
        dr=action_receipt(c,DECLASSIFY)

        if vr["authority"]=="ALLOW":
            verify_desc=list(zip([tuple(c)]*len(ps),verified,z1))
            verify_stats=descriptor_stats(targets,verify_desc)
        else:
            verify_stats=None

        if dr["authority"]=="ALLOW":
            declassify_desc=list(zip([tuple(c)]*len(ps),z0,z1))
            declassify_stats=descriptor_stats(targets,declassify_desc)
        else:
            declassify_stats=None

        coalition_rows.append({
            "coalition":list(c),
            "verify":vr,
            "verify_public_stats":verify_stats,
            "declassify":dr,
            "declassify_public_stats":declassify_stats,
        })

    fresh=descriptor_stats(targets,z1)
    debug=descriptor_stats(targets,list(zip(verified,tags,z1)))

    body={
        "experiment":"NBG-AH40",
        "version":VERSION,
        "verifiers":list(VERIFIERS),
        "coalition_count":len(coalition_rows),
        "coalitions":coalition_rows,
        "fresh_e1":fresh,
        "debug_transcript_control":debug,
        "minimal_verification_coalitions":[
            list(c) for c in coalitions()
            if len(c)==2
        ],
        "minimal_declassification_coalitions":[list(VERIFIERS)],
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    result=run_experiment()
    rows=result["coalitions"]
    checks=[]

    checks.extend([
        {"name":"suite:8_coalitions","pass":result["coalition_count"]==8},
        {"name":"fresh:privacy_0p4","pass":abs(result["fresh_e1"]["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"fresh:classes_7","pass":result["fresh_e1"]["descriptor_classes"]==7},
    ])

    verify_allowed=[r for r in rows if r["verify"]["authority"]=="ALLOW"]
    verify_denied=[r for r in rows if r["verify"]["authority"]=="DENY"]
    declass_allowed=[r for r in rows if r["declassify"]["authority"]=="ALLOW"]
    declass_denied=[r for r in rows if r["declassify"]["authority"]=="DENY"]

    checks.extend([
        {"name":"verify:4_allowed","pass":len(verify_allowed)==4},
        {"name":"verify:4_denied","pass":len(verify_denied)==4},
        {"name":"verify:minimal_pairs_exact","pass":result["minimal_verification_coalitions"]==[
            ["VERIFIER_A","VERIFIER_B"],
            ["VERIFIER_A","VERIFIER_C"],
            ["VERIFIER_B","VERIFIER_C"],
        ]},
        {"name":"verify:no_mandatory_core","pass":
            set(result["minimal_verification_coalitions"][0])
            .intersection(*map(set,result["minimal_verification_coalitions"][1:]))==set()
        },
        {"name":"verify:all_allowed_privacy_0p4","pass":all(
            abs(r["verify_public_stats"]["residual_privacy_bits"]-0.4)<1e-12
            for r in verify_allowed
        )},
        {"name":"verify:all_allowed_classes_7","pass":all(
            r["verify_public_stats"]["descriptor_classes"]==7
            for r in verify_allowed
        )},
        {"name":"verify:denials_exact","pass":all(
            r["verify"]["refusal"]=="REFUSE_VERIFICATION_QUORUM"
            for r in verify_denied
        )},
    ])

    checks.extend([
        {"name":"declassify:1_allowed","pass":len(declass_allowed)==1},
        {"name":"declassify:7_denied","pass":len(declass_denied)==7},
        {"name":"declassify:full_only","pass":declass_allowed[0]["coalition"]==list(VERIFIERS)},
        {"name":"declassify:privacy_zero","pass":abs(
            declass_allowed[0]["declassify_public_stats"]["residual_privacy_bits"]
        )<1e-12},
        {"name":"declassify:classes_9","pass":
            declass_allowed[0]["declassify_public_stats"]["descriptor_classes"]==9
        },
        {"name":"declassify:status_exact","pass":
            declass_allowed[0]["declassify"]["status"]=="DECLASSIFIED_BY_3_OF_3_QUORUM"
        },
        {"name":"declassify:denials_exact","pass":all(
            r["declassify"]["refusal"]=="REFUSE_DECLASSIFICATION_QUORUM"
            for r in declass_denied
        )},
    ])

    full=[r for r in rows if r["coalition"]==list(VERIFIERS)][0]
    checks.extend([
        {"name":"full:verify_only_privacy_0p4","pass":abs(
            full["verify_public_stats"]["residual_privacy_bits"]-0.4
        )<1e-12},
        {"name":"full:declassify_privacy_zero","pass":abs(
            full["declassify_public_stats"]["residual_privacy_bits"]
        )<1e-12},
        {"name":"full:capability_not_action","pass":
            full["verify"]["authority"]=="ALLOW" and
            full["declassify"]["authority"]=="ALLOW" and
            full["verify_public_stats"]["residual_privacy_bits"] >
            full["declassify_public_stats"]["residual_privacy_bits"]+1e-12
        },
    ])

    checks.extend([
        {"name":"debug:privacy_zero","pass":abs(
            result["debug_transcript_control"]["residual_privacy_bits"]
        )<1e-12},
        {"name":"debug:classes_9","pass":
            result["debug_transcript_control"]["descriptor_classes"]==9
        },
        {"name":"output_schema:mediated_beats_debug","pass":
            result["fresh_e1"]["residual_privacy_bits"] >
            result["debug_transcript_control"]["residual_privacy_bits"]+1e-12
        },
    ])

    # Refused receipts must contain no panel-dependent evidence fields.
    forbidden={"epoch0_snapshot","tag","key","digest","public_output"}
    checks.extend([
        {"name":"refusal:no_verify_evidence_fields","pass":all(
            not (forbidden & set(r["verify"].keys()))
            for r in verify_denied
        )},
        {"name":"refusal:no_declassify_evidence_fields","pass":all(
            not (forbidden & set(r["declassify"].keys()))
            for r in declass_denied
        )},
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_AH40" if passed==len(checks) else "FAIL_AH40",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    data=(json.dumps(payload,indent=2,sort_keys=True)+"
").encode()
    (out/"result.json").write_bytes(data)

    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "verification_allowed":len(verify_allowed),
        "declassification_allowed":len(declass_allowed),
        "minimal_verification_coalitions":result["minimal_verification_coalitions"],
        "minimal_declassification_coalitions":result["minimal_declassification_coalitions"],
        "full_verify_privacy":full["verify_public_stats"]["residual_privacy_bits"],
        "full_declassify_privacy":full["declassify_public_stats"]["residual_privacy_bits"],
        "debug_control_privacy":result["debug_transcript_control"]["residual_privacy_bits"],
        "receipt_hash":result["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH40":
        raise SystemExit(1)

if __name__=="__main__":
    main()
