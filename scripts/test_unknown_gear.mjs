import assert from 'node:assert/strict'
import { PHASE_CATALOG } from '../src/adaptivePhaseKeyhole.js'
import { runUnknownGearExperiment, unknownGearReceipt,
  simulateUnknownReading, compatibleUnknownCandidates } from '../src/unknownGearModel.js'

// Open-world far-out rejection and in-catalog controls.
const unknown = runUnknownGearExperiment()
assert.equal(unknown.status, 'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
assert.equal(unknown.survivors.length, 0)
assert.ok(unknown.steps.length > 0)
assert.equal(unknown.checks.monotoneFiltering, true)
assert.equal(unknown.checks.allAnglesUnique, true)
assert.equal(unknown.checks.allObservationsRespectDeclaredNoise, true)
const known = runUnknownGearExperiment({truthEccentricity: .32})
assert.ok(known.survivors.includes('E4'))
assert.notEqual(known.status, 'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
assert.ok(known.checks.truthPreservedWhenCatalogedAndBoundValid)
assert.equal(known.checks.noFalseClaimOfIdentification, true)
assert.equal(known.assumptionViolated, false)
const near = runUnknownGearExperiment({truthEccentricity: .29})
assert.ok(near.checks.monotoneFiltering)
assert.equal(near.assumptionViolated, false)
const restricted = runUnknownGearExperiment({truthEccentricity: .32,queryBudget: 1})
assert.notEqual(restricted.status, 'CONSISTENT_WITH_CATALOG_PROFILE')
const invalidAssumptions = runUnknownGearExperiment({
  truthEccentricity: .32, injectedNoiseDegrees: 4, declaredNoiseBoundDegrees: .5,
})
assert.equal(invalidAssumptions.status, 'MODEL_ASSUMPTIONS_VIOLATED')
const receipt=unknownGearReceipt(unknown)
assert.equal(receipt.origin, 'SIMULATED')
assert.equal(receipt.authority, 'DEMONSTRATION_ONLY')
assert.equal(receipt.claimStatus, 'MODEL_RELATIVE_NOT_EMPIRICALLY_VALIDATED')
assert.deepEqual(receipt,unknownGearReceipt(runUnknownGearExperiment()))

for(const seed of [0,1,369,999,65535]){
  for(const value of PHASE_CATALOG){
    for(const resolutionDegrees of [4,8,12]){
      for(const noise of [0,1,2]){
        const run=runUnknownGearExperiment({
          truthEccentricity:value.eccentricity,seed,resolutionDegrees,
          injectedNoiseDegrees:noise,declaredNoiseBoundDegrees:noise,
          queryBudget:8,
        })
        assert.equal(run.checks.truthPreservedWhenCatalogedAndBoundValid,true)
        assert.notEqual(run.status,'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS')
        assert.equal(run.checks.allAnglesUnique,true)
        assert.equal(run.checks.monotoneFiltering,true)
      }
    }
  }
}
for(const sample of [0,.24,.32,.72]){
  const reading=simulateUnknownReading(sample,105,4,1,369,1)
  assert.ok(Math.abs(reading.jitterDegrees)<=1)
  assert.ok(reading.observedDegrees%4===0, 'measurement must lie on rounding grid')
  const ids=PHASE_CATALOG.map(row=>row.id)
  const after=compatibleUnknownCandidates(ids,105,reading.observedDegrees,4,1.5)
  assert.deepEqual(after,ids.filter(id=>{
    const e=PHASE_CATALOG.find(row=>row.id===id).eccentricity
    const predicted=simulateUnknownReading(e,105,4,0,369,1).exactDegrees
    return Math.abs(predicted-reading.observedDegrees)<=3.5+1e-8
  }))
}
for(const opts of [
  {truthEccentricity:1},{truthEccentricity:-.1},
  {resolutionDegrees:3},{seed:-1},{seed:65536},{seed:1.2},
  {queryBudget:0},{queryBudget:13},{requiredConfirmations:4},
  {injectedNoiseDegrees:3},{declaredNoiseBoundDegrees:3},
]) assert.throws(()=>runUnknownGearExperiment(opts),RangeError)
console.log('PASS unknown gear: out-of-catalog rejection, bounded-noise truth retention, controls, mismatched assumptions, deterministic receipts')
