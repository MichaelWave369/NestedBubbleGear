import assert from 'node:assert/strict'
import { NI1, generateNI1, analyzeNI1, detachedDonorSwap, hiddenStateWitness, ni1Receipt } from '../src/ni1Model.js'

let checks=0
function check(name,action){action();checks++;console.log('PASS NI1 '+name)}
const seeded=(world,seed=369,options={})=>{
 const rec=generateNI1({world,seed})
 return {rec,report:analyzeNI1(rec,options)}
}
check('frozen version and provenance',()=>{
 assert.equal(NI1.version,'NI1-E1-toy-0.1.0')
 assert.equal(NI1.origin,'SIMULATED')
 assert.equal(NI1.authority,'NONE')
 assert.equal(NI1.worlds.length,5)
})
check('exact deterministic replay, multiple seeds, all worlds',()=>{
 for(const seed of [19,42,369,777])for(const world of NI1.worlds)
  assert.deepEqual(generateNI1({world,seed}),generateNI1({world,seed}))
})
check('contract refuses invalid world, seeds and giant interventions',()=>{
 assert.throws(()=>generateNI1({world:'telepathy'}))
 assert.throws(()=>generateNI1({seed:0}))
 assert.throws(()=>generateNI1({seed:1.2}))
 assert.throws(()=>generateNI1({seed:Infinity}))
 assert.throws(()=>generateNI1({donorShiftAfterDetach:9}))
 assert.throws(()=>analyzeNI1({rows:[]}))
})
check('independent null and shared-driver impostor are distinct causal histories',()=>{
 const none=generateNI1({world:'null',seed:369})
 const shared=generateNI1({world:'shared-driver',seed:369})
 assert.notDeepEqual(none.rows,shared.rows)
 const corrNone=analyzeNI1(none).metrics.rawCorrelation
 const corrShared=analyzeNI1(shared).metrics.rawCorrelation
 assert(Math.abs(corrNone)<.3)
 assert(corrShared>.45,'shared input can generate strong raw correlation without a direct edge')
})
check('non-path and shared driver worlds do not pass recovered pathway gate',()=>{
 for(const seed of [19,42,369,777]){
  for(const world of ['null','shared-driver']){
   const {report}=seeded(world,seed)
   assert.equal(report.status,'NO EXTRA PATH ADMITTED',world+' seed='+seed)
   assert.equal(report.trainingCount,NI1.trainingEnds-NI1.lag)
   assert.equal(report.holdoutCount,NI1.total-NI1.trainingEnds)
  }
 }
})
check('known synthetic pathway passes toy positive control',()=>{
 for(const seed of [19,42,369,777]){
  const {report}=seeded('pathway',seed)
  assert.equal(report.status,'INJECTED PATH RECOVERED (TOY ONLY)')
  assert(report.estimates.candidateNeural>.2&&report.estimates.candidateNeural<.6)
  assert(report.metrics.candidateHoldoutRMSE<report.metrics.baselineHoldoutRMSE)
 }
})
check('artifact correction refuses an unmeasured nuisance',()=>{
 const {rec,report:adjusted}=seeded('artifact',369)
 const omitted=analyzeNI1(rec,{observeNuisance:false})
 assert.equal(adjusted.status,'NO EXTRA PATH ADMITTED')
 assert.equal(omitted.status,'REFUSED: UNMEASURED NUISANCE')
 assert(omitted.estimates.candidateNeural>.1)
})
check('detached donor change after isolation has *exactly zero* effect on sample',()=>{
 for(const seed of [19,42,369,777]){
  const control=detachedDonorSwap(seed)
  assert.equal(control.invariantAfterSeparation,true)
  assert.equal(control.postDetachDifference,0)
  assert.equal(control.beforeSeparationChangesSample,true)
  assert(control.initialStateDifference>0)
  const {rec,report}=seeded('detached',seed)
  assert.equal(rec.sampleDetachedAt,NI1.detach)
  assert.equal(report.status,'NO POST-DETACH PATH ADMITTED')
  assert.equal(report.trainingCount,NI1.trainingEnds-NI1.detach-NI1.lag)
  assert(rec.rows.every(r=>r.detached===(r.t>=NI1.detach)))
 }
})
check('provenance cannot be rewritten by operator-facing receipt',()=>{
 const {rec,report}=seeded('detached',369)
 const out=ni1Receipt(rec,report)
 assert.equal(out.origin,'SIMULATED')
 assert.equal(out.authority,'NONE')
 assert.equal(out.experiment,'NI1')
 assert(out.limitations.includes('No biological measurements'))
 assert.equal(out.controls.donorSwap.postDetachDifference,0)
})
check('K0-equivalent states separate under exactly stated future intervention',()=>{
 const witness=hiddenStateWitness()
 assert.equal(witness.initiallyEquivalent,true)
 assert.equal(witness.initialOutput,.5)
 assert.equal(witness.witnessValid,true)
 assert(Math.abs(witness.separation-.64)<1e-8)
 assert.equal(witness.origin,'SIMULATED')
})
check('holdout does not include training samples and scores stay finite',()=>{
 for(const world of NI1.worlds){
  const {report}=seeded(world)
  assert(report.predictions.every((r,i)=>r.t===i))
  assert(report.predictions.slice(NI1.trainingEnds).every(r=>r.phase==='HOLDOUT'))
  for(const x of Object.values(report.metrics))assert(Number.isFinite(x))
 }
})
console.log('NBG NI1-E1 '+checks+'/'+checks+' PASS · synthetic evidence only')
