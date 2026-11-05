import assert from 'node:assert/strict'
import {STATES,total} from '../src/boundaryDiscovery.js'
import {BD02_PROTOCOL,INITIAL_MODELS,REGISTERED_GRAMMAR,TRAIN_STATES,HOLDOUT_STATES,
 nextState,observable,entropyOfPredictions,selectTrainingProbe,buildHoldout,runBD02,
 comparePolicies} from '../src/boundaryDiscoveryMismatch.js'

let passed=0
function test(name,fn){fn();passed++;console.log('PASS '+name)}
test('train / holdout are disjoint and cover all sixty-four states',()=>{
 assert.equal(TRAIN_STATES.length,48);assert.equal(HOLDOUT_STATES.length,16)
 assert.equal(new Set([...TRAIN_STATES,...HOLDOUT_STATES]).size,STATES.length)
 assert.ok(TRAIN_STATES.every(s=>!HOLDOUT_STATES.includes(s)))
})
test('all rule outputs remain six-site configurations with integral signed sums',()=>{
 for(const s of STATES)for(const m of [...REGISTERED_GRAMMAR,'ALL_NEGATIVE']){
  const next=nextState(s,m)
  assert.ok(next>=0&&next<64)
  assert.equal(observable(s,m),total(next))
 }
})
test('left and right pair sums are observationally indistinguishable for every input',()=>{
 for(const s of STATES)assert.equal(observable(s,'LEFT_PAIR'),observable(s,'RIGHT_PAIR'))
 assert.ok(STATES.some(s=>nextState(s,'LEFT_PAIR')!==nextState(s,'RIGHT_PAIR')))
})
test('planning does not accept or inspect an oracle label',()=>{
 const a=selectTrainingProbe([...REGISTERED_GRAMMAR],[],'ADAPTIVE')
 const b=selectTrainingProbe([...REGISTERED_GRAMMAR],[],'ADAPTIVE')
 assert.deepEqual(a,b);assert.ok(TRAIN_STATES.includes(a.state));assert.ok(a.entropy>0)
 assert.equal(selectTrainingProbe([...REGISTERED_GRAMMAR],[],'FIXED').state,TRAIN_STATES[0])
 assert.throws(()=>selectTrainingProbe(['ALL_NEGATIVE'],[]))
})
test('known right-pair rule is not falsely reported as uniquely identified',()=>{
 const r=runBD02({oracle:'RIGHT_PAIR',budget:3})
 assert.equal(r.decision.status,'TASK_EQUIVALENT_MODELS_UNIDENTIFIED')
 assert.deepEqual(r.decision.frozenModels,['RIGHT_PAIR','LEFT_PAIR'])
 assert.equal(r.decision.mechanismIdentified,false)
 assert.equal(r.holdout.candidateScore.exactAccuracy,1)
})
test('shift rule is recovered without catalog mismatch',()=>{
 const r=runBD02({oracle:'SHIFT_RIGHT'})
 assert.equal(r.decision.status,'IN_INITIAL_CATALOG')
 assert.deepEqual(r.decision.frozenModels,['SHIFT_RIGHT'])
 assert.equal(r.decision.firstCatalogContradictionStep,null)
 assert.equal(r.holdout.candidateScore.exactAccuracy,1)
})
test('triple-product unlisted catalog rule produces a contradiction and registered recovery',()=>{
 const r=runBD02({oracle:'TRIPLE_PRODUCT',budget:3})
 assert.equal(r.decision.status,'RECOVERED_REGISTERED_CANDIDATE')
 assert.ok(r.decision.firstCatalogContradictionStep!==null)
 assert.deepEqual(r.decision.catalogSurvivors,[])
 assert.deepEqual(r.decision.frozenModels,['TRIPLE_PRODUCT'])
 assert.equal(r.holdout.candidateScore.exactAccuracy,1)
})
test('three-site majority also recovers after catalog mismatch',()=>{
 const r=runBD02({oracle:'MAJORITY_THREE',budget:3})
 assert.equal(r.decision.status,'RECOVERED_REGISTERED_CANDIDATE')
 assert.deepEqual(r.decision.frozenModels,['MAJORITY_THREE'])
 assert.equal(r.holdout.rows.length,16)
 assert.equal(r.holdout.candidateScore.correct,16)
})
test('out-of-grammar constant rule refuses unearned recovery',()=>{
 const r=runBD02({oracle:'ALL_NEGATIVE',budget:3})
 assert.equal(r.decision.status,'OUTSIDE_REGISTERED_GRAMMAR')
 assert.deepEqual(r.decision.frozenModels,[])
 assert.equal(r.holdout.candidateScore,null)
 assert.equal(r.holdout.rows.length,0)
})
test('zero budget does not peek at oracle or evaluate holdout',()=>{
 const r=runBD02({oracle:'TRIPLE_PRODUCT',budget:0})
 assert.equal(r.decision.status,'NO_BUDGET')
 assert.equal(r.queries.length,0)
 assert.equal(r.holdout.status,'NOT_SCORED_WITHOUT_FROZEN_PREDICTION')
})
test('equal-budget fixed diagnostic baseline is explicitly included',()=>{
 const x=comparePolicies({oracle:'TRIPLE_PRODUCT',budget:3})
 assert.equal(x.adaptive.settings.budget,x.fixed.settings.budget)
 assert.equal(x.fixed.settings.policy,'FIXED')
 assert.equal(x.adaptive.settings.policy,'ADAPTIVE')
 assert.ok(x.adaptive.queries.every(q=>TRAIN_STATES.includes(q.state)))
 assert.ok(x.fixed.queries.every(q=>TRAIN_STATES.includes(q.state)))
 assert.ok(!x.adaptive.queries.some(q=>HOLDOUT_STATES.includes(q.state)))
})
test('heldout score and baseline are independently recomputable from rows',()=>{
 const r=runBD02({oracle:'TRIPLE_PRODUCT'})
 const rows=r.holdout.rows
 assert.equal(r.holdout.baselines.fixedRightPair.meanAbsoluteError,
  rows.reduce((v,x)=>v+Math.abs(x.fixedRightPair-x.truth),0)/16)
 assert.equal(r.holdout.candidateScore.meanAbsoluteError,0)
 assert.equal(r.holdout.baselines.trainModeConstant.count,16)
})
test('post-freeze task-equivalent holdout uses unchanged output, not a chosen identity',()=>{
 const observations=[{state:1,response:observable(1,'RIGHT_PAIR')}]
 const x=buildHoldout(['RIGHT_PAIR','LEFT_PAIR'],observations,'LEFT_PAIR')
 assert.equal(x.status,'SCORED_FROZEN_HOLDOUT')
 assert.equal(x.candidateScore.correct,16)
 assert.equal(buildHoldout(['RIGHT_PAIR','SHIFT_RIGHT'],observations,'LEFT_PAIR').candidateScore,null)
})
test('deterministic evidence receipts and falsifiable claim labels',()=>{
 const settings={oracle:'MAJORITY_THREE',policy:'ADAPTIVE',budget:3}
 const a=runBD02(settings),b=runBD02(settings)
 assert.deepEqual(a,b)
 assert.equal(a.protocol,BD02_PROTOCOL)
 assert.equal(a.origin,'SIMULATED');assert.equal(a.authority,'NONE')
 assert.equal(a.schema,'NBG.BD02.v1')
})
test('unknown models, invalid policy, repeat query and invalid budgets rejected',()=>{
 assert.throws(()=>observable(0,'NOT_REAL'))
 assert.throws(()=>runBD02({oracle:'NOT_REAL'}))
 assert.throws(()=>runBD02({policy:'NOT_REAL'}))
 assert.throws(()=>runBD02({budget:-1}))
 assert.throws(()=>runBD02({budget:1.2}))
 assert.throws(()=>runBD02({budget:99}))
 assert.throws(()=>entropyOfPredictions(0,[]))
 assert.throws(()=>selectTrainingProbe([...INITIAL_MODELS],[1,1]))
 assert.throws(()=>selectTrainingProbe([...INITIAL_MODELS],[0]))
})
console.log('NBG-BD02 '+passed+'/'+passed+' PASS · synthetic model mismatch and reserved holdout')
