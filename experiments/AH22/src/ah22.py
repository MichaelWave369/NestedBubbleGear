#!/usr/bin/env python3
from __future__ import annotations
from collections import defaultdict
from itertools import combinations
from math import comb
from pathlib import Path
import hashlib, json

Matrix=tuple[tuple[int,int],tuple[int,int]]
I=((1,0),(0,1)); A=((1,1),(0,1)); B=((1,0),(1,1)); S=((0,-1),(1,0))

def mul(X,Y):
    return ((X[0][0]*Y[0][0]+X[0][1]*Y[1][0],X[0][0]*Y[0][1]+X[0][1]*Y[1][1]),(X[1][0]*Y[0][0]+X[1][1]*Y[1][0],X[1][0]*Y[0][1]+X[1][1]*Y[1][1]))
def det(X): return X[0][0]*X[1][1]-X[0][1]*X[1][0]
def inv(X):
    if det(X)!=1: raise ValueError('determinant must be +1')
    return ((X[1][1],-X[0][1]),(-X[1][0],X[0][0]))
def power(X,n):
    if n<0: return power(inv(X),-n)
    out=I
    for _ in range(n): out=mul(out,X)
    return out
def conjugate(T,H): return mul(mul(T,H),inv(T))
def entropy(vals):
    from collections import Counter
    import math
    c=Counter(vals); n=len(vals)
    return -sum((v/n)*math.log2(v/n) for v in c.values())
def conditional_entropy(targets,descriptors):
    groups=defaultdict(list)
    for t,d in zip(targets,descriptors): groups[d].append(t)
    n=len(targets)
    return sum((len(g)/n)*entropy(g) for g in groups.values())

C=mul(A,B); BASE={'I':I,'A':A,'B':B,'S':S}; K_VALUES=(-1,0,1)
SHARES=('E1','E2','E3')
COALITIONS=tuple(c for r in range(4) for c in combinations(SHARES,r))
H2_C=((2,-1),(1,0))

CONTEXTS={
 'H2_FULL':{'target':'H2','local':None,'baseline_minimal':(('E1','E2'),),'denies':(), 'weights':{('E2','E3'):3}, 'expected_frontier':((0,1,0.81),(3,0,0.891))},
 'GLOBAL_REAUTH':{'target':'G','local':'P2','baseline_minimal':(('E1','E2'),),'denies':(), 'weights':{('E2','E3'):5}, 'expected_frontier':((0,1,0.81),(5,0,0.891))},
 'ROUTE_REAUTH':{'target':'P2','local':'H3','baseline_minimal':(('E2','E3'),),'denies':(), 'weights':{('E1','E2'):2}, 'expected_frontier':((0,1,0.81),(2,0,0.891))},
 'ALARM_SOFT_COST':{'target':'CFLAG','local':None,'baseline_minimal':(('E3',),),'denies':(), 'weights':{('E1','E2'):1,('E1',):4}, 'expected_frontier':((0,1,0.9),(1,0,0.981),(5,0,0.99))},
 'ALARM_HARD_DENY':{'target':'CFLAG','local':None,'baseline_minimal':(('E3',),),'denies':(('E1',),), 'weights':{('E1','E2'):1,('E1',):4}, 'expected_frontier':((0,1,0.9),(1,0,0.981))},
}

def make_case(un,U,vn,V,k):
    T1=mul(U,power(B,k)); T2=mul(power(B,-k),V); P2=mul(T1,T2)
    H2=conjugate(T1,B); H3=conjugate(P2,C); R=mul(H3,H2); G=mul(R,A)
    return {'H2':H2,'H3':H3,'P2':P2,'G':G,'CFLAG':int(H2==H2_C),'E1':H2[0][0],'E2':H2[1][0],'E3':H2[1][1]}
def vals(cases,key): return [c[key] for c in cases]
def descriptor(cases,local,coal):
    out=[]
    for c in cases:
        row=[]
        if local is not None: row.append(c[local])
        row += [c[s] for s in coal]
        out.append(tuple(row))
    return out
def capability(cases,cfg):
    t=vals(cases,cfg['target'])
    return tuple(c for c in COALITIONS if conditional_entropy(t,descriptor(cases,cfg['local'],c))<1e-12)
def upward_closure(mins): return tuple(c for c in COALITIONS if any(set(m)<=set(c) for m in mins))
def upward(fam):
    F=set(fam)
    return all(not(set(c)<=set(d)) or d in F for c in fam for d in COALITIONS)
def minimal_success(fam):
    F=set(fam); return tuple(c for c in fam if not any(set(d)<set(c) for d in F))
def survives(fail,fam): return any(set(fail).isdisjoint(c) for c in fam)
def minimal_cuts(fam):
    fails=tuple(F for F in COALITIONS if not survives(F,fam))
    return tuple(F for F in fails if not any(set(G)<set(F) for G in fails))
def singletons(fam): return tuple(c for c in minimal_cuts(fam) if len(c)==1)
def reliability_coeffs(fam):
    coeff=[0,0,0,0]
    for F in COALITIONS:
        if survives(F,fam):
            k=len(F); alive=3-k
            for j in range(alive+1): coeff[k+j]+=comb(alive,j)*((-1)**j)
    return tuple(coeff)
def peval(coeff,p): return sum(c*p**i for i,c in enumerate(coeff))

def legal_candidates(cases,cfg):
    cap=capability(cases,cfg); base=upward_closure(cfg['baseline_minimal']); optional=tuple(c for c in cap if c not in base)
    out=[]
    for r in range(len(optional)+1):
        for extra in combinations(optional,r):
            fam=tuple(c for c in COALITIONS if c in base or c in extra)
            if not set(fam)<=set(cap) or not upward(fam): continue
            if any(d in fam for d in cfg['denies']): continue
            added=tuple(c for c in fam if c not in base)
            cost=sum(cfg['weights'].get(c,0) for c in added)
            cap_single=set(singletons(cap)); induced=tuple(c for c in singletons(fam) if c not in cap_single)
            out.append({'family':fam,'added':added,'cost':cost,'induced_singletons':len(induced),'reliability':peval(reliability_coeffs(fam),0.1)})
    return cap,base,tuple(out)

def dominates(a,b):
    weak=a['cost']<=b['cost'] and a['induced_singletons']<=b['induced_singletons'] and a['reliability']>=b['reliability']-1e-12
    strict=a['cost']<b['cost'] or a['induced_singletons']<b['induced_singletons'] or a['reliability']>b['reliability']+1e-12
    return weak and strict

def frontier(cands):
    fr=[x for x in cands if not any(dominates(y,x) for y in cands if y is not x)]
    return tuple(sorted(fr,key=lambda x:(x['cost'],x['induced_singletons'],-x['reliability'],x['family'])))
def point(x): return (x['cost'],x['induced_singletons'],round(x['reliability'],12))
def min_cost_for_reliability(fr,threshold):
    q=[x['cost'] for x in fr if x['reliability']+1e-12>=threshold]
    return min(q) if q else None

def main():
    cases=[make_case(un,U,vn,V,k) for un,U in BASE.items() for vn,V in BASE.items() for k in K_VALUES]
    checks=[{'name':'suite:48_histories','pass':len(cases)==48},{'name':'suite:8_coalitions','pass':len(COALITIONS)==8}]
    results={}
    for name,cfg in CONTEXTS.items():
        cap,base,cands=legal_candidates(cases,cfg); fr=frontier(cands); pts=tuple(point(x) for x in fr)
        checks += [
          {'name':f'{name}:frontier_exact','pass':pts==cfg['expected_frontier']},
          {'name':f'{name}:all_frontier_nondominated','pass':all(not any(dominates(y,x) for y in cands if y is not x) for x in fr)},
          {'name':f'{name}:every_nonfrontier_dominated','pass':all(x in fr or any(dominates(y,x) for y in cands if y is not x) for x in cands)},
          {'name':f'{name}:baseline_present','pass':any(x['cost']==0 for x in cands)},
          {'name':f'{name}:candidate_upward_closed','pass':all(upward(x['family']) for x in cands)},
          {'name':f'{name}:candidate_within_capability','pass':all(set(x['family'])<=set(cap) for x in cands)},
          {'name':f'{name}:denies_preserved','pass':all(all(d not in x['family'] for d in cfg['denies']) for x in cands)},
        ]
        results[name]={
          'legal_candidate_count':len(cands),
          'capability_family':[list(c) for c in cap],
          'baseline_family':[list(c) for c in base],
          'hard_denies':[list(c) for c in cfg['denies']],
          'frontier':[{'added':[list(c) for c in x['added']],'cost':x['cost'],'induced_singleton_cuts':x['induced_singletons'],'reliability_p01':x['reliability'],'family':[list(c) for c in x['family']]} for x in fr],
        }
    soft=frontier(legal_candidates(cases,CONTEXTS['ALARM_SOFT_COST'])[2]); hard=frontier(legal_candidates(cases,CONTEXTS['ALARM_HARD_DENY'])[2])
    checks += [
      {'name':'alarm:soft_min_cost_R098_1','pass':min_cost_for_reliability(soft,0.98)==1},
      {'name':'alarm:soft_min_cost_R099_5','pass':min_cost_for_reliability(soft,0.99)==5},
      {'name':'alarm:hard_min_cost_R098_1','pass':min_cost_for_reliability(hard,0.98)==1},
      {'name':'alarm:hard_R099_infeasible','pass':min_cost_for_reliability(hard,0.99) is None},
      {'name':'alarm:hard_frontier_smaller','pass':len(hard)<len(soft)},
      {'name':'alarm:soft_contains_full_capability','pass':any(abs(x['reliability']-0.99)<1e-12 for x in soft)},
      {'name':'alarm:hard_excludes_full_capability','pass':all(x['reliability']<0.99-1e-12 for x in hard)},
    ]
    passed=sum(c['pass'] for c in checks)
    result={'experiment':'NBG-AH22','version':'0.1.0','verdict':'PASS_AH22' if passed==len(checks) else 'FAIL_AH22','checks_passed':passed,'checks_total':len(checks),'histories':len(cases),'contexts':results,'alarm_threshold_queries':{'soft_R098':min_cost_for_reliability(soft,0.98),'soft_R099':min_cost_for_reliability(soft,0.99),'hard_R098':min_cost_for_reliability(hard,0.98),'hard_R099':min_cost_for_reliability(hard,0.99)},'checks':checks}
    out=Path(__file__).resolve().parents[1]/'results'; out.mkdir(parents=True,exist_ok=True)
    payload=(json.dumps(result,indent=2,sort_keys=True)+'\n').encode(); (out/'result.json').write_bytes(payload)
    print(json.dumps({'verdict':result['verdict'],'checks':f"{passed}/{len(checks)}",'contexts':{k:{'candidates':v['legal_candidate_count'],'frontier':[(x['cost'],x['induced_singleton_cuts'],x['reliability_p01']) for x in v['frontier']]} for k,v in results.items()},'thresholds':result['alarm_threshold_queries'],'result_sha256':hashlib.sha256(payload).hexdigest()},indent=2))
    if result['verdict']!='PASS_AH22': raise SystemExit(1)
if __name__=='__main__': main()
