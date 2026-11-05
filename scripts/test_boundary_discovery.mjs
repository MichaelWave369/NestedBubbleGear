import assert from 'node:assert/strict'
import {BD01_PROTOCOL,STATES,sites,transition,total,futureTotal,compatibleCohort,
 distribution,bayesRisk,probeValue,authorizedProbes,chooseProbe,librarySufficient,
 collisionWitness,runBD01} from '../src/boundaryDiscovery.js'

let passed=0
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('complete six-bit state universe is exactly sixty-four states',()=>{
 assert.equal(STATES.length,64)
 assert.equal(new Set(STATES).size,64)
 for(const s of STATES){assert.equal(sites(s).length,6);assert.ok(STATES.includes(transition(s)))}
})
test('zero-sum Keyhole collapses twenty distinct states',()=>{
 const cohort=compatibleCohort(7)
 assert.equal(cohort.length,20)
 assert.ok(cohort.every(s=>total(s)===0))
 assert.deepEqual(distribution(cohort,1),[
  {outcome:-6,count:2},{outcome:-2,count:12},{outcome:2,count:6}
 ])
 assert.ok(Math.abs(bayesRisk(cohort,1)-0.4)<1e-12)
})
test('neighbor product identity and boundary count hold across all sixty-four states',()=>{
 for(const s of STATES){
  const a=sites(s),products=a.map((v,i)=>v*a[(i+1)%6])
  assert.equal(total(transition(s)),products.reduce((x,y)=>x+y,0))
  assert.equal(total(transition(s)),6-2*probeValue(s,'BOUNDARY_COUNT'))
  assert.equal(futureTotal(s,2),total(transition(transition(s))))
 }
})
test('greedy planner uses only cohort, authorization and budget',()=>{
 const bucket=compatibleCohort(7)
 const p=chooseProbe(bucket,[],3,'ALL',1)
 assert.equal(p.id,'BOUNDARY_COUNT')
 for(const s of bucket){
  const observed=runBD01({state:s,budget:3,profile:'ALL',horizon:1})
  assert.equal(observed.steps[0].id,p.id)
  assert.equal(observed.final.status,'TASK_RESOLVED')
  assert.equal(observed.final.predictedOutcome,futureTotal(s,1))
  assert.equal(observed.final.bayesRisk,0)
 }
})
test('oracle state never enters the choice function',()=>{
 const bucket=compatibleCohort(7)
 assert.deepEqual(chooseProbe(bucket,[],3,'ALL',1),chooseProbe([...bucket],[],3,'ALL',1))
 assert.equal(chooseProbe(bucket,[],0,'ALL',1),null)
})
test('budget and library denial refuse to infer unseen outcomes',()=>{
 const noBudget=runBD01({state:7,budget:0,profile:'ALL'})
 assert.equal(noBudget.final.status,'BUDGET_EXHAUSTED')
 assert.equal(noBudget.final.predictedOutcome,null)
 const blind=runBD01({state:7,budget:30,profile:'BLIND'})
 assert.equal(blind.final.status,'UNOBSERVABLE_LIBRARY')
 assert.equal(blind.steps.length,0)
 assert.equal(blind.final.predictedOutcome,null)
 assert.equal(authorizedProbes('BLIND').length,0)
})
test('greedy stall is not misreported as fundamental impossibility',()=>{
 const c=compatibleCohort(7)
 assert.equal(librarySufficient(c,'SITES'),true)
 const run=runBD01({state:7,budget:6,profile:'SITES'})
 assert.equal(run.final.status,'GREEDY_STALLED')
 assert.equal(run.steps.length,0)
})
test('one-step sufficiency does not imply two-step sufficiency',()=>{
 const pair=STATES.flatMap(a=>STATES
  .filter(b=>a<b&&total(a)===total(b)&&futureTotal(a,1)===futureTotal(b,1)&&futureTotal(a,2)!==futureTotal(b,2))
  .map(b=>[a,b]))[0]
 assert.ok(pair)
 assert.equal(total(pair[0]),total(pair[1]))
 assert.notEqual(futureTotal(pair[0],2),futureTotal(pair[1],2))
 const result=runBD01({state:7,budget:3,profile:'ALL',horizon:2})
 assert.equal(result.settings.horizon,2)
})
test('collision witness is a genuine same-present future distinction',()=>{
 const c=compatibleCohort(7),w=collisionWitness(c)
 assert.ok(w)
 assert.equal(total(w.a),total(w.b))
 assert.notEqual(futureTotal(w.a,1),futureTotal(w.b,1))
})
test('deterministic evidence receipts preserve synthetic and refusal labels',()=>{
 const opts={state:7,budget:1,profile:'LOCAL',horizon:1}
 const a=runBD01(opts),b=runBD01(opts)
 assert.deepEqual(a,b)
 assert.equal(a.schema,'NBG.BD01.v1')
 assert.equal(a.protocol,BD01_PROTOCOL)
 assert.equal(a.origin,'SIMULATED')
 assert.equal(a.authority,'NONE')
 assert.ok(a.steps.every(s=>s.cost>0&&s.candidatesAfter<=s.candidatesBefore))
 assert.equal(a.oracle.actualFutureTotal,futureTotal(7,1))
})
test('invalid states, budgets, horizons, profiles and probes fail closed',()=>{
 assert.throws(()=>sites(64))
 assert.throws(()=>runBD01({state:-1}))
 assert.throws(()=>runBD01({budget:-1}))
 assert.throws(()=>runBD01({budget:Infinity}))
 assert.throws(()=>runBD01({horizon:3}))
 assert.throws(()=>runBD01({profile:'GOD_MODE'}))
 assert.throws(()=>probeValue(7,'NOT_A_PROBE'))
 assert.throws(()=>chooseProbe([],[],3))
})
console.log('NBG-BD01 '+passed+'/'+passed+' PASS · exact finite boundary discovery')
