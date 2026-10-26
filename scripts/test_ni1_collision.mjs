import assert from 'node:assert/strict'
import {
 NI1B,generateNI1BCollision,observationalCollisionNI1B,
 evaluateNI1B,runNI1B,receiptNI1B,
} from '../src/ni1Collision.js'

let checks=0
function check(name,fn){fn();checks++;console.log('PASS NI1 E1B '+name)}
const seeds=[19,42,369,777]
check('frozen identity and no experimental authority',()=>{
 assert.equal(NI1B.version,'NI1-E1B-toy-0.1.0')
 assert.equal(NI1B.origin,'SIMULATED')
 assert.equal(NI1B.authority,'NONE')
 assert.equal(NI1B.interventionAt,40)
})
check('finite deterministic replay across seeds, mechanisms and interventions',()=>{
 for(const seed of seeds)for(const mechanism of NI1B.mechanisms)
  for(const probe of ['none',...NI1B.channels])
    assert.deepEqual(generateNI1BCollision({mechanism,seed,probe}),
      generateNI1BCollision({mechanism,seed,probe}))
})
check('unintervened neural and nuisance causes collide exactly',()=>{
 for(const seed of seeds){
  const a=generateNI1BCollision({mechanism:'neural',seed})
  const b=generateNI1BCollision({mechanism:'instrument',seed})
  assert.deepEqual(a,b)
  const witness=observationalCollisionNI1B(seed)
  assert.equal(witness.maximumObservedDifference,0)
  assert.equal(witness.observerConclusion,'NOT IDENTIFIABLE')
 }
})
check('mechanism labels never cross the blind observer interface',()=>{
 const a=generateNI1BCollision({mechanism:'neural'})
 const b=generateNI1BCollision({mechanism:'instrument'})
 assert.deepEqual(Object.keys(a).sort(),['authority','origin','rows','version'])
 assert.equal('mechanism' in a,false)
 assert.equal('scenarioLabel' in a,false)
 assert.equal('mechanism' in a.rows[0],false)
 assert.equal(evaluateNI1B(a,b).decision,'REFUSE: NO CONFIRMED INTERVENTION')
})
check('isolated neural intervention responds only in invented neural world',()=>{
 for(const seed of seeds){
  const yes=runNI1B({mechanism:'neural',probe:'neural',seed})
  const no=runNI1B({mechanism:'instrument',probe:'neural',seed})
  assert.equal(yes.decision,'INTERVENTION RESPONSE (TOY ONLY)')
  assert.equal(no.decision,'NO RESPONSE TO ISOLATED INTERVENTION')
  assert(yes.afterIntervention.observedEffect>.1)
  assert.equal(no.afterIntervention.observedEffect,0)
  assert.equal(yes.afterIntervention.offTargetChange,0)
 }
})
check('nuisance-channel probe makes inverted causal prediction',()=>{
 for(const seed of seeds){
  const yes=runNI1B({mechanism:'instrument',probe:'nuisance',seed})
  const no=runNI1B({mechanism:'neural',probe:'nuisance',seed})
  assert.equal(yes.decision,'INTERVENTION RESPONSE (TOY ONLY)')
  assert.equal(no.decision,'NO RESPONSE TO ISOLATED INTERVENTION')
  assert.equal(no.afterIntervention.observedEffect,0)
 }
})
check('crosstalk must refuse attribution, regardless of hidden cause',()=>{
 for(const seed of seeds)for(const mechanism of NI1B.mechanisms){
  const result=runNI1B({mechanism,probe:'neural',crossTalk:true,seed})
  assert.equal(result.decision,'REFUSE: FAILED CHANNEL ISOLATION')
  assert(result.afterIntervention.offTargetChange>=NI1B.amplitude-1e-8)
  assert.equal(result.isolated,false)
 }
})
check('baseline mismatch is rejected before response interpretation',()=>{
 const ctl=generateNI1BCollision({mechanism:'neural',seed:369})
 const otherSeed=generateNI1BCollision({mechanism:'neural',seed:42,probe:'neural'})
 const result=evaluateNI1B(ctl,otherSeed)
 assert.equal(result.decision,'REFUSE: BASELINE MISMATCH')
})
check('tampered or truth-labeled observation input fails closed',()=>{
 const a=generateNI1BCollision({mechanism:'neural'})
 const b=generateNI1BCollision({mechanism:'neural',probe:'neural'})
 assert.throws(()=>evaluateNI1B({...a,mechanism:'neural'},b))
 assert.throws(()=>evaluateNI1B({...a,origin:'OBSERVED'},b))
 assert.throws(()=>evaluateNI1B({...a,rows:a.rows.slice(1)},b))
 assert.throws(()=>evaluateNI1B({...a,rows:a.rows.map((r,i)=>i===1?{...r,truth:'neural'}:r)},b))
 assert.throws(()=>evaluateNI1B(a,b,{channel:'telepathy'}))
 assert.throws(()=>generateNI1BCollision({mechanism:'telepathy'}))
 assert.throws(()=>generateNI1BCollision({seed:0}))
 assert.throws(()=>generateNI1BCollision({seed:42.5}))
 assert.throws(()=>generateNI1BCollision({crossTalk:true,probe:'none'}))
})
check('receipt records actual measured contrast while preserving SIMULATED authority',()=>{
 const run=runNI1B({mechanism:'neural',seed:369})
 const receipt=receiptNI1B(run)
 assert.equal(receipt.origin,'SIMULATED')
 assert.equal(receipt.authority,'NONE')
 assert.equal(receipt.phase,'E1B')
 assert.equal(receipt.decision,run.decision)
 assert.equal(receipt.observationalCollision.maximumObservedDifference,0)
 assert(receipt.exclusions.some(x=>x.includes('No new neuroimmune')))
 assert.throws(()=>receiptNI1B({...run,origin:'OBSERVED'}))
})
console.log('NBG-NI1-E1B '+checks+'/'+checks+' PASS · mechanism contrast is a software toy only')
