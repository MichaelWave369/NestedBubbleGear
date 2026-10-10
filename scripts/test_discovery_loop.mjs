import assert from 'node:assert/strict'
import { DISCOVERY_SCENARIOS, DISCOVERY_STAGES, runDiscoveryLoop,discoveryLoopReceipt } from '../src/discoveryLoop.js'
assert.equal(DISCOVERY_STAGES.length,5)
const defaultRun=runDiscoveryLoop()
assert.equal(defaultRun.schema,'nbg.discovery-loop.simulation.v1')
assert.equal(defaultRun.geometry.endpointClosure,true)
assert.equal(defaultRun.geometry.endpointDistinguishes,false)
assert.equal(defaultRun.geometry.traceDistinguishes,true)
assert.equal(defaultRun.mismatch.status,'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
assert.equal(defaultRun.chainIntegrity.sourceReadingsExactReplay,true)
assert.equal(defaultRun.chainIntegrity.noPromotion,true)
assert.equal(defaultRun.recovery.promoted,false)
assert.equal(defaultRun.stages.at(-1).status,'PROMOTION_DENIED')
assert.equal(defaultRun.finalReview,'HUMAN_REVIEW_REQUIRED_NO_AUTOMATIC_PROMOTION')
const known=runDiscoveryLoop({scenario:'KNOWN'})
assert.notEqual(known.mismatch.status,'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
assert.equal(known.recovery.candidate,null)
const changed=runDiscoveryLoop({holdoutShift:.14})
assert.deepEqual(changed.mismatch.steps,defaultRun.mismatch.steps)
assert.deepEqual(changed.recovery.originalTraining,defaultRun.recovery.originalTraining)
assert.deepEqual(changed.recovery.candidate,defaultRun.recovery.candidate)
assert.equal(changed.recovery.status,'HOLDOUT_REFUTED')
for(const row of DISCOVERY_SCENARIOS){
  for(const resolutionDegrees of [4,8,12,16]){
    const run=runDiscoveryLoop({scenario:row.id,resolutionDegrees})
    assert.equal(run.chainIntegrity.sourceReadingsExactReplay,true)
    assert.equal(run.chainIntegrity.noFrozenResearchMutation,true)
    assert.equal(run.stages.length,5)
    assert.equal(run.geometry.endpointClosure,true)
  }
}
const invalid=runDiscoveryLoop({injectedNoiseDegrees:4,declaredNoiseBoundDegrees:.5})
assert.equal(invalid.recovery.status,'REFUSED_INVALID_NOISE_ASSUMPTIONS')
const receipt=discoveryLoopReceipt(defaultRun)
assert.equal(receipt.origin,'SIMULATED')
assert.equal(receipt.promoted,false)
assert.equal(receipt.frozenExperimentsModified,false)
assert.deepEqual(receipt,discoveryLoopReceipt(runDiscoveryLoop()))
for(const bad of [
  {scenario:'NOT_PRESENT'},{resolutionDegrees:5},{seed:-1},{holdoutShift:1},
  {injectedNoiseDegrees:3},{declaredNoiseBoundDegrees:3},
])assert.throws(()=>runDiscoveryLoop(bad),RangeError)
console.log('PASS discovery: causal chain integrity, guarded recovery, controls, receipt and no promotion')
