import assert from 'node:assert/strict'
import { runModelMismatchRecovery, modelRecoveryReceipt, RECOVERY_GRIDS } from '../src/modelMismatchRecovery.js'
const base=runModelMismatchRecovery()
assert.equal(base.origin,'SIMULATED')
assert.equal(base.authority,'DEMONSTRATION_ONLY')
assert.equal(base.rejectedCatalogStatus,'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
assert.equal(base.status,'HOLDOUT_COMPATIBLE_UNVERIFIED')
assert.ok(RECOVERY_GRIDS.FINE.includes(base.candidate.eccentricity))
assert.ok(base.candidate.maximumTrainingResidual<=base.errorRadiusDegrees)
assert.equal(base.candidate.status,'QUARANTINED_CANDIDATE')
assert.equal(base.promoted,false)
assert.equal(base.audit.holdoutDisjointFromTraining,true)
assert.equal(base.audit.candidateFrozenBeforeHoldout,true)
assert.equal(base.holdout.length,3)
assert.equal(base.holdoutAllPass,true)
assert.ok(base.eligibleProposals.length>=1)
assert.ok(base.eligibleProposals.every(p=>RECOVERY_GRIDS.FINE.includes(p.eccentricity)))
assert.ok(base.originalTraining.length>0)
assert.ok(base.holdout.every(row=>row.consistent))
const shifted=runModelMismatchRecovery({holdoutShift:.14})
assert.deepEqual(shifted.originalTraining,base.originalTraining)
assert.deepEqual(shifted.eligibleProposals,base.eligibleProposals)
assert.deepEqual(shifted.candidate,base.candidate)
assert.deepEqual(shifted.unusedHoldoutAngles,base.unusedHoldoutAngles)
assert.equal(shifted.status,'HOLDOUT_REFUTED')
assert.equal(shifted.holdoutAllPass,false)
assert.ok(shifted.holdout.some(row=>!row.consistent))
const known=runModelMismatchRecovery({truthEccentricity:.32})
assert.equal(known.status,'REFUSED_NO_CATALOG_REJECTION')
assert.equal(known.candidate,null)
assert.equal(known.promoted,false)
const near=runModelMismatchRecovery({truthEccentricity:.29})
assert.equal(near.status,'NO_TRAINING_COMPATIBLE_PROPOSAL')
assert.equal(near.candidate,null)
assert.equal(near.promoted,false)
const invalid=runModelMismatchRecovery({injectedNoiseDegrees:4,declaredNoiseBoundDegrees:.5})
assert.equal(invalid.status,'REFUSED_INVALID_NOISE_ASSUMPTIONS')
const nonfit=runModelMismatchRecovery({proposalGrid:'EXCLUDES_TRUTH'})
assert.equal(nonfit.status,'NO_TRAINING_COMPATIBLE_PROPOSAL')
assert.equal(nonfit.candidate,null)
assert.equal(nonfit.promoted,false)
for(const id of ['FINE','COARSE','EXCLUDES_TRUTH']){
  const r=runModelMismatchRecovery({proposalGrid:id})
  assert.equal(r.promoted,false)
  if(r.candidate){
    assert.ok(RECOVERY_GRIDS[id].includes(r.candidate.eccentricity))
    assert.ok(r.originalTraining.every(row=>
      r.candidate.trainingPredictions.some(pr=>pr.angle===row.angle)))
    assert.ok(r.holdout.every(row=>!r.originalTraining.some(train=>train.angle===row.angle)))
  }
}
for(const seed of [0,7,369,2026]){
  const r=runModelMismatchRecovery({seed})
  assert.equal(r.promoted,false)
  assert.notEqual(r.status,'REFUSED_INVALID_NOISE_ASSUMPTIONS')
  assert.ok(r.candidate?.status==='QUARANTINED_CANDIDATE')
}
const receipt=modelRecoveryReceipt(base)
assert.equal(receipt.origin,'SIMULATED')
assert.equal(receipt.promoted,false)
assert.equal(receipt.quarantine,'REQUIRES_INDEPENDENT_REAL_WORLD_VALIDATION')
assert.deepEqual(receipt,modelRecoveryReceipt(runModelMismatchRecovery()))
for(const o of [
  {proposalGrid:'UNDEFINED'},{holdoutShift:1},{holdoutCount:0},
  {holdoutCount:6},{truthEccentricity:-1},{truthEccentricity:.9},
  {truthEccentricity:.99},{queryBudget:13},
])assert.throws(()=>runModelMismatchRecovery(o),RangeError)
console.log('PASS: recovery gates, predeclared fitting, frozen-candidate holdout, drift falsification, quarantine and deterministic receipts')
