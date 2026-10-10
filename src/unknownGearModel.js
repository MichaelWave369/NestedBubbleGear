import { PHASE_CATALOG, PHASE_PROBE_ANGLES, selectNextPhaseProbe } from './adaptivePhaseKeyhole.js'
import { oraclePhaseDegrees, PHASE_RESOLUTIONS } from './adaptivePhaseKeyhole.js'

// Deterministic, bounded demonstration noise. It is neither Gaussian nor a real sensor.
export const UNKNOWN_GEAR_PRESETS = Object.freeze([
  { id: 'UNKNOWN_FAR', label: 'Unknown · e = 0.72', eccentricity: .72 },
  { id: 'KNOWN', label: 'Known · e = 0.32', eccentricity: .32 },
  { id: 'UNKNOWN_NEAR', label: 'Near catalog · e = 0.29', eccentricity: .29 },
  { id: 'KNOWN_HIGH', label: 'Known · e = 0.48', eccentricity: .48 },
])
export const UNKNOWN_GEAR_STATES = Object.freeze([
  'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS',
  'PROVISIONAL_SINGLETON',
  'CONSISTENT_WITH_CATALOG_PROFILE',
  'UNRESOLVED_CATALOG_SET',
  'MODEL_ASSUMPTIONS_VIOLATED',
])
export const UNKNOWN_NOISE_LEVELS = Object.freeze([0, .5, 1, 2, 4, 8])
export const UNKNOWN_BOUNDS = Object.freeze([0, .5, 1, 1.5, 2, 4, 8])

function validate({ truthEccentricity, resolutionDegrees, injectedNoiseDegrees,
  declaredNoiseBoundDegrees, queryBudget, requiredConfirmations, seed }) {
  if (!Number.isFinite(truthEccentricity) || truthEccentricity < 0 ||
    truthEccentricity >= .99) throw new RangeError('Physical parameter must lie in [0, .99)')
  if (!PHASE_RESOLUTIONS.includes(resolutionDegrees)) throw new RangeError('Unsupported resolution')
  if (!UNKNOWN_NOISE_LEVELS.includes(injectedNoiseDegrees)) throw new RangeError('Unsupported injected noise')
  if (!UNKNOWN_BOUNDS.includes(declaredNoiseBoundDegrees)) throw new RangeError('Unsupported declared bound')
  if (!Number.isInteger(queryBudget) || queryBudget < 1 || queryBudget > 12) {
    throw new RangeError('Budget out of range')
  }
  if (!Number.isInteger(requiredConfirmations) || requiredConfirmations < 1 ||
    requiredConfirmations > 3) throw new RangeError('Confirmation count out of range')
  if (!Number.isInteger(seed) || seed < 0 || seed > 65535) throw new RangeError('Seed out of range')
}
function localNoise(seed, angle, ordinal) {
  let x = (seed ^ Math.imul(angle, 2654435761) ^ Math.imul(ordinal, 2246822519)) | 0
  x ^= x << 13
  x ^= x >>> 17
  x ^= x << 5
  return ((x >>> 0) / 0xffffffff) * 2 - 1
}
export function simulateUnknownReading(truthEccentricity, angle, resolutionDegrees,
  injectedNoiseDegrees, seed, ordinal) {
  const exactDegrees = oraclePhaseDegrees(truthEccentricity, angle)
  const jitterDegrees = localNoise(seed, angle, ordinal) * injectedNoiseDegrees
  const rawDegrees = exactDegrees + jitterDegrees
  const observedDegrees = Math.round(rawDegrees / resolutionDegrees) * resolutionDegrees
  return { exactDegrees, jitterDegrees, rawDegrees, observedDegrees }
}
export function compatibleUnknownCandidates(candidateIds, angle, observation,
  resolutionDegrees, declaredNoiseBoundDegrees) {
  const radius = declaredNoiseBoundDegrees + resolutionDegrees / 2 + 1e-8
  return candidateIds.filter(id => {
    const model = PHASE_CATALOG.find(row => row.id === id)
    if (!model) throw new RangeError('Invalid hypothesis')
    return Math.abs(oraclePhaseDegrees(model.eccentricity, angle) - observation) <= radius
  })
}
function verifyAngle(ids, used) {
  const allowed = PHASE_PROBE_ANGLES.filter(angle => !used.includes(angle))
  if (!allowed.length) return null
  // If only one hypothesis survives, ask an independently located probe:
  // maximize local phase sensitivity against off-grid eccentricity perturbations.
  // This is model sensitivity, not a guarantee of falsifying all unseen models.
  const e = PHASE_CATALOG.find(row => row.id === ids[0]).eccentricity
  const lower = Math.max(0, e - .07)
  const upper = Math.min(.98, e + .07)
  return allowed
    .map(angle => ({
      angle,
      sensitivity: Math.abs(oraclePhaseDegrees(upper, angle) -
        oraclePhaseDegrees(lower, angle)),
    }))
    .sort((a, b) => b.sensitivity - a.sensitivity ||
      Math.abs(a.angle - 90) - Math.abs(b.angle - 90) || a.angle - b.angle)[0].angle
}
export function runUnknownGearExperiment({
  truthEccentricity = .72,
  resolutionDegrees = 4,
  injectedNoiseDegrees = 1,
  declaredNoiseBoundDegrees = 1.5,
  queryBudget = 6,
  requiredConfirmations = 2,
  seed = 369,
} = {}) {
  const settings = {
    truthEccentricity, resolutionDegrees, injectedNoiseDegrees,
    declaredNoiseBoundDegrees, queryBudget, requiredConfirmations, seed,
  }
  validate(settings)
  const assumptionViolated = injectedNoiseDegrees > declaredNoiseBoundDegrees
  let survivors = PHASE_CATALOG.map(row => row.id)
  let confirmations = 0
  const steps = []
  const usedAngles = []
  const acceptanceRadius = declaredNoiseBoundDegrees + resolutionDegrees / 2
  for (let i = 0; i < queryBudget && survivors.length > 0; i += 1) {
    if (survivors.length === 1 && confirmations >= requiredConfirmations) break
    let angle = null
    if (survivors.length > 1) {
      const proposed = selectNextPhaseProbe(survivors, usedAngles, resolutionDegrees)
      // Use a non-repeated, sensitive probe even if rounded catalog bins cannot split.
      angle = proposed?.worstCase < survivors.length
        ? proposed.angle
        : verifyAngle(survivors, usedAngles)
    } else angle = verifyAngle(survivors, usedAngles)
    if (angle === null) break
    const reading = simulateUnknownReading(
      truthEccentricity, angle, resolutionDegrees, injectedNoiseDegrees, seed, i + 1)
    const before = [...survivors]
    const after = compatibleUnknownCandidates(before, angle, reading.observedDegrees,
      resolutionDegrees, declaredNoiseBoundDegrees)
    const wasSingleton = before.length === 1
    if (wasSingleton && after.length === 1) confirmations += 1
    else if (after.length !== 1) confirmations = 0
    const modelResiduals = before.map(id => {
      const eccentricity = PHASE_CATALOG.find(row => row.id === id).eccentricity
      return { id, differenceDegrees: Math.abs(
        oraclePhaseDegrees(eccentricity, angle) - reading.observedDegrees),
      consistent: after.includes(id) }
    })
    steps.push({
      index: i + 1, angle, before, after, modelResiduals,
      observedDegrees: reading.observedDegrees,
      exactOracleDegrees: reading.exactDegrees,
      noiseDegrees: reading.jitterDegrees,
      uncertaintyRadiusDegrees: acceptanceRadius,
      confirmedSingletonAtStep: wasSingleton && after.length === 1,
      confirmations,
      eliminated: before.length - after.length,
    })
    usedAngles.push(angle)
    survivors = after
  }
  let status
  if (assumptionViolated) status = 'MODEL_ASSUMPTIONS_VIOLATED'
  else if (survivors.length === 0) status = 'NONE_OF_THE_ABOVE_UNDER_ASSUMPTIONS'
  else if (survivors.length === 1 && confirmations >= requiredConfirmations) {
    status = 'CONSISTENT_WITH_CATALOG_PROFILE'
  } else if (survivors.length === 1) status = 'PROVISIONAL_SINGLETON'
  else status = 'UNRESOLVED_CATALOG_SET'
  return {
    schema: 'nbg.unknown-gear.simulation.v1',
    origin: 'SIMULATED', authority: 'DEMONSTRATION_ONLY',
    settings, assumptionViolated, status, steps, survivors, confirmations,
    acceptanceRadius, catalog: PHASE_CATALOG,
    checks: {
      allAnglesUnique: new Set(usedAngles).size === usedAngles.length,
      monotoneFiltering: steps.every(step => step.after.every(id => step.before.includes(id))),
      allObservationsRespectDeclaredNoise: !assumptionViolated,
      noFalseClaimOfIdentification: status !== 'CONSISTENT_WITH_CATALOG_PROFILE' ||
        survivors.length === 1 && confirmations >= requiredConfirmations,
      truthPreservedWhenCatalogedAndBoundValid: !PHASE_CATALOG.some(row =>
        row.eccentricity === truthEccentricity) || assumptionViolated ||
        survivors.includes(PHASE_CATALOG.find(row =>
          row.eccentricity === truthEccentricity).id),
    },
    caveat: 'Open-world detection is conditional on a finite catalog and declared bounded-error model. Inconclusive results are not proof of membership.',
  }
}
export function unknownGearReceipt(run) {
  return {
    schema: 'nbg.unknown-gear.receipt.v1',
    origin: 'SIMULATED', authority: 'DEMONSTRATION_ONLY',
    claimStatus: 'MODEL_RELATIVE_NOT_EMPIRICALLY_VALIDATED',
    assumptions: {
      boundedInjectedNoise: run.settings.injectedNoiseDegrees,
      declaredNoiseBound: run.settings.declaredNoiseBoundDegrees,
      deterministicQuantizationDegrees: run.settings.resolutionDegrees,
      noiseLaw: 'bounded deterministic pseudo-uniform, seeded, not physical random noise',
      oneStepSelection: 'greedy minimax partition then off-grid sensitivity verification',
    },
    settings: run.settings,
    catalog: run.catalog,
    status: run.status,
    survivors: run.survivors,
    confirmations: run.confirmations,
    steps: run.steps,
    checks: run.checks,
    limitations: [
      'No genuine hardware sensing or measured real-world noise',
      'NONE OF THE ABOVE requires a valid declared error bound',
      'CONSISTENT_WITH_CATALOG_PROFILE is not proof that the truth belongs to the catalog',
      'Unseen nearby models may be observationally equivalent at tested angles',
      'Does not alter frozen NBG protocols, research ledger, or evidence authority',
    ],
  }
}
