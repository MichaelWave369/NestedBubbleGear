import { drivenAngle, TAU } from './spiralGearMath.js'

// Finite closed-world catalog: results never certify values outside this declared list.
export const PHASE_CATALOG = Object.freeze(
  [0, .08, .16, .24, .32, .40, .48, .55].map((e, index) =>
    Object.freeze({ id: 'E' + index, eccentricity: e }))
)
export const PHASE_PROBE_ANGLES = Object.freeze([
  30, 45, 60, 75, 90, 105, 120, 135, 150, 180,
  210, 225, 240, 255, 270, 285, 300, 315, 330,
])
export const FIXED_PHASE_SCAN = Object.freeze([
  180, 90, 45, 135, 270, 225, 315, 60, 120, 240,
  300, 30, 150, 210, 330, 75, 105, 255, 285,
])
export const PHASE_RESOLUTIONS = Object.freeze([4, 8, 12, 16, 20, 24, 30])
export const PHASE_METHODS = Object.freeze(['ADAPTIVE', 'FIXED'])

export function oraclePhaseDegrees(eccentricity, angleDegrees) {
  return drivenAngle(angleDegrees * Math.PI / 180, eccentricity) * 180 / Math.PI
}
export function observedPhaseBucket(eccentricity, angleDegrees, resolutionDegrees) {
  // Synthetic deterministic quantization, NOT measured sensor noise.
  return Math.round(oraclePhaseDegrees(eccentricity, angleDegrees) / resolutionDegrees)
}
export function groupPhaseCandidates(candidateIds, angleDegrees, resolutionDegrees) {
  const groups = new Map()
  for (const id of candidateIds) {
    const candidate = PHASE_CATALOG.find(row => row.id === id)
    if (!candidate) throw new RangeError('Unknown candidate id ' + id)
    const bucket = observedPhaseBucket(candidate.eccentricity, angleDegrees, resolutionDegrees)
    if (!groups.has(bucket)) groups.set(bucket, [])
    groups.get(bucket).push(id)
  }
  return [...groups.entries()].sort((a, b) => a[0] - b[0])
    .map(([bucket, ids]) => ({ bucket, ids }))
}
function probeScore(candidateIds, angle, resolutionDegrees) {
  const groups = groupPhaseCandidates(candidateIds, angle, resolutionDegrees)
  return {
    angle,
    groups,
    worstCase: Math.max(...groups.map(row => row.ids.length)),
    pairCount: groups.reduce((sum, row) => sum + row.ids.length ** 2, 0),
  }
}
export function selectNextPhaseProbe(candidateIds, usedAngles, resolutionDegrees) {
  if (!PHASE_RESOLUTIONS.includes(resolutionDegrees)) throw new RangeError('Unsupported resolution')
  if (!Array.isArray(candidateIds) || candidateIds.length === 0 ||
    new Set(candidateIds).size !== candidateIds.length) throw new RangeError('Invalid candidates')
  const unused = PHASE_PROBE_ANGLES.filter(angle => !usedAngles.includes(angle))
  if (!unused.length) return null
  const rankings = unused.map(angle => probeScore(candidateIds, angle, resolutionDegrees))
  rankings.sort((a, b) =>
    a.worstCase - b.worstCase ||
    a.pairCount - b.pairCount ||
    Math.abs(a.angle - 90) - Math.abs(b.angle - 90) ||
    a.angle - b.angle)
  // Greedy one-step minimax partition, NOT a globally optimal decision tree.
  return rankings[0]
}
function validate({ truthId, resolutionDegrees, maxQueries, method }) {
  if (!PHASE_CATALOG.some(row => row.id === truthId)) throw new RangeError('Truth is outside catalog')
  if (!PHASE_RESOLUTIONS.includes(resolutionDegrees)) throw new RangeError('Unsupported resolution')
  if (!Number.isInteger(maxQueries) || maxQueries < 1 || maxQueries > 8) {
    throw new RangeError('Query budget must be an integer from 1 to 8')
  }
  if (!PHASE_METHODS.includes(method)) throw new RangeError('Unknown method')
}
export function runAdaptivePhaseObserver({
  truthId = 'E4',
  resolutionDegrees = 12,
  maxQueries = 5,
  method = 'ADAPTIVE',
} = {}) {
  validate({ truthId, resolutionDegrees, maxQueries, method })
  const truth = PHASE_CATALOG.find(row => row.id === truthId)
  let remaining = PHASE_CATALOG.map(row => row.id)
  const steps = []
  const usedAngles = []
  let stopReason = null
  for (let index = 0; index < maxQueries && remaining.length > 1; index += 1) {
    const selected = method === 'ADAPTIVE'
      ? selectNextPhaseProbe(remaining, usedAngles, resolutionDegrees)
      : probeScore(remaining, FIXED_PHASE_SCAN[index], resolutionDegrees)
    if (!selected) {
      stopReason = 'PROBE_SET_EXHAUSTED'
      break
    }
    if (method === 'ADAPTIVE' && selected.worstCase === remaining.length) {
      stopReason = 'NO_SPLITTING_PROBE_AT_RESOLUTION'
      break
    }
    const measurementBucket = observedPhaseBucket(
      truth.eccentricity, selected.angle, resolutionDegrees)
    const after = selected.groups.find(group => group.bucket === measurementBucket)?.ids || []
    if (!after.length) throw new Error('Oracle did not match any declared candidate')
    steps.push({
      index: index + 1,
      angle: selected.angle,
      before: [...remaining],
      after: [...after],
      outcomeBucket: measurementBucket,
      outcomeDegrees: measurementBucket * resolutionDegrees,
      exactOracleDegrees: oraclePhaseDegrees(truth.eccentricity, selected.angle),
      partitions: selected.groups,
      worstCase: selected.worstCase,
      pairCount: selected.pairCount,
      eliminationCount: remaining.length - after.length,
    })
    usedAngles.push(selected.angle)
    remaining = after
  }
  if (!stopReason) {
    stopReason = remaining.length === 1
      ? 'IDENTIFIED_WITHIN_DECLARED_CATALOG'
      : steps.length === maxQueries ? 'QUERY_BUDGET_EXHAUSTED' : 'PROBE_SET_EXHAUSTED'
  }
  return {
    schema: 'nbg.adaptive-phase.simulation.v1',
    provenance: 'SIMULATED',
    authority: 'DEMONSTRATION_ONLY',
    algorithm: method === 'ADAPTIVE' ? 'ONE_STEP_MINIMAX_PARTITION' : 'FIXED_ORDER_SCAN',
    method,
    truthId,
    resolutionDegrees,
    maxQueries,
    catalog: PHASE_CATALOG,
    allowedAngles: PHASE_PROBE_ANGLES,
    steps,
    remaining,
    stopReason,
    checks: {
      allModelsCloseAfterOneTurn: PHASE_CATALOG.every(row =>
        Math.abs(drivenAngle(TAU, row.eccentricity) + TAU) < 1e-10),
      blind180CannotSeparate: new Set(PHASE_CATALOG.map(row =>
        observedPhaseBucket(row.eccentricity, 180, resolutionDegrees))).size === 1,
      truthStillPresent: remaining.includes(truthId),
      neverReusedAngle: new Set(usedAngles).size === usedAngles.length,
    },
  }
}
export function adaptivePhaseReceipt(result, fixedResult) {
  const serialize = run => ({
    method: run.method,
    steps: run.steps.map(step => ({
      index: step.index,
      angleDegrees: step.angle,
      before: step.before,
      quantizedDegrees: step.outcomeDegrees,
      outcomeBucket: step.outcomeBucket,
      partitions: step.partitions,
      after: step.after,
      eliminated: step.eliminationCount,
      worstCasePartition: step.worstCase,
      sumSquaredPartitionSizes: step.pairCount,
    })),
    remaining: run.remaining,
    stopReason: run.stopReason,
    checks: run.checks,
  })
  return {
    schema: 'nbg.adaptive-phase.simulation-receipt.v1',
    origin: 'SIMULATED',
    authority: 'DEMONSTRATION_ONLY',
    claim: 'WITHIN_DECLARED_FINITE_CATALOG_ONLY',
    limitations: [
      'Simulated oracle, not observed external measurements',
      'Quantization is deterministic rounding, not a calibrated sensor-noise model',
      'Greedy minimax angle choice is not a globally optimal adaptive policy',
      'Distinct recorded histories are observer memory, not demonstrated physical residue',
    ],
    frozenExperimentsModified: false,
    inputs: { truthId: result.truthId, resolutionDegrees: result.resolutionDegrees,
      maxQueries: result.maxQueries, catalog: result.catalog, angles: result.allowedAngles },
    adaptive: serialize(result),
    fixedBaseline: serialize(fixedResult),
  }
}
