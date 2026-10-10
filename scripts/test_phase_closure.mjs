import assert from 'node:assert/strict'
import { analyzePhaseClosure, buildPhaseReceipt, KEYHOLES } from '../src/phaseClosureMath.js'

const normal = analyzePhaseClosure()
assert.equal(normal.checks.endpointClosure, true)
assert.equal(normal.checks.endpointEquivalent, true)
assert.equal(normal.checks.pitchContactConsistent, true)
assert.equal(normal.observers.ENDPOINT.distinguishes, false)
assert.equal(normal.observers.PHASE_TRACE.distinguishes, true)
assert.equal(normal.observers.SPEED_TRACE.distinguishes, true)
assert.ok(normal.phasePeak.differenceDegrees > 0)
assert.equal(normal.retainedMemoryStatus, 'NO_STORED_HISTORY')
assert.equal(normal.rows.length, 129)

const witness = analyzePhaseClosure({ keyhole: 'PROBE', probeDegrees: 90 })
assert.equal(witness.observed.distinguishes, true)
assert.equal(witness.verdict, 'DISTINGUISHABLE_UNDER_KEYHOLE')
const blindProbe = analyzePhaseClosure({ keyhole: 'PROBE', probeDegrees: 180 })
assert.equal(blindProbe.observed.distinguishes, false, '180° probe must miss the difference')
assert.equal(blindProbe.observers.PHASE_TRACE.distinguishes, true, 'deeper observer still separates')
const endpoints = analyzePhaseClosure({ keyhole: 'PROBE', probeDegrees: 0 })
assert.equal(endpoints.observed.distinguishes, false)

for (const samples of [16, 64, 128, 256]) {
  for (const eccentricity of [0, .12, .32, .55]) {
    const result = analyzePhaseClosure({ comparisonE: eccentricity, samples, keyhole: 'PHASE_TRACE' })
    assert.equal(result.checks.endpointClosure, true)
    assert.equal(result.checks.pitchContactConsistent, true)
    assert.equal(result.observed.distinguishes, eccentricity !== 0)
    assert.equal(result.rows.length, samples + 1)
  }
}
const same = analyzePhaseClosure({ referenceE: 0, comparisonE: 0, keyhole: 'SPEED_TRACE', retainHistory: true })
assert.equal(same.checks.circleNegativeControl, true)
assert.equal(same.observed.distinguishes, false)
assert.equal(same.retainedMemoryStatus, 'RECORDED_TRAJECTORIES_MATCH')
const sameEllipse = analyzePhaseClosure({ referenceE: .32, comparisonE: .32, keyhole: 'PHASE_TRACE' })
assert.equal(sameEllipse.observed.distinguishes, false)
const remembered = analyzePhaseClosure({ keyhole: 'PHASE_TRACE', retainHistory: true })
assert.equal(remembered.retainedMemoryStatus, 'RECORDED_TRAJECTORIES_DIFFER')
const receipt = buildPhaseReceipt(remembered)
assert.equal(receipt.origin, 'SIMULATED')
assert.equal(receipt.authority, 'DEMONSTRATION_ONLY')
assert.equal(receipt.memory.physicalResidueDemonstrated, false)
assert.equal(receipt.negativeControl.endpointClosure, true)
assert.equal(receipt.negativeControl.phaseDistinguishes, false)
assert.equal(receipt.negativeControl.speedDistinguishes, false)
assert.deepEqual(receipt, buildPhaseReceipt(analyzePhaseClosure({ keyhole:'PHASE_TRACE', retainHistory:true })))
assert.equal(KEYHOLES.length, 4)
for (const bad of [{samples:3}, {comparisonE:1}, {probeDegrees:361}, {keyhole:'MAGIC'}]) {
  assert.throws(() => analyzePhaseClosure(bad), RangeError)
}
console.log('PASS: NBG Phase/Closure observer witnesses, blind probe, negative controls, closure, replay')
