import assert from 'node:assert/strict'
import {
  PHASE_CATALOG, PHASE_PROBE_ANGLES, PHASE_RESOLUTIONS,
  groupPhaseCandidates, observedPhaseBucket, selectNextPhaseProbe,
  runAdaptivePhaseObserver, adaptivePhaseReceipt,
} from '../src/adaptivePhaseKeyhole.js'
const defaults = runAdaptivePhaseObserver()
const fixed = runAdaptivePhaseObserver({ method: 'FIXED' })
assert.equal(defaults.checks.allModelsCloseAfterOneTurn, true)
assert.equal(defaults.checks.blind180CannotSeparate, true)
assert.equal(defaults.checks.truthStillPresent, true)
assert.equal(defaults.checks.neverReusedAngle, true)
assert.equal(defaults.provenance, 'SIMULATED')
assert.equal(defaults.authority, 'DEMONSTRATION_ONLY')
assert.equal(defaults.stopReason, 'IDENTIFIED_WITHIN_DECLARED_CATALOG')
assert.equal(defaults.remaining.length, 1)
assert.equal(defaults.remaining[0], 'E4')
assert.equal(fixed.steps[0].angle, 180)
assert.equal(fixed.steps[0].eliminationCount, 0)
assert.equal(defaults.steps[0].angle, 105)
assert.ok(defaults.steps.length < fixed.steps.length, 'default adaptive case beats deliberately blind-start fixed scan')

// One-step greedy optimum: test against a complete, independent brute-force ranking.
for (const resolutionDegrees of PHASE_RESOLUTIONS) {
  for (const truth of PHASE_CATALOG) {
    for (const method of ['ADAPTIVE', 'FIXED']) {
      const run = runAdaptivePhaseObserver({ truthId: truth.id, resolutionDegrees, maxQueries: 8, method })
      assert.equal(run.checks.truthStillPresent, true)
      assert.equal(run.checks.neverReusedAngle, true)
      assert.equal(run.checks.allModelsCloseAfterOneTurn, true)
      assert.equal(run.checks.blind180CannotSeparate, true)
      assert.ok(run.steps.length <= 8)
      for (const step of run.steps) {
        assert.ok(step.after.length <= step.before.length)
        assert.ok(step.before.every(id => PHASE_CATALOG.some(row => row.id === id)))
        assert.ok(step.after.includes(truth.id))
        assert.deepEqual(step.after,
          step.before.filter(id => observedPhaseBucket(
            PHASE_CATALOG.find(row => row.id === id).eccentricity,
            step.angle, resolutionDegrees) === step.outcomeBucket))
        assert.equal(step.eliminationCount, step.before.length - step.after.length)
        assert.equal(step.partitions.reduce((sum, row) => sum + row.ids.length, 0), step.before.length)
      }
    }
  }
}
for (const resolutionDegrees of PHASE_RESOLUTIONS) {
  for (const e of PHASE_CATALOG) {
    assert.equal(observedPhaseBucket(e.eccentricity, 180, resolutionDegrees),
      observedPhaseBucket(0, 180, resolutionDegrees))
  }
}
const allIds = PHASE_CATALOG.map(row => row.id)
for (const resolutionDegrees of PHASE_RESOLUTIONS) {
  const best = selectNextPhaseProbe(allIds, [], resolutionDegrees)
  const scores = PHASE_PROBE_ANGLES.map(angle => {
    const partitions = groupPhaseCandidates(allIds, angle, resolutionDegrees)
    return {
      angle, worstCase: Math.max(...partitions.map(row => row.ids.length)),
      pairCount: partitions.reduce((sum, row) => sum + row.ids.length ** 2, 0),
    }
  }).sort((a,b) => a.worstCase-b.worstCase || a.pairCount-b.pairCount ||
    Math.abs(a.angle-90)-Math.abs(b.angle-90) || a.angle-b.angle)
  assert.equal(best.angle, scores[0].angle)
  assert.equal(best.worstCase, scores[0].worstCase)
  assert.equal(best.pairCount, scores[0].pairCount)
}
const shortBudget = runAdaptivePhaseObserver({maxQueries:1, resolutionDegrees:30})
assert.equal(shortBudget.stopReason, 'QUERY_BUDGET_EXHAUSTED')
assert.equal(shortBudget.steps.length, 1)
assert.deepEqual(defaults, runAdaptivePhaseObserver())
assert.deepEqual(adaptivePhaseReceipt(defaults, fixed),
  adaptivePhaseReceipt(runAdaptivePhaseObserver(),runAdaptivePhaseObserver({method:'FIXED'})))
const receipt = adaptivePhaseReceipt(defaults, fixed)
assert.equal(receipt.origin, 'SIMULATED')
assert.equal(receipt.frozenExperimentsModified, false)
assert.ok(receipt.limitations.some(row => row.includes('physical residue')))
for (const bad of [
  {truthId:'NOT_CATALOGED'}, {maxQueries:0},{maxQueries:9},
  {resolutionDegrees:5}, {method:'UNSAFE'}, {maxQueries:1.5},
]) assert.throws(() => runAdaptivePhaseObserver(bad), RangeError)
assert.throws(() => selectNextPhaseProbe(['E0','E0'],[],12), RangeError)
console.log('PASS adaptive phase: greedy optimum, oracle isolation, blind control, monotonic filtering, budgets and receipt')
