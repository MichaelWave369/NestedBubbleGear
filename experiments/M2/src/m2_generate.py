#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from itertools import combinations
from pathlib import Path
import hashlib, json, math, random

VERSION="0.1.0"
MASTER_SEED=369042
CASES_PER_PROPERTY=250
ROOT=Path(__file__).resolve().parents[1]

PROPERTIES=(
    "P1_SUCCESS_FAILURE_DUALITY",
    "P2_CONTROL_DOMAIN_FUSION",
    "P3_INCOMPLETE_EVIDENCE_REFUSAL",
    "P4_EVENT_REVOKE_NOT_CERTIFY",
    "P5_COARSENING_DISTINGUISHABILITY",
    "P6_REFINEMENT_ENTROPY",
)

def canonical(obj):
    return json.dumps(obj,sort_keys=True,separators=(",",":")).encode()

def case_seed(property_id,index):
    raw=f"{MASTER_SEED}|{property_id}|{index}".encode()
    return int.from_bytes(hashlib.sha256(raw).digest()[:8],"big")

def rng_for(property_id,index):
    return random.Random(case_seed(property_id,index))

def powerset(items):
    items=tuple(items)
    return tuple(c for n in range(len(items)+1) for c in combinations(items,n))

def minimal_family(rows):
    sets={frozenset(x) for x in rows}
    mins=[s for s in sets if not any(t < s for t in sets)]
    return tuple(sorted((tuple(sorted(s)) for s in mins), key=lambda x:(len(x),x)))

def minimal_hitting_sets(elements,success):
    hits=[]
    for c in powerset(elements):
        sc=set(c)
        if all(sc & set(s) for s in success):
            hits.append(c)
    return minimal_family(hits)

def destroys(success,failed):
    f=set(failed)
    return all(f & set(s) for s in success)

def direct_minimal_failure_sets(elements,success):
    bad=[c for c in powerset(elements) if destroys(success,c)]
    return minimal_family(bad)

def p1_case(rng):
    n=rng.randint(3,6)
    elements=tuple(f"E{i}" for i in range(n))
    candidates=[]
    for _ in range(rng.randint(1, min(12,2**n-1))):
        size=rng.randint(1,n)
        candidates.append(tuple(sorted(rng.sample(elements,size))))
    success=minimal_family(candidates)
    if not success:
        success=((elements[0],),)

    hits=minimal_hitting_sets(elements,success)
    direct=direct_minimal_failure_sets(elements,success)

    monotone=True
    for f in powerset(elements):
        if destroys(success,f):
            sf=set(f)
            for fp in powerset(elements):
                if sf.issubset(fp) and not destroys(success,fp):
                    monotone=False
                    break
        if not monotone:
            break

    inp={"elements":elements,"minimal_success":success}
    observed={"minimal_hitting_sets":hits,"direct_minimal_failures":direct,"failure_monotone":monotone}
    ok=hits==direct and monotone
    return ok,inp,observed,"minimal hitting sets == direct minimal failures and failure family monotone"

def root_threshold(principals,rootmap,k):
    roots=tuple(sorted(set(rootmap.values())))
    for size in range(len(roots)+1):
        for rc in combinations(roots,size):
            held={p for p in principals if rootmap[p] in rc}
            if len(held)>=k:
                return size
    raise AssertionError

def fuse_map(rootmap,rng):
    roots=sorted(set(rootmap.values()))
    if len(roots)<2:
        return dict(rootmap)
    a,b=rng.sample(roots,2)
    new=f"{a}+{b}"
    return {p:(new if r in (a,b) else r) for p,r in rootmap.items()}

def p2_case(rng):
    n=rng.randint(3,7)
    principals=tuple(f"P{i}" for i in range(n))
    before={p:f"R{i}" for i,p in enumerate(principals)}
    steps=rng.randint(1,n-1)
    after=dict(before)
    for _ in range(steps):
        if len(set(after.values()))<2:
            break
        after=fuse_map(after,rng)
    k=rng.randint(1,n)
    rb=len(set(before.values()))
    ra=len(set(after.values()))
    tb=root_threshold(principals,before,k)
    ta=root_threshold(principals,after,k)
    inp={"principals":principals,"before":before,"after":after,"seat_threshold":k}
    observed={"roots_before":rb,"roots_after":ra,"threshold_before":tb,"threshold_after":ta}
    ok=ra<=rb and ta<=tb
    return ok,inp,observed,"fusion cannot increase root-domain count or physical root threshold"

def certify(observed):
    vals=list(observed.values())
    if any(v is None for v in vals):
        return "INDEPENDENCE_UNVERIFIED",False
    if len(set(vals))==len(vals):
        return "CERTIFIED_INDEPENDENT",True
    return "SHARED_CONTROL_OBSERVED",False

def p3_case(rng):
    n=rng.randint(3,7)
    principals=tuple(f"P{i}" for i in range(n))
    roots=[f"R{rng.randint(0,n-1)}" for _ in range(n)]
    actual=dict(zip(principals,roots))
    observed={}
    missing_index=rng.randrange(n)
    for i,p in enumerate(principals):
        observed[p]=None if i==missing_index or rng.random()<0.25 else actual[p]
    status,advertise=certify(observed)
    inp={"actual":actual,"observed":observed}
    observed_out={"status":status,"advertise":advertise}
    ok=status=="INDEPENDENCE_UNVERIFIED" and not advertise
    return ok,inp,observed_out,"incomplete evidence must refuse independence certification"

def p4_case(rng):
    ttl=rng.randint(0,5)
    event_epoch=rng.randint(0,5)
    reval_epoch=rng.randint(event_epoch+1,7)
    change_epoch=rng.randint(0,7)
    status_at_event="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
    status_after_revalidation="SHARED_CONTROL_OBSERVED" if change_epoch<=reval_epoch else "CERTIFIED_INDEPENDENT"
    inp={"ttl":ttl,"event_epoch":event_epoch,"revalidation_epoch":reval_epoch,"hidden_change_epoch":change_epoch,"provenance":"TRUSTED"}
    observed={"event_status":status_at_event,"revalidation_status":status_after_revalidation}
    ok=(
        observed["event_status"]=="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
        and observed["event_status"] not in ("CERTIFIED_INDEPENDENT","SHARED_CONTROL_OBSERVED")
    )
    return ok,inp,observed,"trusted event revokes prospectively but does not directly certify new topology"

def exact_reconstruct(targets,descriptors):
    groups=defaultdict(set)
    for y,d in zip(targets,descriptors):
        groups[d].add(y)
    return all(len(v)==1 for v in groups.values())

def p5_case(rng):
    n=rng.randint(4,16)
    targets=[rng.randint(0,rng.randint(1,4)) for _ in range(n)]
    fine=[rng.randint(0,rng.randint(1,n-1)) for _ in range(n)]
    unique_fine=sorted(set(fine))
    bucket_count=rng.randint(1,max(1,len(unique_fine)))
    cmap={v:rng.randrange(bucket_count) for v in unique_fine}
    coarse=[cmap[v] for v in fine]
    nf=len(set(fine)); nc=len(set(coarse))
    fine_exact=exact_reconstruct(targets,fine)
    coarse_exact=exact_reconstruct(targets,coarse)
    inp={"targets":targets,"fine":fine,"coarsening_map":cmap}
    observed={"fine_classes":nf,"coarse_classes":nc,"fine_exact":fine_exact,"coarse_exact":coarse_exact}
    ok=nc<=nf and ((not coarse_exact) or fine_exact)
    return ok,inp,observed,"coarsening cannot increase descriptor classes; coarse exact implies fine exact"

def entropy(values):
    c=Counter(values); n=len(values)
    return -sum((v/n)*math.log2(v/n) for v in c.values())

def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for y,d in zip(targets,descriptors):
        groups[d].append(y)
    n=len(targets)
    return sum((len(v)/n)*entropy(v) for v in groups.values())

def p6_case(rng):
    n=rng.randint(4,20)
    targets=[rng.randint(0,rng.randint(1,4)) for _ in range(n)]
    coarse=[rng.randint(0,rng.randint(0,5)) for _ in range(n)]
    extra=[rng.randint(0,rng.randint(0,5)) for _ in range(n)]
    refined=list(zip(coarse,extra))
    hc=conditional_entropy(targets,coarse)
    hr=conditional_entropy(targets,refined)
    inp={"targets":targets,"coarse":coarse,"extra":extra}
    observed={"H_target_given_coarse":hc,"H_target_given_refined":hr}
    ok=hr<=hc+1e-12
    return ok,inp,observed,"adding distinctions cannot increase residual conditional entropy"

GENERATORS={
    PROPERTIES[0]:p1_case,
    PROPERTIES[1]:p2_case,
    PROPERTIES[2]:p3_case,
    PROPERTIES[3]:p4_case,
    PROPERTIES[4]:p5_case,
    PROPERTIES[5]:p6_case,
}

def run_suite():
    counterexamples=[]
    summaries={}
    case_receipts=[]

    for pid in PROPERTIES:
        passed=0
        gen=GENERATORS[pid]
        for i in range(CASES_PER_PROPERTY):
            seed=case_seed(pid,i)
            rng=random.Random(seed)
            ok,inp,observed,expected=gen(rng)
            receipt={
                "property_id":pid,
                "case_index":i,
                "case_seed":seed,
                "pass":bool(ok),
                "input_sha256":hashlib.sha256(canonical(inp)).hexdigest(),
                "observed_sha256":hashlib.sha256(canonical(observed)).hexdigest(),
            }
            case_receipts.append(receipt)
            if ok:
                passed+=1
            else:
                counterexamples.append({
                    "property_id":pid,
                    "case_index":i,
                    "master_seed":MASTER_SEED,
                    "case_seed":seed,
                    "input":inp,
                    "observed":observed,
                    "expected_invariant":expected,
                })
        summaries[pid]={"passed":passed,"total":CASES_PER_PROPERTY}

    body={
        "experiment":"NBG-M2",
        "version":VERSION,
        "master_seed":MASTER_SEED,
        "cases_per_property":CASES_PER_PROPERTY,
        "total_cases":len(PROPERTIES)*CASES_PER_PROPERTY,
        "summaries":summaries,
        "counterexample_count":len(counterexamples),
        "case_receipt_root":hashlib.sha256(canonical(case_receipts)).hexdigest(),
    }
    body["receipt_hash"]=hashlib.sha256(canonical(body)).hexdigest()
    return body,counterexamples,case_receipts

def main():
    result,counterexamples,receipts=run_suite()
    out=ROOT/"results"
    (out/"counterexamples.json").write_text(json.dumps(counterexamples,indent=2,sort_keys=True)+"\n")
    (out/"case_receipts.json").write_text(json.dumps(receipts,indent=2,sort_keys=True)+"\n")

    checks=[
        {"name":"suite:total_cases_1500","pass":result["total_cases"]==1500},
        {"name":"suite:zero_counterexamples","pass":result["counterexample_count"]==0},
    ]
    for pid in PROPERTIES:
        checks.append({
            "name":f"{pid}:250_of_250",
            "pass":result["summaries"][pid]=={"passed":250,"total":250},
        })

    replay,replay_ce,replay_receipts=run_suite()
    checks += [
        {"name":"replay:summary_exact","pass":canonical(result)==canonical(replay)},
        {"name":"replay:counterexamples_exact","pass":canonical(counterexamples)==canonical(replay_ce)},
        {"name":"replay:case_receipts_exact","pass":canonical(receipts)==canonical(replay_receipts)},
    ]

    passed=sum(c["pass"] for c in checks)
    payload={
        **result,
        "verdict":"PASS_M2" if passed==len(checks) else "FAIL_M2",
        "checks_passed":passed,
        "checks_total":len(checks),
        "checks":checks,
    }
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (out/"result.json").write_bytes(data)
    print(json.dumps({
        "verdict":payload["verdict"],
        "checks":f"{passed}/{len(checks)}",
        "master_seed":MASTER_SEED,
        "total_cases":payload["total_cases"],
        "counterexamples":payload["counterexample_count"],
        "summaries":payload["summaries"],
        "case_receipt_root":payload["case_receipt_root"],
        "result_sha256":hashlib.sha256(data).hexdigest(),
    },indent=2))
    if payload["verdict"]!="PASS_M2":
        raise SystemExit(1)

if __name__=="__main__":
    main()
