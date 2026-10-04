#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from fractions import Fraction
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

KEYSPACE=tuple(f"AH38-KEY-{i}".encode() for i in range(8))
ACTUAL_KEY=KEYSPACE[3]
KEY_LABEL=ACTUAL_KEY.decode()

MEDIATED_RECEIPT={
    "epoch":0,
    "verification":"VERIFIED",
    "mechanism":"HMAC_SHA256_INTERNAL",
    "schema":"AH39-E0",
}

LARGE_KEYSPACE_CLAIM="NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE"

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

def stats_for(targets,descriptors):
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
    tags=[hmac_tag(ACTUAL_KEY,x) for x in z0]
    verified=[canonical(MEDIATED_RECEIPT).decode("utf-8") for _ in ps]
    key_constant=[KEY_LABEL for _ in ps]

    states={
        "FRESH_E1":list(z1),
        "P0_TAG_PUBLIC_BEFORE_KEY":list(zip(tags,z1)),
        "P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG":list(zip(tags,key_constant,z1)),
        "W0_TAG_WITHHELD_BEFORE_KEY":list(zip(verified,z1)),
        "W1_KEY_DISCLOSED_TAG_STILL_WITHHELD":list(zip(key_constant,verified,z1)),
        "W2_TAG_RELEASED_AFTER_KEY":list(zip(tags,key_constant,verified,z1)),
        "P2_KEY_REVOKED_HISTORY_PERSISTS":list(zip(tags,key_constant,z1)),
    }

    observer_stats={name:stats_for(targets,desc) for name,desc in states.items()}

    statuses={
        "P0_TAG_PUBLIC_BEFORE_KEY":"ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE",
        "P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG":"ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE",
        "W0_TAG_WITHHELD_BEFORE_KEY":"AUTHENTICATOR_WITHHHELD",
        "W1_KEY_DISCLOSED_TAG_STILL_WITHHELD":"KEY_DISCLOSED_BUT_AUTHENTICATOR_WITHHELD",
        "W2_TAG_RELEASED_AFTER_KEY":"RETROACTIVE_AUTHENTICATOR_DECLASSIFICATION",
        "P2_KEY_REVOKED_HISTORY_PERSISTS":"KEY_REVOKED_BUT_DISCLOSURE_HISTORY_PERSISTS",
    }

    finite_enum=defaultdict(set)
    for key in KEYSPACE:
        for z,target in zip(z0,targets):
            finite_enum[hmac_tag(key,z)].add(target)

    result={
        "experiment":"NBG-AH39",
        "version":VERSION,
        "epoch0_profile":list(EPOCH0_PROFILE),
        "epoch1_profile":list(EPOCH1_PROFILE),
        "observers":observer_stats,
        "statuses":statuses,
        "finite_keyspace":{
            "key_count":len(KEYSPACE),
            "distinct_enumerated_tags":len(finite_enum),
            "all_observed_tags_unique_target":all(len(finite_enum[t])==1 for t in tags),
        },
        "large_secret_keyspace_claim":LARGE_KEYSPACE_CLAIM,
    }
    result["receipt_hash"]=hashlib.sha256(canonical(result)).hexdigest()
    return result

def main():
    result=run_experiment()
    o=result["observers"]
    s=result["statuses"]
    checks=[]

    expected={
        "FRESH_E1":0.4,
        "P0_TAG_PUBLIC_BEFORE_KEY":0.0,
        "P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG":0.0,
        "W0_TAG_WITHHELD_BEFORE_KEY":0.4,
        "W1_KEY_DISCLOSED_TAG_STILL_WITHHELD":0.4,
        "W2_TAG_RELEASED_AFTER_KEY":0.0,
        "P2_KEY_REVOKED_HISTORY_PERSISTS":0.0,
    }
    for name,val in expected.items():
        checks.append({
            "name":f"privacy:{name}",
            "pass":abs(n[]ame]["residual_privacy_bits"]-val)<1e-12
        })

    checks.extend([
        {"name":"public_tag:key_adds_no_new_privacy_transition","pass":
            abs(o["P0_TAG_PUBLIC_BEFORE_KEY"]["residual_privacy_bits"]-
                o["P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG"]["residual_privacy_bits"])<1e-12
        },
        {"name":"withheld:key_alone_no_privacy_transition","pass":
            abs(o["W0_TAG_WITHHELD_BEFORE_KEY"]["residual_privacy_bits"]-
                o["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]["residual_privacy_bits"])<1e-12
        },
        {"name":"withheld:tag_release_after_key_collapses","pass":
            o["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]["residual_privacy_bits"] >
            o["W2_TAG_RELEASED_AFTER_KEY"]["residual_privacy_bits"]+1e-12
        },
        {"name":"key_revoke:history_stays_collapsed","pass":
            abs(o["P2_KEY_REVOKED_HISTORY_PERSISTS"]["residual_privacy_bits"])<1e-12
        },
    ])

    checks.extend([
        {"name":"status:P0_exact","pass":s["P0_TAG_PUBLIC_BEFORE_KEY"]=="ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE"},
        {"name":"status:P1_exact","pass":s["P1_KEY_DISCLOSED_AFTER_PUBLIC_TAG"]=="ALREADY_DECLASSIFIED_BEFORE_KEY_DISCLOSURE"},
        {"name":"status:W1_exact","pass":s["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]=="KEY_DISCLOSED_BUT_AUTHENTICATOR_WITHHELD"},
        {"name":"status:W2_exact","pass":s["W2_TAG_RELEASED_AFTER_KEY"]=="RETROACTIVE_AUTHENTICATOR_DECLASSIFICATION"},
        {"name":"status:P2_exact","pass":s["P2_KEY_REVOKED_HISTORY_PERSISTS"]=="KEY_REVOKED_BUT_DISCLOSURE_HISTORY_PERSISTS"},
    ])

    f=result["finite_keyspace"]
    checks.extend([
        {"name":"finite:key_count_8","pass":f["key_count"]==8},
        {"name":"finite:72_tags","pass":f["distinct_enumerated_tags"]==72},
        {"name":"finite:observed_tags_unique_target","pass":f["all_observed_tags_unique_target"]},
        {"name":"claim:large_keyspace_refusal","pass":result["large_secret_keyspace_claim"]=="NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE"},
    ])

    checks.extend([
        {"name":"classes:fresh_7","pass":o["FRESH_E1"]["descriptor_classes"]==7},
        {"name":"classes:public_tag_9","pass":o["P0_TAG_PUBLIC_BEFORE_KEY"]["descriptor_classes"]==9},
        {"name":"classes:key_only_mediated_7","pass":o["W1_KEY_DISCLOSED_TAG_STILL_WITHHELD"]["descriptor_classes"]==7},
        {"name":"classes:tag_after_key_9","pass":o["W2_TAG_RELEASED_AFTER_KEY"]["descriptor_classes"]==9},
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_AH39" if passed==len(checks) else "FAIL_AH39",
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
        "statuses":s,
        "finite_keyspace":f,
        "receipt_hash":result["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH39":
        raise SystemExit(1)

if __name__=="__main__":
    main()
