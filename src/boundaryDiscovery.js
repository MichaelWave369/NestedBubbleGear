// NBG-BD01 · Boundary Discovery. Exact synthetic six-site ring.
// The planner receives a compatible cohort and an authorized probe catalog,
// never the oracle state or future response before choosing its next probe.
export const BD01_PROTOCOL=Object.freeze({
 id:'NBG-BD01',version:'0.1.0',origin:'SIMULATED',authority:'NONE',
 universe:'64 deterministic six-site binary ring states',
 keyhole:'sum of six signed sites',
 task:'predict the sum after a declared horizon of one or two transitions',
 policy:'greedy expected 0–1 Bayes risk improvement per synthetic credit',
 limits:'Finite known model and catalog, not physics, consciousness, or independent discovery'
})
export const STATES=Object.freeze(Array.from({length:64},(_,i)=>i))
export const PROFILES=Object.freeze({
 ALL:{name:'All authorized probes',families:['boundary','odd','edge','site']},
 LOCAL:{name:'Local probes, no full boundary count',families:['odd','edge','site']},
 SITES:{name:'Single-site measurements only',families:['site']},
 BLIND:{name:'No authorized probes',families:[]}
})
export const PROBES=Object.freeze([
 Object.freeze({id:'BOUNDARY_COUNT',name:'Count all adjacent sign changes',family:'boundary',cost:3}),
 Object.freeze({id:'ODD_SUM',name:'Sum positions 1, 3, 5',family:'odd',cost:1}),
 ...Array.from({length:6},(_,i)=>Object.freeze({id:'EDGE_'+i,name:'Read neighbor product '+(i+1),family:'edge',cost:1})),
 ...Array.from({length:6},(_,i)=>Object.freeze({id:'SITE_'+i,name:'Read site '+(i+1),family:'site',cost:1}))
])
function checkState(s){
 if(!Number.isInteger(s)||s<0||s>63)throw Error('State must be an integer 0..63')
}
function checkHorizon(h){
 if(h!==1&&h!==2)throw Error('Horizon must be 1 or 2')
}
export function sites(s){
 checkState(s)
 return Array.from({length:6},(_,i)=>(s&(1<<i))?1:-1)
}
export function transition(s){
 const a=sites(s)
 let out=0
 for(let i=0;i<6;i++)if(a[i]===a[(i+1)%6])out|=1<<i
 return out
}
export function total(s){return sites(s).reduce((a,b)=>a+b,0)}
export function futureTotal(s,horizon=1){
 checkHorizon(horizon)
 let v=s
 for(let i=0;i<horizon;i++)v=transition(v)
 return total(v)
}
export function compatibleCohort(s){
 const visible=total(s)
 return STATES.filter(x=>total(x)===visible)
}
export function distribution(cohort,horizon=1){
 checkHorizon(horizon)
 const counts=new Map()
 for(const s of cohort)counts.set(futureTotal(s,horizon),(counts.get(futureTotal(s,horizon))||0)+1)
 return [...counts].sort((a,b)=>a[0]-b[0]).map(([outcome,count])=>({outcome,count}))
}
export function bayesRisk(cohort,horizon=1){
 if(!cohort.length)return 0
 return 1-Math.max(...distribution(cohort,horizon).map(x=>x.count))/cohort.length
}
export function probeValue(s,id){
 const a=sites(s)
 if(id==='BOUNDARY_COUNT')return a.filter((v,i)=>v!==a[(i+1)%6]).length
 if(id==='ODD_SUM')return a[0]+a[2]+a[4]
 const p=PROBES.find(p=>p.id===id)
 if(!p)throw Error('Unknown probe: '+id)
 const i=Number(id.slice(id.indexOf('_')+1))
 if(p.family==='edge')return a[i]*a[(i+1)%6]
 return a[i]
}
export function authorizedProbes(profile='ALL'){
 const p=PROFILES[profile]
 if(!p)throw Error('Unknown probe profile: '+profile)
 return PROBES.filter(q=>p.families.includes(q.family))
}
function partition(cohort,probeId){
 const groups=new Map()
 for(const state of cohort){
  const answer=probeValue(state,probeId)
  if(!groups.has(answer))groups.set(answer,[])
  groups.get(answer).push(state)
 }
 return groups
}
export function expectedRisk(cohort,probeId,horizon=1){
 if(!cohort.length)throw Error('Cohort must not be empty')
 return [...partition(cohort,probeId).values()]
  .reduce((sum,group)=>sum+(group.length/cohort.length)*bayesRisk(group,horizon),0)
}
// Exact optimal single-step choice under a declared greedy objective.
// Positive gain is required, and no privileged oracle value is consulted.
export function chooseProbe(cohort,used=[],budget=3,profile='ALL',horizon=1){
 checkHorizon(horizon)
 if(!Array.isArray(cohort)||!cohort.length||cohort.some(s=>!STATES.includes(s)))throw Error('Invalid cohort')
 if(!Array.isArray(used)||used.some(id=>!PROBES.some(p=>p.id===id)))throw Error('Invalid prior probe list')
 if(!Number.isFinite(budget)||budget<0)throw Error('Invalid remaining budget')
 const before=bayesRisk(cohort,horizon)
 const ranked=authorizedProbes(profile)
  .filter(p=>!used.includes(p.id)&&p.cost<=budget+1e-10)
  .map(p=>({...p,afterRisk:expectedRisk(cohort,p.id,horizon)}))
  .map(p=>({...p,gain:Math.max(0,before-p.afterRisk),efficiency:Math.max(0,before-p.afterRisk)/p.cost}))
  .filter(p=>p.gain>1e-10)
  .sort((a,b)=>(b.efficiency-a.efficiency)||(b.gain-a.gain)||(a.cost-b.cost)||a.id.localeCompare(b.id))
 return ranked[0]||null
}
export function librarySufficient(cohort,profile='ALL',used=[] ,horizon=1){
 checkHorizon(horizon)
 const remaining=authorizedProbes(profile).filter(p=>!used.includes(p.id))
 const groups=new Map()
 for(const s of cohort){
  const key=remaining.map(p=>probeValue(s,p.id)).join('|')
  if(!groups.has(key))groups.set(key,[])
  groups.get(key).push(s)
 }
 return [...groups.values()].every(group=>distribution(group,horizon).length<=1)
}
export function collisionWitness(cohort,horizon=1){
 for(let i=0;i<cohort.length;i++)for(let j=i+1;j<cohort.length;j++){
  if(futureTotal(cohort[i],horizon)!==futureTotal(cohort[j],horizon))
   return {a:cohort[i],b:cohort[j],samePresent:total(cohort[i]),
    futureA:futureTotal(cohort[i],horizon),futureB:futureTotal(cohort[j],horizon)}
 }
 return null
}
export function runBD01({state=7,budget=3,profile='ALL',horizon=1}={}){
 checkState(state);checkHorizon(horizon);authorizedProbes(profile)
 if(!Number.isFinite(budget)||budget<0||budget>30)throw Error('Budget must be finite and in 0..30')
 let candidates=compatibleCohort(state),spent=0
 const initial={visibleTotal:total(state),candidateCount:candidates.length,
  outcomeCounts:distribution(candidates,horizon),bayesRisk:bayesRisk(candidates,horizon),
  collision:collisionWitness(candidates,horizon)}
 const steps=[],used=[]
 while(bayesRisk(candidates,horizon)>1e-10){
  const probe=chooseProbe(candidates,used,budget-spent,profile,horizon)
  if(!probe)break
  // This oracle response becomes visible only AFTER the cohort-based choice.
  const response=probeValue(state,probe.id)
  const before=candidates
  candidates=before.filter(s=>probeValue(s,probe.id)===response)
  used.push(probe.id);spent+=probe.cost
  steps.push({number:steps.length+1,id:probe.id,name:probe.name,cost:probe.cost,
   response,plannedGain:probe.gain,plannedAfterRisk:probe.afterRisk,
   candidatesBefore:before.length,candidatesAfter:candidates.length,
   riskBefore:bayesRisk(before,horizon),riskAfter:bayesRisk(candidates,horizon),
   outcomeCounts:distribution(candidates,horizon)})
 }
 const risk=bayesRisk(candidates,horizon)
 const status=risk<1e-10?'TASK_RESOLVED':
  !librarySufficient(candidates,profile,used,horizon)?'UNOBSERVABLE_LIBRARY':
  !authorizedProbes(profile).some(p=>!used.includes(p.id)&&p.cost<=budget-spent+1e-10)?'BUDGET_EXHAUSTED':
  'GREEDY_STALLED'
 return {schema:'NBG.BD01.v1',protocol:BD01_PROTOCOL,origin:'SIMULATED',
  authority:'NONE',settings:{state,budget,profile,horizon},
  // Available for post-run verification only, NOT a planner input.
  oracle:{state,sites:sites(state),actualFutureTotal:futureTotal(state,horizon)},
  initial,steps,final:{status,spent,remaining:budget-spent,candidateCount:candidates.length,
   candidates,outcomeCounts:distribution(candidates,horizon),bayesRisk:risk,
   predictedOutcome:risk<1e-10?futureTotal(candidates[0],horizon):null},
  caveat:'Exact finite toy model with designed probes and synthetic costs. Planner is greedy and may stall even when a multi-probe plan exists. No empirical, cosmological, spiritual, or consciousness inference.'}
}
