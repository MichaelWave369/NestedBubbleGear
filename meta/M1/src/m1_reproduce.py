#!/usr/bin/env python3
from itertools import combinations, product
from pathlib import Path
import hashlib, json

VERSION="0.1.0"
ROOT=Path(__file__).resolve().parents[1]

def canonical(x):
    return json.dumps(x,sort_keys=True,separators=(",",":")).encode()

def powerset(items):
    items=tuple(items)
    return tuple(c for n in range(len(items)+1) for c in combinations(items,n))

def normalize(rows):
    return tuple(sorted((tuple(sorted(x)) for x in rows),key=lambda x:(len(x),x)))

def inclusion_minimal(rows):
    ss=[frozenset(x) for x in rows]
    return normalize([s for s in ss if not any(t<s for t in ss)])

def minimal_hitting_sets(elements,paths):
    hits=[]
    p=[set(x) for x in paths]
    for c in powerset(elements):
        sc=set(c)
        if all(sc & q for q in p):
            hits.append(c)
    return inclusion_minimal(hits)

def survives(paths,failed):
    f=set(failed)
    return any(not(set(c)&f) for c in paths)

def reliability(elements,paths,p):
    n=len(elements)
    total=0.0
    for failed in powerset(elements):
        prob=(p**len(failed))*((1-p)**(n-len(failed)))
        if survives(paths,failed):
            total+=prob
    return total

def reproduce_ah20(inp):
    out={}
    for name,t in inp["tasks"].items():
        out[name]={
            "capability_cuts":[list(x) for x in minimal_hitting_sets(inp["elements"],t["capability_minimal"])],
            "policy_cuts":[list(x) for x in minimal_hitting_sets(inp["elements"],t["policy_minimal"])],
            "capability_reliability_p0_1":reliability(inp["elements"],t["capability_minimal"],inp["p"]),
            "policy_reliability_p0_1":reliability(inp["elements"],t["policy_minimal"],inp["p"]),
        }
    return out

def atomset(grants,levels):
    out=set()
    for g,lvl in zip(grants,levels):
        if lvl>=1: out.add(g+":T")
        if lvl>=2: out.add(g+":F")
    return frozenset(out)

def reproduce_ah35(inp):
    profiles=[(lv,atomset(inp["grants"],lv)) for lv in product((0,1,2),repeat=5)]
    paths=[frozenset(p) for p in inp["minimal_dangerous"]]
    dangerous=[x for x in profiles if any(p.issubset(x[1]) for p in paths)]
    cuts=[]
    for c in powerset(inp["atoms"]):
        sc=set(c)
        if all(sc&p for p in paths):
            cuts.append(c)
    mincuts=inclusion_minimal(cuts)
    core=set(paths[0])
    for p in paths[1:]:
        core&=p
    m=min(map(len,mincuts))
    small=normalize([x for x in mincuts if len(x)==m])
    target={"H_L:T","U_L:T"}
    permitted=[lv for lv,s in profiles if not(target&s)]
    return {
        "valid_profiles":len(profiles),
        "dangerous_profiles":len(dangerous),
        "safe_profiles":len(profiles)-len(dangerous),
        "minimal_dangerous_count":len(paths),
        "mandatory_core":sorted(core),
        "minimal_cut_count":len(mincuts),
        "minimum_cut_size":m,
        "minimum_cuts":[list(x) for x in small],
        "target_cut_max_richness":max(sum(lv) for lv in permitted),
        "one_atom_cut_exists":any(len(x)==1 for x in mincuts),
    }

def controlled(rootcoal,actual,seats):
    rs=set(rootcoal)
    return {seats[p] for p,r in actual.items() if r in rs}

def root_threshold(actual,seats,need):
    roots=tuple(sorted(set(actual.values())))
    for k in range(len(roots)+1):
        for c in combinations(roots,k):
            if len(controlled(c,actual,seats))>=need:
                return k
    raise AssertionError

def root_reliability(actual,seats,need,p):
    roots=tuple(sorted(set(actual.values())))
    total=0.0
    for down in powerset(roots):
        up=[r for r in roots if r not in set(down)]
        prob=(p**len(down))*((1-p)**(len(roots)-len(down)))
        if len(controlled(up,actual,seats))>=need:
            total+=prob
    return total

def certify(observed):
    vals=list(observed.values())
    if any(x is None for x in vals): return "INDEPENDENCE_UNVERIFIED",False
    if len(set(vals))==len(vals): return "CERTIFIED_INDEPENDENT",True
    return "SHARED_CONTROL_OBSERVED",False

def reproduce_ah42(inp):
    out={}
    for sid,s in inp["scenarios"].items():
        status,adv=certify(s["observed"])
        a=s["actual"]
        out[sid]={
            "status":status,
            "advertise":adv,
            "root_count":len(set(a.values())),
            "verify_threshold":root_threshold(a,inp["seats"],2),
            "declassify_threshold":root_threshold(a,inp["seats"],3),
            "verify_reliability_p0_1":root_reliability(a,inp["seats"],2,inp["p"]),
            "declassify_reliability_p0_1":root_reliability(a,inp["seats"],3,inp["p"]),
        }
    return out

def reproduce_ah44(inp):
    out={}
    for name,cfg in inp["controls"].items():
        revoked=False
        false_count=0
        unnecessary=0
        rows=[]
        for t in range(inp["revalidate_epoch"]+1):
            shared=cfg["actual_changes"] and t>=inp["change_epoch"]
            if cfg["event_epoch"]==t and cfg["provenance"]=="TRUSTED":
                revoked=True
            if t==inp["revalidate_epoch"]:
                status="SHARED_CONTROL_OBSERVED" if shared else "CERTIFIED_FRESH"
                advertise=not shared
            elif revoked:
                status="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"
                advertise=False
            elif t<=inp["ttl"]:
                status="CERTIFIED_FRESH"
                advertise=True
            else:
                status="CERTIFICATE_STALE"
                advertise=False
            if shared and advertise: false_count+=1
            if (not shared) and (not advertise) and t<inp["revalidate_epoch"]: unnecessary+=1
            rows.append({"epoch":t,"status":status,"advertise":advertise})
        latency=None
        if cfg["actual_changes"]:
            first=next(r["epoch"] for r in rows if r["epoch"]>=inp["change_epoch"] and not r["advertise"])
            latency=first-inp["change_epoch"]
        out[name]={
            "false_advertisement_epochs":false_count,
            "unnecessary_refusal_epochs":unnecessary,
            "revocation_latency_epochs":latency,
            "rows":rows,
        }
    return out

def run_reproduction():
    inp=json.loads((ROOT/"inputs/flagships.json").read_text())
    r={"experiment":"NBG-M1","version":VERSION}
    r["AH20"]=reproduce_ah20(inp["AH20"])
    r["AH35"]=reproduce_ah35(inp["AH35"])
    r["AH42"]=reproduce_ah42(inp["AH42"])
    r["AH44"]=reproduce_ah44(inp["AH44"])
    r["receipt_hash"]=hashlib.sha256(canonical(r)).hexdigest()
    return r

def main():
    r=run_reproduction()
    checks=[]
    full=[["E2"],["E1","E3"]]
    for task in ("H2_FULL","GLOBAL_REAUTH","ROUTE_REAUTH"):
        checks += [
            {"name":f"AH20:{task}:capcuts","pass":r["AH20"][task]["capability_cuts"]==full},
            {"name":f"AH20:{task}:caprel","pass":abs(r["AH20"][task]["capability_reliability_p0_1"]-0.891)<1e-12},
            {"name":f"AH20:{task}:polrel","pass":abs(r["AH20"][task]["policy_reliability_p0_1"]-0.81)<1e-12},
        ]
    checks += [
        {"name":"AH20:H2:polcuts","pass":r["AH20"]["H2_FULL"]["policy_cuts"]==[["E1"],["E2"]]},
        {"name":"AH20:GLOBAL:polcuts","pass":r["AH20"]["GLOBAL_REAUTH"]["policy_cuts"]==[["E1"],["E2"]]},
        {"name":"AH20:ROUTE:polcuts","pass":r["AH20"]["ROUTE_REAUTH"]["policy_cuts"]==[["E2"],["E3"]]},
        {"name":"AH20:ALARM:capcuts","pass":r["AH20"]["C_CLASS_ALARM"]["capability_cuts"]==[["E1","E3"]]},
        {"name":"AH20:ALARM:polcuts","pass":r["AH20"]["C_CLASS_ALARM"]["policy_cuts"]==[["E3"]]},
        {"name":"AH20:ALARM:caprel","pass":abs(r["AH20"]["C_CLASS_ALARM"]["capability_reliability_p0_1"]-0.99)<1e-12},
        {"name":"AH20:ALARM:polrel","pass":abs(r["AH20"]["C_CLASS_ALARM"]["policy_reliability_p0_1"]-0.9)<1e-12},
    ]
    a=r["AH35"]
    checks += [
        {"name":"AH35:243","pass":a["valid_profiles"]==243},
        {"name":"AH35:137","pass":a["dangerous_profiles"]==137},
        {"name":"AH35:106","pass":a["safe_profiles"]==106},
        {"name":"AH35:paths10","pass":a["minimal_dangerous_count"]==10},
        {"name":"AH35:coreempty","pass":a["mandatory_core"]==[]},
        {"name":"AH35:cuts12","pass":a["minimal_cut_count"]==12},
        {"name":"AH35:min2","pass":a["minimum_cut_size"]==2},
        {"name":"AH35:unique","pass":a["minimum_cuts"]==[["H_L:T","U_L:T"]]},
        {"name":"AH35:rich6","pass":a["target_cut_max_richness"]==6},
        {"name":"AH35:no1","pass":not a["one_atom_cut_exists"]},
    ]
    expected={
        "S1_CERTIFIED_INDEPENDENT":("CERTIFIED_INDEPENDENT",True,2,3,0.972,0.729),
        "S2_SHARED_AB_OBSERVED":("SHARED_CONTROL_OBSERVED",False,1,2,0.9,0.81),
        "S3_INDEPENDENT_BUT_UNVERIFIED":("INDEPENDENCE_UNVERIFIED",False,2,3,0.972,0.729),
        "S4_HIDDEN_SHARED_UNVERIFIED":("INDEPENDENCE_UNVERIFIED",False,1,2,0.9,0.81),
    }
    for sid,e in expected.items():
        x=r["AH42"][sid]
        status,adv,v,d,rv,rd=e
        checks += [
            {"name":f"AH42:{sid}:status","pass":x["status"]==status},
            {"name":f"AH42:{sid}:adv","pass":x["advertise"]==adv},
            {"name":f"AH42:{sid}:threshold","pass":(x["verify_threshold"],x["declassify_threshold"])==(v,d)},
            {"name":f"AH42:{sid}:rel","pass":abs(x["verify_reliability_p0_1"]-rv)<1e-12 and abs(x["declassify_reliability_p0_1"]-rd)<1e-12},
        ]
    ef={"TTL_ONLY":1,"TRUSTED_IMMEDIATE":0,"TRUSTED_DELAYED_1":1,"MISSING_EVENT":1,"FALSE_POSITIVE_TRUSTED":0,"UNTRUSTED_IMMEDIATE":1}
    el={"TTL_ONLY":1,"TRUSTED_IMMEDIATE":0,"TRUSTED_DELAYED_1":1,"MISSING_EVENT":1,"UNTRUSTED_IMMEDIATE":1}
    for k,v in ef.items(): checks.append({"name":f"AH44:{k}:false","pass":r["AH44"][k]["false_advertisement_epochs"]==v})
    for k,v in el.items(): checks.append({"name":f"AH44:{k}:lat","pass":r["AH44"][k]["revocation_latency_epochs"]==v})
    checks += [
        {"name":"AH44:falsepositive2","pass":r["AH44"]["FALSE_POSITIVE_TRUSTED"]["unnecessary_refusal_epochs"]==2},
        {"name":"AH44:immediatepending","pass":r["AH44"]["TRUSTED_IMMEDIATE"]["rows"][2]["status"]=="INDEPENDENCE_REVOKED_PENDING_REVALIDATION"},
        {"name":"AH44:immediateshared","pass":r["AH44"]["TRUSTED_IMMEDIATE"]["rows"][4]["status"]=="SHARED_CONTROL_OBSERVED"},
        {"name":"AH44:untrustedfresh","pass":r["AH44"]["UNTRUSTED_IMMEDIATE"]["rows"][2]["status"]=="CERTIFIED_FRESH"},
    ]
    replay=run_reproduction()
    checks += [
        {"name":"M1:replay","pass":canonical(r)==canonical(replay)},
        {"name":"M1:receipt","pass":r["receipt_hash"]==replay["receipt_hash"]},
    ]
    passed=sum(x["pass"] for x in checks)
    payload={**r,"verdict":"PASS_M1" if passed==len(checks) else "FAIL_M1","checks_passed":passed,"checks_total":len(checks),"checks":checks}
    data=(json.dumps(payload,indent=2,sort_keys=True)+"\n").encode()
    (ROOT/"results/result.json").write_bytes(data)
    print(json.dumps({"verdict":payload["verdict"],"checks":f"{passed}/{len(checks)}","receipt_hash":r["receipt_hash"],"result_sha256":hashlib.sha256(data).hexdigest()},indent=2))
    if payload["verdict"]!="PASS_M1":
        print(json.dumps([x for x in checks if not x["pass"]],indent=2))
        raise SystemExit(1)

if __name__=="__main__":
    main()
