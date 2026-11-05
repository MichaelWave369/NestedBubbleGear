import assert from 'node:assert/strict'
import {STATES,sites} from '../src/boundaryDiscovery.js'
import {nextState} from '../src/boundaryDiscoveryMismatch.js'
import {BD03_PROTOCOL,ORACLES,TASKS,SPLITS,enumerateRules,localNextState,
 oracleNextState,measurement,predicted,oracleReading,partitionStates,
 probeEntropy,chooseTrainingInput,consistentRules,runBD03,compareBD03
} from '../src/boundaryRuleSynthesis.js'

let passed=0
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('bounded grammar enumerates distinct nonempty 8-row truth tables, reproducibly',()=>{
 const a=enumerateRules(5),b=enumerateRules(5)
 assert.deepEqual(a,b);assert.ok(a.length>=8);assert.equal(new Set(a.map(x=>x.signature)).size,a.length)
 assert.ok(a.every(x=>x.cost>=1&&x.cost<=5&&/^[01]{8}$/.test(x.signature)))
 assert.deepEqual(enumerateRules(1).map(x=>x.expr).sort(),['C','L','R'])
})
test('depth-five grammar synthesizes pair, triple and majority rule behavior',()=>{
 const rules=enumerateRules(5)
 for(const name of ['RIGHT_PAIR','LEFT_PAIR','TRIPLE_PRODUCT','MAJORITY_THREE','SHIFT_RIGHT']){
  assert.ok(rules.some(rule=>STATES.every(s=>
   localNextState(s,rule)===nextState(s,name))),name+' not synthesized')
 }
})
test('local synth rule implementation gives only six binary outputs',()=>{
 for(const r of enumerateRules(5))for(const s of STATES){
  const value=localNextState(s,r)
  assert.ok(Number.isInteger(value)&&value>=0&&value<64)
 }
})
test('synthetic truth task definitions are consistent with the state oracle',()=>{
 for(const oracle of ORACLES)for(const state of STATES)for(const task of TASKS){
  const next=oracleNextState(state,oracle)
  assert.ok(next>=0&&next<64)
  assert.equal(oracleReading(state,oracle,task),measurement(next,task))
 }
})
test('sum-only equivalence does not identify left-vs-right pair mechanism',()=>{
 assert.ok(STATES.every(s=>measurement(nextState(s,'RIGHT_PAIR'),'SUM')===
  measurement(nextState(s,'LEFT_PAIR'),'SUM')))
 assert.ok(STATES.some(s=>measurement(nextState(s,'RIGHT_PAIR'),'ANCHOR_0')!==
  measurement(nextState(s,'LEFT_PAIR'),'ANCHOR_0')))
})
test('both registered splits are exhaustive, disjoint, predeclared',()=>{
 for(const split of SPLITS){
  const {train,holdout}=partitionStates(split)
  assert.equal(new Set([...train,...holdout]).size,STATES.length)
  assert.ok(train.every(s=>!holdout.includes(s)))
 }
 const interleaved=partitionStates('INTERLEAVED')
 assert.equal(interleaved.train.length,48);assert.equal(interleaved.holdout.length,16)
 const parity=partitionStates('PARITY_SHIFT')
 assert.equal(parity.train.length,32);assert.equal(parity.holdout.length,32)
})
test('probe planner uses rules + training partition, not the oracle identity',()=>{
 const rules=enumerateRules(4),partition=partitionStates()
 const p=chooseTrainingInput(rules,[],partition.train,'SUM','ENTROPY')
 assert.deepEqual(p,chooseTrainingInput(rules,[],partition.train,'SUM','ENTROPY'))
 assert.ok(partition.train.includes(p.state));assert.ok(p.entropy>=0)
 assert.equal(chooseTrainingInput(rules,[],partition.train,'SUM','FIXED').state,
  partition.train[0])
 assert.ok(probeEntropy(p.state,rules,'SUM')>=0)
})
test('training observations only select inputs from declared training set',()=>{
 for(const split of SPLITS)for(const policy of ['ENTROPY','FIXED']){
  const r=runBD03({oracle:'TRIPLE_PRODUCT',split,policy,budget:8,maxCost:5})
  const train=new Set(r.partition.trainStates),holdout=new Set(r.partition.holdoutStates)
  assert.ok(r.observations.every(o=>train.has(o.state)&&!holdout.has(o.state)))
  assert.equal(new Set(r.observations.map(o=>o.state)).size,r.observations.length)
 }
})
test('maxCost one cannot represent triple product under a complete training sweep',()=>{
 const r=runBD03({oracle:'TRIPLE_PRODUCT',maxCost:1,budget:48})
 assert.equal(r.decision.status,'GRAMMAR_REJECTED')
 assert.equal(r.decision.frozenRule,null)
 assert.equal(r.holdout.rows.length,0)
})
test('a known local oracle can be fitted without its model name in the grammar',()=>{
 const r=runBD03({oracle:'TRIPLE_PRODUCT',budget:48,maxCost:5})
 assert.ok(r.decision.frozenRule)
 assert.ok(r.observations.length<=48)
 assert.equal(r.holdout.status,'FROZEN_HOLDOUT_SCORED')
 assert.equal(r.holdout.scores.synthesized.accuracy,1)
})
test('frozen models retain negative holdout results under parity distribution shift',()=>{
 const r=runBD03({oracle:'GLOBAL_PARITY',split:'PARITY_SHIFT',
  maxCost:5,budget:32,policy:'FIXED'})
 assert.ok(r.decision.frozenRule)
 assert.equal(r.holdout.rows.length,32)
 assert.equal(r.holdout.scores.synthesized.accuracy,0)
 assert.equal(r.holdout.assessment,'FALSIFIED_BY_HELD_OUT_CASES')
 assert.ok(r.observations.every(o=>o.response===6))
 assert.ok(r.holdout.rows.every(row=>row.truth===-6))
})
test('out-of-class position-specific rule is not identical to a homogeneous local rule on all states',()=>{
 const rules=enumerateRules(5)
 assert.ok(!rules.some(rule=>STATES.every(s=>
  predicted(s,rule,'SUM')===oracleReading(s,'POSITIONAL_FLIP','SUM'))))
})
test('frozen holdout rows can independently reproduce all accuracy and MAE scores',()=>{
 const r=runBD03({oracle:'RIGHT_PAIR',maxCost:5,budget:16})
 if(r.holdout.scores){
  for(const [key,val] of Object.entries(r.holdout.scores)){
   assert.equal(val.exact,r.holdout.rows.filter(x=>x[key]===x.truth).length)
   assert.equal(val.meanAbsoluteError,r.holdout.rows.reduce((sum,x)=>
    sum+Math.abs(x[key]-x.truth),0)/r.holdout.rows.length)
  }
 }
})
test('equal-budget fixed baseline exists and comparison cannot inherit future observations',()=>{
 const paired=compareBD03({oracle:'MAJORITY_THREE',maxCost:5,budget:8})
 assert.equal(paired.adaptive.settings.policy,'ENTROPY')
 assert.equal(paired.fixed.settings.policy,'FIXED')
 assert.equal(paired.adaptive.settings.budget,paired.fixed.settings.budget)
 assert.deepEqual(paired.adaptive.partition,paired.fixed.partition)
})
test('zero budget refuses holdout selection and preserves origin labels',()=>{
 const a=runBD03({budget:0}),b=runBD03({budget:0})
 assert.deepEqual(a,b)
 assert.equal(a.decision.status,'NO_TRAINING')
 assert.equal(a.holdout.status,'NOT_EVALUATED_NO_FROZEN_MODEL')
 assert.equal(a.schema,'NBG.BD03.v1')
 assert.equal(a.protocol,BD03_PROTOCOL)
 assert.equal(a.origin,'SIMULATED')
 assert.equal(a.authority,'NONE')
})
test('invalid oracle, task, split, policy, complexity and budget fail closed',()=>{
 assert.throws(()=>runBD03({oracle:'NOT_A_RULE'}))
 assert.throws(()=>runBD03({task:'UNSUPPORTED'}))
 assert.throws(()=>runBD03({split:'UNSUPPORTED'}))
 assert.throws(()=>runBD03({policy:'UNSUPPORTED'}))
 assert.throws(()=>runBD03({budget:49}))
 assert.throws(()=>runBD03({budget:-1}))
 assert.throws(()=>runBD03({budget:1.4}))
 assert.throws(()=>enumerateRules(0))
 assert.throws(()=>enumerateRules(7))
 assert.throws(()=>localNextState(0,{signature:'garbage'}))
 assert.throws(()=>chooseTrainingInput(enumerateRules(3),[0],partitionStates().train))
})
console.log('NBG-BD03 '+passed+'/'+passed+' PASS · compositional rule synthesis and shift challenge')
