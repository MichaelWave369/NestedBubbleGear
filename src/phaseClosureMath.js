import { TAU, drivenAngle, gearState } from './spiralGearMath.js'

const DEG = 180 / Math.PI
const RADIANS = Math.PI / 180
export const KEYHOLES = Object.freeze([
  { id: 'ENDPOINT', name: 'O₀ · Endpoints', description: 'Only input/output at 0° and 360°' },
  { id: 'PROBE', name: 'O₁ · One probe', description: 'Endpoints plus one chosen intermediate phase' },
  { id: 'PHASE_TRACE', name: 'O₂ · Phase history', description: 'Endpoints plus sampled phase trajectory' },
  { id: 'SPEED_TRACE', name: 'O₃ · Speed history', description: 'Endpoints plus sampled velocity ratios' },
])
const round = value => Number(value.toFixed(12))
function assertSettings({ referenceE, comparisonE, probeDegrees, samples, tolerance, keyhole }) {
  if (![referenceE, comparisonE].every(v => Number.isFinite(v) && v >= 0 && v < 1)) {
    throw new RangeError('Eccentricity must be in [0, 1).')
  }
  if (!Number.isFinite(probeDegrees) || probeDegrees < 0 || probeDegrees > 360) {
    throw new RangeError('Probe must be between 0 and 360 degrees.')
  }
  if (!Number.isInteger(samples) || samples < 16 || samples > 512) {
    throw new RangeError('Sample count must be an integer from 16 to 512.')
  }
  if (!Number.isFinite(tolerance) || tolerance <= 0) throw new RangeError('Positive tolerance required.')
  if (!KEYHOLES.some(row => row.id === keyhole)) throw new RangeError('Unknown observer keyhole.')
}
export function analyzePhaseClosure({
  referenceE = 0,
  comparisonE = .32,
  probeDegrees = 90,
  samples = 128,
  tolerance = 1e-8,
  keyhole = 'ENDPOINT',
  retainHistory = false,
} = {}) {
  assertSettings({ referenceE, comparisonE, probeDegrees, samples, tolerance, keyhole })
  const rows = Array.from({ length: samples + 1 }, (_, i) => {
    const inputRadians = TAU * i / samples
    const reference = gearState(inputRadians, referenceE)
    const comparison = gearState(inputRadians, comparisonE)
    return {
      inputDegrees: inputRadians * DEG,
      referenceDegrees: reference.output * DEG,
      comparisonDegrees: comparison.output * DEG,
      differenceDegrees: (comparison.output - reference.output) * DEG,
      referenceRatio: reference.ratio,
      comparisonRatio: comparison.ratio,
      phaseDifferenceRadians: comparison.output - reference.output,
      speedDifference: comparison.ratio - reference.ratio,
    }
  })
  const first = rows[0], last = rows[rows.length - 1]
  const endDifference = Math.abs(last.phaseDifferenceRadians)
  const referenceClosureError = Math.abs(last.referenceDegrees + 360) * RADIANS
  const comparisonClosureError = Math.abs(last.comparisonDegrees + 360) * RADIANS
  const phasePeak = rows.reduce((max, row) =>
    Math.abs(row.phaseDifferenceRadians) > Math.abs(max.phaseDifferenceRadians) ? row : max, rows[0])
  const speedPeak = rows.reduce((max, row) =>
    Math.abs(row.speedDifference) > Math.abs(max.speedDifference) ? row : max, rows[0])
  const probeInput = probeDegrees * RADIANS
  const probeDifference = drivenAngle(probeInput, comparisonE) - drivenAngle(probeInput, referenceE)
  const checks = {
    endpointClosure: referenceClosureError <= tolerance && comparisonClosureError <= tolerance,
    endpointEquivalent: endDifference <= tolerance,
    circleNegativeControl: referenceE === 0 && comparisonE === 0,
    pitchContactConsistent: [referenceE, comparisonE].every(e =>
      Array.from({ length: samples + 1 }, (_, i) =>
        Math.abs(gearState(TAU * i / samples, e).gap) <= tolerance).every(Boolean)),
  }
  const observers = {
    ENDPOINT: { difference: endDifference, distinguishes: endDifference > tolerance, unit: 'rad' },
    PROBE: { difference: Math.abs(probeDifference), distinguishes: Math.abs(probeDifference) > tolerance, unit: 'rad' },
    PHASE_TRACE: { difference: Math.abs(phasePeak.phaseDifferenceRadians),
      distinguishes: Math.abs(phasePeak.phaseDifferenceRadians) > tolerance, unit: 'rad' },
    SPEED_TRACE: { difference: Math.abs(speedPeak.speedDifference),
      distinguishes: Math.abs(speedPeak.speedDifference) > tolerance, unit: 'ratio' },
  }
  const observed = observers[keyhole]
  const historyIsDifferent = observers.PHASE_TRACE.distinguishes || observers.SPEED_TRACE.distinguishes
  return {
    settings: { referenceE, comparisonE, probeDegrees, samples, tolerance, keyhole, retainHistory },
    rows,
    checks,
    observers,
    observed,
    verdict: observed.distinguishes ? 'DISTINGUISHABLE_UNDER_KEYHOLE' : 'INDISTINGUISHABLE_UNDER_KEYHOLE',
    referenceClosureError,
    comparisonClosureError,
    probeDifferenceDegrees: probeDifference * DEG,
    phasePeak: { inputDegrees: phasePeak.inputDegrees, differenceDegrees: phasePeak.differenceDegrees },
    speedPeak: { inputDegrees: speedPeak.inputDegrees, difference: speedPeak.speedDifference },
    retainedMemoryStatus: !retainHistory
      ? 'NO_STORED_HISTORY'
      : historyIsDifferent ? 'RECORDED_TRAJECTORIES_DIFFER' : 'RECORDED_TRAJECTORIES_MATCH',
    interpretation: 'Any recorded distinction is in the added observer log. No persistent physical residue is demonstrated.',
  }
}
export function buildPhaseReceipt(result) {
  const control = analyzePhaseClosure({
    referenceE: 0, comparisonE: 0, samples: result.settings.samples,
    tolerance: result.settings.tolerance, keyhole: 'PHASE_TRACE',
  })
  return {
    schema: 'nbg.phase-closure.simulation.v1',
    origin: 'SIMULATED',
    authority: 'DEMONSTRATION_ONLY',
    claimStatus: 'ILLUSTRATION_NOT_EXPERIMENTAL_VALIDATION',
    reproducibility: 'DETERMINISTIC_FORMULA_AND_PARAMETERS_NO_SIGNATURE',
    formula: 'drivenAngle(theta,e)=-2*atan2(((1-e)/(1+e))*sin(theta/2),cos(theta/2))',
    settings: result.settings,
    checks: result.checks,
    observerKeyhole: result.settings.keyhole,
    observation: result.observed,
    verdict: result.verdict,
    closureErrorRadians: {
      reference: round(result.referenceClosureError), comparison: round(result.comparisonClosureError),
    },
    witness: {
      singleProbeDegrees: round(result.settings.probeDegrees),
      probeDifferenceDegrees: round(result.probeDifferenceDegrees),
      largestSampledPhaseDifference: {
        inputDegrees: round(result.phasePeak.inputDegrees),
        differenceDegrees: round(result.phasePeak.differenceDegrees),
      },
      largestSampledSpeedRatioDifference: {
        inputDegrees: round(result.speedPeak.inputDegrees),
        difference: round(result.speedPeak.difference),
      },
    },
    negativeControl: {
      description: 'Compare circular pitch curves at e=0 versus e=0.',
      endpointClosure: control.checks.endpointClosure,
      phaseDistinguishes: control.observers.PHASE_TRACE.distinguishes,
      speedDistinguishes: control.observers.SPEED_TRACE.distinguishes,
    },
    memory: {
      status: result.retainedMemoryStatus,
      physicalResidueDemonstrated: false,
    },
    rows: result.rows.map(row => ({
      inputDegrees: round(row.inputDegrees),
      referenceDegrees: round(row.referenceDegrees),
      comparisonDegrees: round(row.comparisonDegrees),
      referenceRatio: round(row.referenceRatio),
      comparisonRatio: round(row.comparisonRatio),
    })),
  }
}
