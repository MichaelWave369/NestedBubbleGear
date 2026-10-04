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

PUBLIC_SALT=b"AH38-PUBLIC-SALT-v1"
KEYSPACE=tuple(f"AH38-KEY-{i}".encode() for i in range(8))
ACTUAL_KEY=KEYSPACE[3]
SECRET_SALT_SPACE=tuple(f"AH38-SALT-{i}".encode() for i in range(8))
ACTUAL_SECRET_SALT=SECRET_SALT_SPACE[5]

MEDIATED_RECEIPT={
    "epoch":0,
    "verification":"VERIFIED",
    "mechanism":"HMAC_SHA256_INTERNAL",
    "schema":"AH38-E0",
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

def public_digest(z0):
    return hashlib.sha256(canonical(z0)).hexdigest()

def public_salt_digest(z0):
    return hashlib.sha256(PUBLIC_SALT+canonical(z0)).hexdigest()

def hmac_tag(key,z0):
    return hmac.new(key,canonical(z0),hashlib.sha256).hexdigest()

def secret_salt_digest(salt,z0):
    return hashlib.sha256(salt+canonical(z0)).hexdigest()

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

def candidate_map(values,targets):
    out=defaultdict(set)
    for value,target in zip(values,targets):
        out[value].add(target)
    return out

def run_experiment():
    panels=build_panels()
    ps=list(panels.values())
    targets=[target_multi(p) for p in ps]
    z0=[snapshot(p,EPOCH0_PROFILE) for p in ps]
    z1=[snapshot(p,EPOCH1_PROFILE) for p in ps]

    d_public=[public_digest(x) for x in z0]
    d_public_salt=[public_salt_digest(x) for x in z0]
    tags=[hmac_tag(ACTUAL_KEY,x) for x in z0]
    d_secret_salt=[secret_salt_digest(ACTUAL_SECRET_SALT,x) for x in z0]

    mediated=[canonical(MEDIATED_RECEIPT).decode("utf-8") for _ in ps]

    # Finite HMAC attacker enumerates all known candidate keys x distinct old states.
    hmac_enum=defaultdict(set)
    for key in KEYSPACE:
        for x,target in zip(z0,targets):
            hmac_enum[hmac_tag(key,x)].add(target)

    secret_salt_enum=defaultdict(set)
    for salt in SECRET_SALT_SPACE:
        for x,target in zip(z0,targets):
            secret_salt_enum[secret_salt_digest(salt,x)].add(target)

    observers={
        "FRESH_E1":descriptor_stats(targets,z1),
        "PUBLIC_DIGEST_E1":descriptor_stats(targets,list(zip(d_public,z1))),
        "PUBLIC_SALT_DIGEST_E1":descriptor_stats(targets,list(zip(d_public_salt,z1))),
        "FINITE_KEYSPACE_HMAC_TAG_E1":descriptor_stats(targets,list(zip(tags,z1))),
        "FINITE_SECRET_SALT_DIGEST_E1":descriptor_stats(targets,list(zip(d_secret_salt,z1))),
        "MEDIATED_VERIFIED_E1":descriptor_stats(targets,list(zip(mediated,z1))),
        "KEY_AUTHORIZED_VERIFIER":descriptor_stats(targets,list(zip(tags,z1))),
    }

    hmac_observed_target_counts=[len(hmac_enum[tag]) for tag in tags]
    salt_observed_target_counts=[len(secret_salt_enum[d]) for d in d_secret_salt]

    result={
        "experiment":"NBG-AH38",
        "version":VERSION,
        "epoch0_profile":list(EPOCH0_PROFILE),
        "epoch1_profile":list(EPOCH1_PROFILE),
        "observers":observers,
        "public_digest":{
            "distinct_values":len(set(d_public)),
        },
        "public_salt_digest":{
            "public_salt":PUBLIC_SALT.decode(),
            "distinct_values":len(set(d_public_salt)),
        },
        "finite_hmac":{
            "keyspace_size":len(KEYSPACE),
            "actual_key_index":3,
            "distinct_observed_tags":len(set(tags)),
            "distinct_enumerated_tags":len(hmac_enum),
            "observed_tag_target_class_counts":hmac_observed_target_counts,
            "every_observed_tag_identifies_one_target":all(x==1 for x in hmac_observed_target_counts),
        },
        "finite_secret_salt":{
            "salt_space_size":len(SECRET_SALT_SPACE),
            "actual_salt_index":5,
            "distinct_observed_digests":len(set(d_secret_salt)),
            "distinct_enumerated_digests":len(secret_salt_enum),
            "observed_digest_target_class_counts":salt_observed_target_counts,
            "every_observed_digest_identifies_one_target":all(x==1 for x in salt_observed_target_counts),
        },
        "mediated_receipt":MEDIATED_RECEIPT,
        "large_secret_keyspace_claim":LARGE_KEYSPACE_CLAIM,
    }
    result["receipt_hash"]=hashlib.sha256(canonical(result)).hexdigest()
    return result

def main():
    result=run_experiment()
    o=result["observers"]
    h=result["finite_hmac"]
    s=result["finite_secret_salt"]
    checks=[]

    checks.extend([
        {"name":"fresh:privacy_0p4","pass":abs(o["FRESH_E1"]["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"public_digest:privacy_zero","pass":abs(o["PUBLIC_DIGEST_E1"]["residual_privacy_bits"])<1e-12},
        {"name":"public_digest:9_classes","pass":result["public_digest"]["distinct_values"]==9},
        {"name":"public_salt:privacy_zero","pass":abs(o["PUBLIC_SALT_DIGEST_E1"]["residual_privacy_bits"])<1e-12},
        {"name":"public_salt:9_classes","pass":result["public_salt_digest"]["distinct_values"]==9},
    ])

    checks.extend([
        {"name":"hmac:keyspace_8","pass":h["keyspace_size"]==8},
        {"name":"hmac:9_observed_tags","pass":h["distinct_observed_tags"]==9},
        {"name":"hmac:72_enumerated_tags","pass":h["distinct_enumerated_tags"]==72},
        {"name":"hmac:enumeration_unique_target","pass":h["every_observed_tag_identifies_one_target"]},
        {"name":"hmac:privacy_zero","pass":abs(o["FINITE_KEYSPACE_HMAC_TAG_E1"]["residual_privacy_bits"])<1e-12},
    ])

    checks.extend([
        {"name":"secret_salt:space_8","pass":s["salt_space_size"]==8},
        {"name":"secret_salt:9_observed_digests","pass":s["distinct_observed_digests"]==9},
        {"name":"secret_salt:72_enumerated_digests","pass":s["distinct_enumerated_digests"]==72},
        {"name":"secret_salt:enumeration_unique_target","pass":s["every_observed_digest_identifies_one_target"]},
        {"name":"secret_salt:privacy_zero","pass":abs(o["FINITE_SECRET_SALT_DIGEST_E1"]["residual_privacy_bits"])<1e-12},
    ])

    checks.extend([
        {"name":"mediated:privacy_0p4","pass":abs(o["MEDIATED_VERIFIED_E1"]["residual_privacy_bits"]-0.4)<1e-12},
        {"name":"mediated:equals_fresh","pass":abs(
            o["MEDIATED_VERIFIED_E1"]["residual_privacy_bits"]-
            o["FRESH_E1"]["residual_privacy_bits"]
        )<1e-12},
        {"name":"mediated:receipt_panel_independent","pass":o["MEDIATED_VERIFIED_E1"]["descriptor_classes"]==7},
        {"name":"key_verifier:privacy_zero","pass":abs(o["KEY_AUTHORIZED_VERIFIER"]["residual_privacy_bits"])<1e-12},
        {"name":"claim:large_keyspace_refusal","pass":result["large_secret_keyspace_claim"]=="NO_INFORMATION_THEORETIC_CLAIM_FOR_LARGE_SECRET_KEYSPACE"},
    ])

    checks.extend([
        {"name":"authority:verification_vs_disclosure_separated","pass":
            o["MEDIATED_VERIFIED_E1"]["residual_privacy_bits"] >
            o["KEY_AUTHORIZED_VERIFIER"]["residual_privacy_bits"]+1e-12
        },
        {"name":"control:public_salt_not_better_than_public_digest","pass":abs(
            o["PUBLIC_SALT_DIGEST_E1"]["residual_privacy_bits"]-
            o["PUBLIC_DIGEST_E1"]["residual_privacy_bits"]
        )<1e-12},
    ])

    replay=run_experiment()
    checks.extend([
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ])

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_AH38" if passed==len(checks) else "FAIL_AH38",
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
        "finite_hmac":h,
        "finite_secret_salt":s,
        "large_secret_keyspace_claim":result["large_secret_keyspace_claim"],
        "receipt_hash":result["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_AH38":
        raise SystemExit(1)

if __name__=="__main__":
    main()
