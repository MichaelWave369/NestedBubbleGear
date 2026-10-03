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
SCENARIOS=(0.05,0.10,0.15,0.20,0.25,0.30)
H2_C=((2,-1),(1,0))

CONTEXTS={
 'H2_FULL':{'target':'H2','local':None,'baseline_minimal':(('E1','E2'),),'denies':(), 'weights':{('E2','E3'):3}, 'expected_robust':((0,1,0.49,0.147),(3,0,0.637,0.0))},
 'GLOBAL_REAUTH':{'target':'G','local':'P2','baseline_minimal':(('E1','E2'),),'denies':(), 'weights':{('E2','E3'):5}, 'expected_robust':((0,1,0.49,0.147),(5,0,0.637,0.0))},
 'ROUTE_REAUTH':{'target':'P2','local':'H3','baseline_minimal':(('E2','E3'),),'denies':(), 'weights':{('E1','E2'):2}, 'expected_robust':((0,1,0.49,0.147),(2,0,0.637,0.0))},
 'ALARM_SOFT_COST':{'target':'CFLAG','local':None,'baseline_minimal':(('E3',),),'denies':(), 'weights':{('E1','E2'):1,('E1',):4}, 'expected_robust':((0,1,0.7,0.21),(1,0,0.847,0.063),(5,0,0.91,0.0))},
 'ALARM_HARD_DENY':{'target':'CFLAG','local':None,'baseline_minimal':(('E3',),),'denies':(('E1',),), 'weights':{('E1','E2'):1,('E1',):4}, 'expected_robust':((0,1,0.7,0.21),(1,0,0.847,0.063))},
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
            coeff=reliability_coeffs(fam); cap_coeff=reliability_coeffs(cap)
            curve=tuple(peval(coeff,p) for p in SCENARIOS)
            cap_curve=tuple(peval(cap_coeff,p) for p in SCENARIOS)
            regrets=tuple(a-b for a,b in zip(cap_curve,curve))
            out.append({
                'family':fam,'added':added,'cost':cost,'induced_singletons':len(induced),
                'reliability_p01':peval(coeff,0.1),
                'curve':curve,
                'worst_reliability':min(curve),
                'max_regret':max(regrets),
            })
    return cap,base,tuple(out)

def ah22_dominates(a,b):
    weak=a['cost']<=b['cost'] and a['induced_singletons']<=b['induced_singletons'] and a['reliability_p01']>=b['reliability_p01']-1e-12
    strict=a['cost']<b['cost'] or a['induced_singletons']<b['induced_singletons'] or a['reliability_p01']>b['reliability_p01']+1e-12
    return weak and strict

def robust_dominates(a,b):
    weak=(a['cost']<=b['cost'] and a['induced_singletons']<=b['induced_singletons']
          and a['worst_reliability']>=b['worst_reliability']-1e-12
          and a['max_regret']<=b['max_regret']+1e-12)
    strict=(a['cost']<b['cost'] or a['induced_singletons']<b['induced_singletons']
            or a['worst_reliability']>b['worst_reliability']+1e-12
            or a['max_regret']<b['max_regret']-1e-12)
    return weak and strict

def frontier(cands,dom):
    fr=[x for x in cands if not any(dom(y,x) for y in cands if y is not x)]
    return tuple(sorted(fr,key=lambda x:(x['cost'],x['induced_singletons'],-x['worst_reliability'],x['max_regret'],x['family'])))

def robust_point(x):
    return (x['cost'],x['induced_singletons'],round(x['worst_reliability'],12),round(x['max_regret'],12))

def min_cost(fr,key,threshold,at_least=True):
    if at_least:
        q=[x['cost'] for x in fr if x[key]+1e-12>=threshold]
    else:
        q=[x['cost'] for x in fr if x[key]<=threshold+1e-12]
    return min(q) if q else None

def main():
    cases=[make_case(un,U,vn,V,k) for un,U in BASE.items() for vn,V in BASE.items() for k in K_VALUES]
    checks=[
        {'name':'suite:48_histories','pass':len(cases)==48},
        {'name':'suite:8_coalitions','pass':len(COALITIONS)==8},
        {'name':'suite:6_scenarios','pass':SCENARIOS==(0.05,0.10,0.15,0.20,0.25,0.30)},
    ]
    contexts={}
    for name,cfg in CONTEXTS.items():
        cap,base,cands=legal_candidates(cases,cfg)
        old=frontier(cands,ah22_dominates)
        rob=frontier(cands,robust_dominates)
        pts=tuple(robust_point(x) for x in rob)
        checks += [
            {'name':f'{name}:robust_frontier_exact','pass':pts==cfg['expected_robust']},
            {'name':f'{name}:frontier_membership_stable','pass':tuple(x['family'] for x in old)==tuple(x['family'] for x in rob)},
            {'name':f'{name}:all_curves_nonincreasing','pass':all(all(x['curve'][i]>=x['curve'][i+1]-1e-12 for i in range(len(SCENARIOS)-1)) for x in cands)},
            {'name':f'{name}:worst_at_p030','pass':all(abs(x['worst_reliability']-x['curve'][-1])<1e-12 for x in cands)},
            {'name':f'{name}:frontier_nondominated','pass':all(not any(robust_dominates(y,x) for y in cands if y is not x) for x in rob)},
            {'name':f'{name}:nonfrontier_dominated','pass':all(x in rob or any(robust_dominates(y,x) for y in cands if y is not x) for x in cands)},
        ]
        contexts[name]={
            'candidate_count':len(cands),
            'ah22_frontier_families':[[list(c) for c in x['family']] for x in old],
            'robust_frontier':[{
                'cost':x['cost'],
                'induced_singleton_cuts':x['induced_singletons'],
                'worst_reliability':x['worst_reliability'],
                'max_regret':x['max_regret'],
                'reliability_curve':dict(zip((str(p) for p in SCENARIOS),x['curve'])),
                'added':[list(c) for c in x['added']],
                'family':[list(c) for c in x['family']],
            } for x in rob],
        }

    soft=frontier(legal_candidates(cases,CONTEXTS['ALARM_SOFT_COST'])[2],robust_dominates)
    hard=frontier(legal_candidates(cases,CONTEXTS['ALARM_HARD_DENY'])[2],robust_dominates)
    thresholds={
        'soft_min_cost_worst_R_ge_0_84':min_cost(soft,'worst_reliability',0.84,True),
        'soft_min_cost_worst_R_ge_0_90':min_cost(soft,'worst_reliability',0.90,True),
        'soft_min_cost_max_regret_le_0_07':min_cost(soft,'max_regret',0.07,False),
        'soft_min_cost_max_regret_le_0_01':min_cost(soft,'max_regret',0.01,False),
        'hard_min_cost_worst_R_ge_0_84':min_cost(hard,'worst_reliability',0.84,True),
        'hard_min_cost_worst_R_ge_0_90':min_cost(hard,'worst_reliability',0.90,True),
        'hard_min_cost_max_regret_le_0_07':min_cost(hard,'max_regret',0.07,False),
        'hard_min_cost_max_regret_le_0_01':min_cost(hard,'max_regret',0.01,False),
    }
    checks += [
        {'name':'threshold:soft_R084_cost1','pass':thresholds['soft_min_cost_worst_R_ge_0_84']==1},
        {'name':'threshold:soft_R090_cost5','pass':thresholds['soft_min_cost_worst_R_ge_0_90']==5},
        {'name':'threshold:soft_regret007_cost1','pass':thresholds['soft_min_cost_max_regret_le_0_07']==1},
        {'name':'threshold:soft_regret001_cost5','pass':thresholds['soft_min_cost_max_regret_le_0_01']==5},
        {'name':'threshold:hard_R084_cost1','pass':thresholds['hard_min_cost_worst_R_ge_0_84']==1},
        {'name':'threshold:hard_R090_infeasible','pass':thresholds['hard_min_cost_worst_R_ge_0_90'] is None},
        {'name':'threshold:hard_regret007_cost1','pass':thresholds['hard_min_cost_max_regret_le_0_07']==1},
        {'name':'threshold:hard_regret001_infeasible','pass':thresholds['hard_min_cost_max_regret_le_0_01'] is None},
    ]

    passed=sum(c['pass'] for c in checks)
    result={
        'experiment':'NBG-AH23','version':'0.1.0',
        'verdict':'PASS_AH23' if passed==len(checks) else 'FAIL_AH23',
        'checks_passed':passed,'checks_total':len(checks),
        'histories':len(cases),'scenarios':list(SCENARIOS),
        'contexts':contexts,'thresholds':thresholds,'checks':checks,
    }
    out=Path(__file__).resolve().parents[1]/'results'
    payload=(json.dumps(result,indent=2,sort_keys=True)+'\n').encode()
    (out/'result.json').write_bytes(payload)
    print(json.dumps({
        'verdict':result['verdict'],
        'checks':f"{passed}/{len(checks)}",
        'scenarios':list(SCENARIOS),
        'contexts':{k:[(x['cost'],x['induced_singleton_cuts'],x['worst_reliability'],x['max_regret']) for x in v['robust_frontier']] for k,v in contexts.items()},
        'thresholds':thresholds,
        'result_sha256':hashlib.sha256(payload).hexdigest(),
    },indent=2))
    if result['verdict']!='PASS_AH23': raise SystemExit(1)
if __name__=='__main__': main()
