#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
import hashlib, json, math

VERSION="0.1.0"
ROOT=Path(__file__).resolve().parents[1]

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def powerset(items):
    items=tuple(items)
    return tuple(c for n in range(len(items)+1) for c in combinations(items,n))

# ---------- baseline helpers ----------

def destroys_baseline(success,failed):
    f=set(failed)
    return all(f & set(s) for s in success)

def destroys_m01(success,failed):
    f=set(failed)
    return any(f & set(s) for s in success)

def minimal_family(rows):
    sets={frozenset(x) for x in rows}
    mins=[s for s in sets if not any(t < s for t in sets)]
    return tuple(sorted((tuple(sorted(s)) for s in mins),key=lambda x:(len(x),x)))

def hitting_baseline(elements,success):
    good=[c for c in powerset(elements) if all(set(c)&set(s) for s in success)]
    return minimal_family(good)

def hitting_m02(elements,success):
    good=[c for c in powerset(elements) if all(set(s).issubset(set(c)) for s in success)]
    return minimal_family(good)

def fuse_baseline(rootmap,a,b):
    merged=f"{a}+{b}"
    return {p:(merged if r in (a,b) else r) for p,r in rootmap.items()}

def fuse_m03(rootmap,a,b):
    # Wrong: one of the supposedly fused members gets a fresh independent root.
    merged=f"{a}+{b}"
    out={}
    fresh_used=False
    for p,r in rootmap.items():
        if r==a:
            out[p]=merged
        elif r==b:
            if not fresh_used:
                out[p]=f"FRESH_{b}"
                fresh_used=True
            else:
                out[p]=merged
        else:
            out[p]=r
    return out

def root_threshold(rootmap,k):
    principals=tuple(rootmap)
    roots=tuple(sorted(set(rootmap.values())))
    for size in range(len(roots)+1):
        for rc in combinations(roots,size):
            held={p for p in principals if rootmap[p] in rc}
            if len(held)>=k:
                return size
    raise AssertionError("no threshold")

def root_threshold_m04(rootmap,k):
    base=root_threshold(rootmap,k)
    return min(len(set(rootmap.values())),base+1)

def certify_baseline(observed):
    vals=list(observed.values())
    if any(v is None for v in vals):
        return {"status":"INDEPENDENCE_UNVERIFIED","advertise":False}
    if len(set(vals))==len(vals):
        return {"status":"CERTIFIED_INDEPENDENT","advertise":True}
    return {"status":"SHARED_CONTROL_OBSERVED","advertise":False}

def certify_m05(observed):
    vals=[f"MISSING_{i}" if v is None else v for i,v in enumerate(observed.values())]
    if len(set(vals))==len(vals):
        return {"status":"CERTIFIED_INDEPENDENT","advertise":True}
    return {"status":"SHARED_CONTROL_OBSERVED","advertise":False}

def certify_m06(observed):
    if all(v is not None for v in observed.values()):
        return {"status":"CERTIFIED_INDEPENDENT","advertise":True}
    return {"status":"INDEPENDENCE_UNVERIFIED","advertise":False}

def event_baseline(provenance):
    if provenance!="TRUSTED":
        return {"event_action":"REFUSE_UNTRUSTED_CHANGE_EVENT","status":"CERTIFIED_FRESH","advertise":True}
    return {"event_action":"ACCEPT_TRUSTED_CHANGE_EVENT","status":"INDEPENDENCE_REVOKED_PENDING_REVALIDATION","advertise":False}

def event_m07(provenance):
    return {"event_action":"ACCEPT_CHANGE_EVENT","status":"INDEPENDENCE_REVOKED_PENDING_REVALIDATION","advertise":False}

def event_m08(provenance):
    if provenance=="TRUSTED":
        return {"event_action":"ACCEPT_TRUSTED_CHANGE_EVENT","status":"SHARED_CONTROL_OBSERVED","advertise":False}
    return event_baseline(provenance)

def coarse_baseline(fine,cmap):
    return [cmap[x] for x in fine]

def coarse_m09(fine,cmap):
    return [(x,cmap[x]) for x in fine]

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((v/n)*math.log2(v/n) for v in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for y,d in zip(targets,descriptors):
        groups[d].append(y)
    n=len(targets)
    return sum((len(v)/n)*entropy(v) for v in groups.values())

def refine_baseline(coarse,extra):
    return list(zip(coarse,extra))

def refine_m10(coarse,extra):
    return list(extra)

def authorize_baseline(controlled,threshold):
    return controlled>=threshold

def authorize_m11(controlled,threshold):
    return controlled>=max(0,threshold-1)

FORBIDDEN={"epoch0_snapshot","tag","key","digest","public_output"}

def refusal_baseline():
    return {"authority":"DENY","refusal":"REFUSE_DECLASSIFICATION_QUORUM"}

def refusal_m12():
    return {"authority":"DENY","refusal":"REFUSE_DECLASSIFICATION_QUORUM","tag":"OLD_AUTHENTICATOR"}

# ---------- mutant runners ----------

def mutation_records():
    records=[]

    # M01
    success=(("E1","E2"),("E2","E3"))
    failed=("E1",)
    b=destroys_baseline(success,failed)
    m=destroys_m01(success,failed)
    records.append({
        "mutant_id":"M01","family":"cut_sets",
        "description":"failure destruction uses ANY minimal success coalition instead of ALL",
        "killed":b!=m,
        "witness":{"minimal_success":success,"failed":failed},
        "baseline":b,"mutant":m,
        "violated_invariant":"a failure set destroys capability iff every minimal success coalition is hit",
    })

    # M02
    elems=("E1","E2","E3")
    b=hitting_baseline(elems,success)
    m=hitting_m02(elems,success)
    records.append({
        "mutant_id":"M02","family":"cut_sets",
        "description":"hitting-set check uses subset instead of nonempty intersection",
        "killed":b!=m and ("E2",) in b and ("E2",) not in m,
        "witness":{"elements":elems,"minimal_success":success},
        "baseline":b,"mutant":m,
        "violated_invariant":"minimal cut must intersect every success coalition, not contain every coalition",
    })

    # M03
    before={"P0":"R0","P1":"R1","P2":"R2"}
    b=fuse_baseline(before,"R0","R1")
    m=fuse_m03(before,"R0","R1")
    rb=len(set(b.values())); rm=len(set(m.values()))
    records.append({
        "mutant_id":"M03","family":"control_domains",
        "description":"fusion accidentally creates a fresh independent root",
        "killed":rb==2 and rm!=2,
        "witness":{"before":before,"fuse":["R0","R1"]},
        "baseline":{"map":b,"root_count":rb},"mutant":{"map":m,"root_count":rm},
        "violated_invariant":"fusing two roots must reduce three distinct roots to two",
    })

    # M04
    fused={"P0":"R01","P1":"R01","P2":"R2"}
    b=root_threshold(fused,2); m=root_threshold_m04(fused,2)
    records.append({
        "mutant_id":"M04","family":"control_domains",
        "description":"post-fusion root threshold is spuriously incremented",
        "killed":b==1 and m!=1,
        "witness":{"rootmap":fused,"seat_threshold":2},
        "baseline":b,"mutant":m,
        "violated_invariant":"one fused root controlling two seats satisfies a two-seat threshold",
    })

    # M05
    obs={"A":"R1","B":None,"C":"R3"}
    b=certify_baseline(obs); m=certify_m05(obs)
    records.append({
        "mutant_id":"M05","family":"certification",
        "description":"missing root observations are treated as distinct roots",
        "killed":b!=m and m["status"]=="CERTIFIED_INDEPENDENT",
        "witness":{"observed":obs},
        "baseline":b,"mutant":m,
        "violated_invariant":"incomplete evidence must not certify independence",
    })

    # M06
    obs={"A":"RAB","B":"RAB","C":"RC"}
    b=certify_baseline(obs); m=certify_m06(obs)
    records.append({
        "mutant_id":"M06","family":"certification",
        "description":"completeness alone is mistaken for independence",
        "killed":b!=m and b["status"]=="SHARED_CONTROL_OBSERVED",
        "witness":{"observed":obs},
        "baseline":b,"mutant":m,
        "violated_invariant":"duplicate observed roots imply shared control, not independence",
    })

    # M07
    b=event_baseline("UNTRUSTED"); m=event_m07("UNTRUSTED")
    records.append({
        "mutant_id":"M07","family":"event_authority",
        "description":"untrusted event is allowed to revoke independence",
        "killed":b!=m and b["advertise"] and not m["advertise"],
        "witness":{"provenance":"UNTRUSTED"},
        "baseline":b,"mutant":m,
        "violated_invariant":"event presence does not grant revocation authority without trusted provenance",
    })

    # M08
    b=event_baseline("TRUSTED"); m=event_m08("TRUSTED")
    records.append({
        "mutant_id":"M08","family":"event_authority",
        "description":"trusted change event directly certifies shared topology",
        "killed":b["status"]!=m["status"] and m["status"]=="SHARED_CONTROL_OBSERVED",
        "witness":{"provenance":"TRUSTED","revalidated":False},
        "baseline":b,"mutant":m,
        "violated_invariant":"trusted change evidence revokes prospectively but does not certify the new topology",
    })

    # M09
    fine=("a","b","c","d")
    cmap={"a":0,"b":0,"c":1,"d":1}
    b=coarse_baseline(fine,cmap); m=coarse_m09(fine,cmap)
    records.append({
        "mutant_id":"M09","family":"observation",
        "description":"coarsening accidentally preserves the fine descriptor",
        "killed":len(set(b))==2 and len(set(m))==4,
        "witness":{"fine":fine,"map":cmap},
        "baseline":{"descriptor":b,"classes":len(set(b))},
        "mutant":{"descriptor":m,"classes":len(set(m))},
        "violated_invariant":"many-to-one coarsening must actually merge observer classes",
    })

    # M10
    targets=(0,0,1,1)
    coarse=(0,0,1,1)      # perfectly determines target
    extra=(0,1,0,1)       # alone is independent of target
    rb=refine_baseline(coarse,extra)
    rm=refine_m10(coarse,extra)
    hb=conditional_entropy(targets,rb)
    hm=conditional_entropy(targets,rm)
    hc=conditional_entropy(targets,coarse)
    records.append({
        "mutant_id":"M10","family":"information",
        "description":"refinement drops the coarse coordinate and keeps only the new field",
        "killed":hb<=hc+1e-12 and hm>hc+1e-12,
        "witness":{"targets":targets,"coarse":coarse,"extra":extra},
        "baseline":{"H_refined":hb,"H_coarse":hc},
        "mutant":{"H_mutant":hm},
        "violated_invariant":"a refinement must retain the coarse descriptor; added distinctions cannot increase residual entropy",
    })

    # M11
    controlled=2; threshold=3
    b=authorize_baseline(controlled,threshold); m=authorize_m11(controlled,threshold)
    records.append({
        "mutant_id":"M11","family":"quorum",
        "description":"authorization threshold is lowered by one",
        "killed":b is False and m is True,
        "witness":{"controlled_seats":controlled,"threshold":threshold},
        "baseline":b,"mutant":m,
        "violated_invariant":"strict 3-seat action must refuse a 2-seat coalition",
    })

    # M12
    b=refusal_baseline(); m=refusal_m12()
    records.append({
        "mutant_id":"M12","family":"output_schema",
        "description":"refusal leaks an old authenticator tag",
        "killed":not (FORBIDDEN & set(b)) and bool(FORBIDDEN & set(m)),
        "witness":{"forbidden_fields":sorted(FORBIDDEN)},
        "baseline":b,"mutant":m,
        "violated_invariant":"refused actions must emit no panel-dependent/protected evidence fields",
    })

    return records

def run_mutation_suite():
    records=mutation_records()
    killed=sum(bool(r["killed"]) for r in records)
    total=len(records)
    score=killed/total if total else 0.0
    family_counts=defaultdict(lambda:{"killed":0,"total":0})
    for r in records:
        family_counts[r["family"]]["total"]+=1
        family_counts[r["family"]]["killed"]+=int(r["killed"])
    body={
        "experiment":"NBG-M3",
        "version":VERSION,
        "mutants_total":total,
        "mutants_killed":killed,
        "mutants_survived":total-killed,
        "mutation_score":score,
        "family_summary":dict(sorted(family_counts.items())),
        "records":records,
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body

def main():
    result=run_mutation_suite()
    out=ROOT/"results"
    survivors=[r for r in result["records"] if not r["killed"]]
    (out/"survivors.json").write_text(json.dumps(survivors,indent=2,sort_keys=True)+"\n")
    (out/"kill_receipts.json").write_text(json.dumps(result["records"],indent=2,sort_keys=True)+"\n")

    checks=[
        {"name":"suite:12_mutants","pass":result["mutants_total"]==12},
        {"name":"suite:12_killed","pass":result["mutants_killed"]==12},
        {"name":"suite:0_survived","pass":result["mutants_survived"]==0},
        {"name":"suite:score_1","pass":abs(result["mutation_score"]-1.0)<1e-15},
        {"name":"suite:all_have_witness","pass":all(r["witness"] is not None for r in result["records"])},
        {"name":"suite:all_have_invariant","pass":all(bool(r["violated_invariant"]) for r in result["records"])},
    ]
    expected_ids=[f"M{i:02d}" for i in range(1,13)]
    checks.append({"name":"suite:ids_exact","pass":[r["mutant_id"] for r in result["records"]]==expected_ids})

    replay=run_mutation_suite()
    checks += [
        {"name":"replay:result_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:receipt_hash_exact","pass":result["receipt_hash"]==replay["receipt_hash"]},
    ]

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_M3" if passed==len(checks) else "FAIL_M3",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)

    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "mutants":f"{payload['mutants_killed']}/{payload['mutants_total']} killed",
        "mutation_score":payload["mutation_score"],
        "family_summary":payload["family_summary"],
        "survivors":payload["mutants_survived"],
        "receipt_hash":payload["receipt_hash"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))

    if payload["verdict"]!="PASS_M3":
        raise SystemExit(1)

if __name__=="__main__":
    main()
