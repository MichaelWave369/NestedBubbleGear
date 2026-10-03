#!/usr/bin/env python3
from __future__ import annotations
from collections import Counter, defaultdict
from itertools import combinations
from math import comb
from pathlib import Path
import hashlib, json, math

Matrix = tuple[tuple[int,int],tuple[int,int]]

I: Matrix = ((1,0),(0,1))
A: Matrix = ((1,1),(0,1))
B: Matrix = ((1,0),(1,1))
S: Matrix = ((0,-1),(1,0))

def mul(X: Matrix, Y: Matrix) -> Matrix:
    return (
        (X[0][0]*Y[0][0] + X[0][1]*Y[1][0],
         X[0][0]*Y[0][1] + X[0][1]*Y[1][1]),
        (X[1][0]*Y[0][0] + X[1][1]*Y[1][0],
         X[1][0]*Y[0][1] + X[1][1]*Y[1][1]),
    )

def det(X: Matrix) -> int:
    return X[0][0]*X[1][1] - X[0][1]*X[1][0]

def inv(X: Matrix) -> Matrix:
    if det(X) != 1:
        raise ValueError('determinant must be +1')
    return ((X[1][1],-X[0][1]),(-X[1][0],X[0][0]))

def power(X: Matrix, n: int) -> Matrix:
    if n < 0:
        return power(inv(X),-n)
    out=I
    for _ in range(n):
        out=mul(out,X)
    return out

def conjugate(T: Matrix, H: Matrix) -> Matrix:
    return mul(mul(T,H),inv(T))

def entropy(values) -> float:
    c=Counter(values)
    n=len(values)
    return -sum((count/n)*math.log2(count/n) for count in c.values())

def conditional_entropy(targets, descriptors) -> float:
    groups=defaultdict(list)
    for target,desc in zip(targets,descriptors):
        groups[desc].append(target)
    n=len(targets)
    return sum((len(group)/n)*entropy(group) for group in groups.values())

C=mul(A,B)
BASE={'I':I,'A':A,'B':B,'S':S}
K_VALUES=(-1,0,1)
SHARES=('E1','E2','E3')
COALITIONS=tuple(
    coalition
    for r in range(len(SHARES)+1)
    for coalition in combinations(SHARES,r)
)
H2_C=((2,-1),(1,0))

TASKS={
    'H2_FULL':{
        'target':'H2',
        'local':None,
        'baseline_minimal':(('E1','E2'),),
        'explicit_denies':(),
        'expected_added':(('E2','E3'),),
        'expected_hardened_minimal':(('E1','E2'),('E2','E3')),
        'expected_hardened_cuts':(('E2',),('E1','E3')),
        'expected_hardened_poly':(1,-1,-1,1),
    },
    'GLOBAL_REAUTH':{
        'target':'G',
        'local':'P2',
        'baseline_minimal':(('E1','E2'),),
        'explicit_denies':(),
        'expected_added':(('E2','E3'),),
        'expected_hardened_minimal':(('E1','E2'),('E2','E3')),
        'expected_hardened_cuts':(('E2',),('E1','E3')),
        'expected_hardened_poly':(1,-1,-1,1),
    },
    'ROUTE_REAUTH':{
        'target':'P2',
        'local':'H3',
        'baseline_minimal':(('E2','E3'),),
        'explicit_denies':(),
        'expected_added':(('E1','E2'),),
        'expected_hardened_minimal':(('E1','E2'),('E2','E3')),
        'expected_hardened_cuts':(('E2',),('E1','E3')),
        'expected_hardened_poly':(1,-1,-1,1),
    },
    'C_CLASS_ALARM':{
        'target':'CFLAG',
        'local':None,
        'baseline_minimal':(('E3',),),
        'explicit_denies':(('E1',),),
        'expected_added':(('E1','E2'),),
        'expected_hardened_minimal':(('E3',),('E1','E2')),
        'expected_hardened_cuts':(('E1','E3'),('E2','E3')),
        'expected_hardened_poly':(1,0,-2,1),
    },
}

def make_case(un,U,vn,V,k):
    T1=mul(U,power(B,k))
    T2=mul(power(B,-k),V)
    P2=mul(T1,T2)
    H2=conjugate(T1,B)
    H3=conjugate(P2,C)
    R=mul(H3,H2)
    G=mul(R,A)
    return {
        'label':(un,vn,k),
        'H2':H2,
        'H3':H3,
        'P2':P2,
        'G':G,
        'CFLAG':int(H2==H2_C),
        'E1':H2[0][0],
        'E2':H2[1][0],
        'E3':H2[1][1],
    }

def values(cases,key):
    return [c[key] for c in cases]

def descriptor(cases, local, coalition):
    out=[]
    for c in cases:
        row=[]
        if local is not None:
            row.append(c[local])
        row.extend(c[s] for s in coalition)
        out.append(tuple(row))
    return out

def capability_family(cases,cfg):
    target=values(cases,cfg['target'])
    return tuple(
        coalition for coalition in COALITIONS
        if conditional_entropy(target,descriptor(cases,cfg['local'],coalition)) < 1e-12
    )

def upward_closure(minimal_authorized):
    return tuple(
        c for c in COALITIONS
        if any(set(m).issubset(set(c)) for m in minimal_authorized)
    )

def is_upward_closed(family):
    fam=set(family)
    for c in family:
        for d in COALITIONS:
            if set(c).issubset(set(d)) and d not in fam:
                return False
    return True

def minimal_success(family):
    fam=set(family)
    return tuple(
        c for c in family
        if not any(set(d)<set(c) for d in fam)
    )

def survives(failure_set,family):
    F=set(failure_set)
    return any(F.isdisjoint(set(c)) for c in family)

def failure_family(family):
    return tuple(F for F in COALITIONS if not survives(F,family))

def minimal_cuts(family):
    failures=failure_family(family)
    return tuple(
        F for F in failures
        if not any(set(G)<set(F) for G in failures)
    )

def singleton_cuts(family):
    return tuple(c for c in minimal_cuts(family) if len(c)==1)

def reliability_coeffs(family):
    coeff=[0,0,0,0]
    n=len(SHARES)
    for F in COALITIONS:
        if survives(F,family):
            k=len(F)
            alive=n-k
            for j in range(alive+1):
                coeff[k+j]+=comb(alive,j)*((-1)**j)
    return tuple(coeff)

def poly_eval(coeff,p):
    return sum(c*(p**i) for i,c in enumerate(coeff))

def candidate_policies(capability, baseline, explicit_denies):
    cap=set(capability)
    base=set(baseline)
    optional=tuple(c for c in capability if c not in base)
    out=[]
    for r in range(len(optional)+1):
        for extra in combinations(optional,r):
            sf=base | set(extra)
            fam=tuple(c for c in COALITIONS if c in sf)
            if not base.issubset(sf):
                continue
            if not sf.issubset(cap):
                continue
            if any(d in sf for d in explicit_denies):
                continue
            if not is_upward_closed(fam):
                continue
            out.append(fam)
    return tuple(out)

def canonical_family_key(family):
    return tuple((len(c),c) for c in family)

def synthesize(cases,cfg):
    cap=capability_family(cases,cfg)
    baseline=upward_closure(cfg['baseline_minimal'])
    cap_single=set(singleton_cuts(cap))

    valid=[]
    for fam in candidate_policies(cap,baseline,cfg['explicit_denies']):
        induced=tuple(c for c in singleton_cuts(fam) if c not in cap_single)
        if induced:
            continue
        added=tuple(c for c in fam if c not in baseline)
        rel=poly_eval(reliability_coeffs(fam),0.1)
        valid.append({
            'family':fam,
            'added':added,
            'added_count':len(added),
            'reliability_p01':rel,
        })

    if not valid:
        raise RuntimeError('no valid hardened policy')

    valid.sort(key=lambda x:(
        x['added_count'],
        -x['reliability_p01'],
        canonical_family_key(x['family']),
    ))
    return cap,baseline,tuple(valid),valid[0]

def recovery_ratio(base,hard,cap,p):
    rb=poly_eval(reliability_coeffs(base),p)
    rh=poly_eval(reliability_coeffs(hard),p)
    rc=poly_eval(reliability_coeffs(cap),p)
    if abs(rc-rb)<1e-12:
        return 1.0
    return (rh-rb)/(rc-rb)

def main():
    cases=[
        make_case(un,U,vn,V,k)
        for un,U in BASE.items()
        for vn,V in BASE.items()
        for k in K_VALUES
    ]

    checks=[
        {'name':'suite:48_histories','pass':len(cases)==48},
        {'name':'suite:8_coalitions','pass':len(COALITIONS)==8},
    ]
    task_results={}

    for task,cfg in TASKS.items():
        cap,base,valid,opt=synthesize(cases,cfg)
        hard=opt['family']
        added=opt['added']

        hard_min=minimal_success(hard)
        hard_cuts=minimal_cuts(hard)
        hard_poly=reliability_coeffs(hard)

        cap_single=set(singleton_cuts(cap))
        hard_induced=tuple(c for c in singleton_cuts(hard) if c not in cap_single)

        checks.extend([
            {'name':f'{task}:valid_candidates_exist','pass':len(valid)>0},
            {'name':f'{task}:opt_added_exact','pass':added==cfg['expected_added']},
            {'name':f'{task}:opt_added_count_one','pass':len(added)==1},
            {'name':f'{task}:hardened_upward_closed','pass':is_upward_closed(hard)},
            {'name':f'{task}:baseline_subset','pass':set(base).issubset(set(hard))},
            {'name':f'{task}:within_capability','pass':set(hard).issubset(set(cap))},
            {'name':f'{task}:denies_preserved','pass':all(d not in hard for d in cfg['explicit_denies'])},
            {'name':f'{task}:no_policy_induced_singletons','pass':hard_induced==()},
            {'name':f'{task}:hardened_minimal_exact','pass':hard_min==cfg['expected_hardened_minimal']},
            {'name':f'{task}:hardened_cuts_exact','pass':hard_cuts==cfg['expected_hardened_cuts']},
            {'name':f'{task}:hardened_poly_exact','pass':hard_poly==cfg['expected_hardened_poly']},
            {'name':f'{task}:strict_improvement_p01','pass':poly_eval(reliability_coeffs(hard),0.1) > poly_eval(reliability_coeffs(base),0.1)},
            {'name':f'{task}:not_above_capability_p01','pass':poly_eval(reliability_coeffs(hard),0.1) <= poly_eval(reliability_coeffs(cap),0.1)+1e-12},
            {'name':f'{task}:minimum_added_count_proven','pass':all(v['added_count']>=opt['added_count'] for v in valid)},
        ])

        task_results[task]={
            'capability_family':[list(c) for c in cap],
            'baseline_family':[list(c) for c in base],
            'explicit_denies':[list(c) for c in cfg['explicit_denies']],
            'valid_candidate_count':len(valid),
            'selected_family':[list(c) for c in hard],
            'newly_authorized':[list(c) for c in added],
            'selected_minimal_success':[list(c) for c in hard_min],
            'selected_minimal_cuts':[list(c) for c in hard_cuts],
            'capability_singleton_cuts':[list(c) for c in singleton_cuts(cap)],
            'baseline_singleton_cuts':[list(c) for c in singleton_cuts(base)],
            'hardened_singleton_cuts':[list(c) for c in singleton_cuts(hard)],
            'reliability_coeffs':{
                'capability':list(reliability_coeffs(cap)),
                'baseline':list(reliability_coeffs(base)),
                'hardened':list(hard_poly),
            },
            'reliability':{
                'p_0_1':{
                    'capability':poly_eval(reliability_coeffs(cap),0.1),
                    'baseline':poly_eval(reliability_coeffs(base),0.1),
                    'hardened':poly_eval(hard_poly,0.1),
                    'recovery_ratio':recovery_ratio(base,hard,cap,0.1),
                },
                'p_0_5':{
                    'capability':poly_eval(reliability_coeffs(cap),0.5),
                    'baseline':poly_eval(reliability_coeffs(base),0.5),
                    'hardened':poly_eval(hard_poly,0.5),
                    'recovery_ratio':recovery_ratio(base,hard,cap,0.5),
                },
            },
        }

    checks.extend([
        {'name':'cross:full_tasks_recover_full_capability','pass':
            task_results['H2_FULL']['selected_family']==task_results['H2_FULL']['capability_family'] and
            task_results['GLOBAL_REAUTH']['selected_family']==task_results['GLOBAL_REAUTH']['capability_family'] and
            task_results['ROUTE_REAUTH']['selected_family']==task_results['ROUTE_REAUTH']['capability_family']
        },
        {'name':'cross:alarm_remains_strict_subset','pass':
            set(tuple(c) for c in task_results['C_CLASS_ALARM']['selected_family']) <
            set(tuple(c) for c in task_results['C_CLASS_ALARM']['capability_family'])
        },
        {'name':'cross:alarm_E1_singleton_still_denied','pass':['E1'] not in task_results['C_CLASS_ALARM']['selected_family']},
        {'name':'cross:alarm_p01_0p981','pass':abs(task_results['C_CLASS_ALARM']['reliability']['p_0_1']['hardened']-0.981)<1e-12},
        {'name':'cross:alarm_p01_recovery_0p9','pass':abs(task_results['C_CLASS_ALARM']['reliability']['p_0_1']['recovery_ratio']-0.9)<1e-12},
        {'name':'cross:alarm_p05_recovery_0p5','pass':abs(task_results['C_CLASS_ALARM']['reliability']['p_0_5']['recovery_ratio']-0.5)<1e-12},
    ])

    passed=sum(c['pass'] for c in checks)

    result={
        'experiment':'NBG-AH21',
        'version':'0.1.0',
        'verdict':'PASS_AH21' if passed==len(checks) else 'FAIL_AH21',
        'checks_passed':passed,
        'checks_total':len(checks),
        'histories':len(cases),
        'tasks':task_results,
        'checks':checks,
    }

    out=Path(__file__).resolve().parents[1]/'results'
    payload=(json.dumps(result,indent=2,sort_keys=True)+'\n').encode()
    (out/'result.json').write_bytes(payload)

    print(json.dumps({
        'verdict':result['verdict'],
        'checks':f'{passed}/{len(checks)}',
        'histories':len(cases),
        'tasks':{
            k:{
                'added':v['newly_authorized'],
                'minimal_success':v['selected_minimal_success'],
                'cuts':v['selected_minimal_cuts'],
                'p0.1':v['reliability']['p_0_1'],
            }
            for k,v in task_results.items()
        },
        'result_sha256':hashlib.sha256(payload).hexdigest(),
    },indent=2))

    if result['verdict']!='PASS_AH21':
        raise SystemExit(1)

if __name__=='__main__':
    main()
