#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
from pathlib import Path
import hashlib, json, math

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

SEAL_RECEIPT={
    "epoch":0,
    "status":"SEALED",
    "schema":"AH37-E0",
    "policy_transition":"REVOKE_H_L_TRIAGE",
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

def public_commitment(snapshot_value):
    return hashlib.sha256(canonical(snapshot_value)).hexdigest()

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

def run_experiment():
    panels=build_panels()
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]

    z0=[snapshot(p,EPOCH0_PROFILE) for p in ps]
    z1=[snapshot(p,EPOCH1_PROFILE) for p in ps]
    c0=[public_commitment(x) for x in z0]
    seal=[canonical(SEAL_RECEIPT).decode("utf-8") for _ in ps]

    observers={
        "FRESH_E1":descriptor_stats(targets,z1),
        "LEGACY_E0_E1":descriptor_stats(targets,list(zip(z0,z1))),
        "PUBLIC_COMMITMENT_E0_E1":descriptor_stats(targets,list(zip(c0,z1))),
        "METADATA_ONLY_E0_E1":descriptor_stats(targets,list(zip(seal,z1))),
        "PUBLIC_COMMITMENT_ONLY":descriptor_stats(targets,c0),
        "EPOCH0_ONLY":descriptor_stats(targets,z0),
    }

    digest_targets=defaultdict(set)
    for digest,target in zip(c0,targets):
        digest_targets[digest].add(target)

    enumeration={
        "candidate_panels":len(ps),
        "distinct_epoch0_snapshots":len(set(z0)),
        "distinct_public_commitments":len(set(c0)),
        "digest_target_class_counts":{
            d:len(v) for d,v in sorted(digest_targets.items())
        },
        "every_digest_maps_to_one_target":all(len(v)==1 for v in digest_targets.values()),
    }

    body={
        "experiment":"NBG-AH37",
        "version":VERSION,
        "epoch0_profile":list(EPOCH0_PROFILE),
        "epoch1_profile":list(EPOCH1_PROFILE),
        "observers":observers,
        "enumeration":enumeration,
        "seal_receipt":SEAL_RECEIPT,
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    result=run_experiment()
    o=result["observers"]
    e=result["enumeration"]
    checks=[]

    checks.extend([
        {"name":"epoch0:privacy_zero","pass":abs(o["EPOCH0_ONLY"]["residual_privacy_bits"])<1e-12},
        {"name":"epoch0:classes_9","pass":o["EPOCH0_ONLY"]["descriptor_classes"]==9},
        {"name":"epoch1:fresh_privacy_0p4","pass":abs(o["FRESH_E1"]["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"epoch1:fresh_classes_7","pass":o["FRESH_E1"]["descriptor_classes"]==7},
    ])

    checks.extend([
        {"name":"legacy:privacy_zero","pass":abs(o["LEGACY_E0_E1"]["residual_privacy_bits"])<1e-12},
        {"name":"public_commitment:privacy_zero","pass":abs(o["PUBLIC_COMMITMENT_E0_E1"]["residual_privacy_bits"])<1e-12},
        {"name":"public_commitment_only:privacy_zero","pass":abs(o["PUBLIC_COMMITMENT_ONLY"]["residual_privacy_bits"])<1e-12},
        {"name":"metadata_only:privacy_0p4","pass":abs(o["METADATA_ONLY_E0_E1"]["residual_privacy_bits"]-0.4)<1e-12},
    ])

    checks.extend([
        {"name":"commitment:9_epoch0_snapshots","pass":e["distinct_epoch0_snapshots"]==9},
        {"name":"commitment:9_public_digests","pass":e["distinct_public_commitments"]==9},
        {"name":"commitment:all_digests_unique_target","pass":e["every_digest_maps_to_one_target"]},
    ])

    # Boundary comparisons.
    checks.extend([
        {"name":"boundary:fresh_vs_legacy","pass":
            o["FRESH_E1"]["residual_privacy_bits"]>o["LEGACY_E0_E1"]["residual_privacy_bits"]+1e-12
        },
        {"name":"boundary:fresh_vs_public_commitment","pass":
            o["FRESH_E1"]["residual_privacy_bits"]>o["PUBLIC_COMMITMENT_E0_E1"]["residual_privacy_bits"]+1e-12
        },
        {"name":"boundary:metadata_equals_fresh","pass":
            abs(o["METADATA_ONLY_E0_E1"]["residual_privacy_bits"]-o["FRESH_E1"]["residual_privacy_bits"])<1e-12
        },
    ])

    # Profiles exact.
    checks.extend([
        {"name":"profile:epoch0_exact","pass":result["epoch0_profile"]==[
            TRIAGE,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY
        ]},
        {"name":"profile:epoch1_exact","pass":result["epoch1_profile"]==[
            COMMON_ONLY,COMMON_ONLY,FULL_STATUS,COMMON_ONLY,COMMON_ONLY
        ]},
    ])

    # Public digest is deterministic and replay exact.
    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_AH37" if passed==len(checks) else "FAIL_AH37",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }

    out=Path(__file__).resolve().parents[1]/"results"
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)

    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "observers":o,
        "enumeration":e,
        "receipt_hash":result["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH37":
        raise SystemExit(1)

if __name__=="__main__":
    main()
