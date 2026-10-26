// EG-01: deterministic synthetic causal-observability study.
// All force coefficients below are illustrative µN scale choices, NOT material constants,
// measured forces, predictions of Li/Torr, or evidence for modified gravity.
export const EG01_ASSUMPTIONS = Object.freeze({
  magnetic: 0.36,
  thermal: 0.14,
  vibration: 0.095,
  steps: 36,
  provenance: 'SIMULATED',
  authority: 'NONE',
})
export const EG01_DEFAULTS = Object.freeze({ amplitude: 1, anomaly: 0, paired: true, noise: 0.003 })

const G = 6.67430e-11
const C = 299792458
const MU0 = 4 * Math.PI * 1e-7 // pedagogical approximation

export function fieldEnergyScale({ tesla = 10, volumeM3 = 1, distanceM = 1, testMassKg = 1 } = {}) {
  if (![tesla, volumeM3, distanceM, testMassKg].every(Number.isFinite) ||
      volumeM3 <= 0 || distanceM <= 0 || testMassKg <= 0) throw new RangeError('invalid SI inputs')
  const joules = tesla ** 2 * volumeM3 / (2 * MU0)
  const massEquivalentKg = joules / C ** 2
  // Equivalent point-source acceleration is ONLY an order-of-magnitude comparison:
  // not the full stress-energy geometry or a prediction for a real magnet.
  const accelerationMps2 = G * massEquivalentKg / distanceM ** 2
  return { joules, massEquivalentKg, accelerationMps2, forceN: accelerationMps2 * testMassKg }
}

export function driveAt(step) {
  if (step < 4 || step >= 32 || (step >= 16 && step < 20)) return 0
  if (step < 8) return 0.4
  if (step < 16) return 0.85
  if (step < 28) return -0.7
  return -1
}

function solveLinear(matrix, rhs) {
  const n = rhs.length
  const a = matrix.map((row, i) => [...row, rhs[i]])
  for (let col = 0; col < n; col += 1) {
    let pivot = col
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row
    }
    if (Math.abs(a[pivot][col]) < 1e-10) return null
    ;[a[col], a[pivot]] = [a[pivot], a[col]]
    const div = a[col][col]
    for (let k = col; k <= n; k += 1) a[col][k] /= div
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue
      const factor = a[row][col]
      for (let k = col; k <= n; k += 1) a[row][k] -= factor * a[col][k]
    }
  }
  return a.map(row => row[n])
}

export function fitPairedEG01(records) {
  if (!records.some(row => row.orientation === 1) ||
      !records.some(row => row.orientation === -1)) return null
  const n = 4
  const lhs = Array.from({ length: n }, () => Array(n).fill(0))
  const rhs = Array(n).fill(0)
  for (const row of records) {
    // Observed predictors assume separately measured and correctly calibrated
    // current, temperature proxy and vibration proxy. Not a laboratory inference.
    const features = [row.orientation * row.current ** 2, row.thermal, row.deltaCurrent, row.current ** 2]
    for (let i = 0; i < n; i += 1) {
      rhs[i] += features[i] * row.force
      for (let j = 0; j < n; j += 1) lhs[i][j] += features[i] * features[j]
    }
  }
  const solution = solveLinear(lhs, rhs)
  if (!solution) return null
  const squared = records.reduce((sum, row) => {
    const features = [row.orientation * row.current ** 2, row.thermal, row.deltaCurrent, row.current ** 2]
    const predicted = features.reduce((acc, feature, i) => acc + feature * solution[i], 0)
    return sum + (row.force - predicted) ** 2
  }, 0)
  return {
    magnetic: solution[0],
    thermal: solution[1],
    vibration: solution[2],
    anomaly: solution[3],
    rmse: Math.sqrt(squared / records.length),
    assumptions: 'linear coefficients; calibrated proxy channels; paired fixture inversion',
  }
}

export function runEG01({ amplitude = 1, anomaly = 0, paired = true, noise = 0.003 } = {}) {
  if (![amplitude, anomaly, noise].every(Number.isFinite) ||
      amplitude < 0.25 || amplitude > 2 || Math.abs(anomaly) > 1 || noise < 0 || noise > 0.1)
    throw new RangeError('EG-01 parameter outside simulation bounds')
  const orientations = paired ? [1, -1] : [1]
  const records = []
  for (const orientation of orientations) {
    let thermal = 0
    let previousCurrent = 0
    for (let step = 0; step < EG01_ASSUMPTIONS.steps; step += 1) {
      const current = driveAt(step) * amplitude
      const i2 = current ** 2
      thermal = 0.82 * thermal + 0.18 * i2
      const deltaCurrent = current - previousCurrent
      previousCurrent = current
      const magneticForce = EG01_ASSUMPTIONS.magnetic * orientation * i2
      const thermalForce = EG01_ASSUMPTIONS.thermal * thermal
      const vibrationForce = EG01_ASSUMPTIONS.vibration * deltaCurrent
      const anomalyForce = anomaly * i2
      const noiseForce = noise * Math.sin((step + 1) * 17.1 + (orientation === 1 ? 0 : 4.7))
      records.push({
        step, orientation, current, thermal, deltaCurrent,
        magneticForce, thermalForce, vibrationForce, anomalyForce, noiseForce,
        force: magneticForce + thermalForce + vibrationForce + anomalyForce + noiseForce,
      })
    }
  }
  const estimate = fitPairedEG01(records)
  const first = records.filter(row => row.orientation === 1)
  // EXACT observational collision in the idealized one-orientation model:
  // beta*I² + alpha*I² = (beta+alpha)*I², even with thermal/vibration.
  const collisionMaxError = Math.max(...first.map(row => Math.abs(
    (row.magneticForce + row.anomalyForce) -
    ((EG01_ASSUMPTIONS.magnetic + anomaly) * row.current ** 2)
  )))
  return {
    schema: 'nbg.eg01.v1',
    provenance: 'SIMULATED',
    authority: 'NONE',
    claim: 'toy causal identifiability, not physical gravity modification',
    inputs: { amplitude, anomaly, paired, noise },
    constants: EG01_ASSUMPTIONS,
    records,
    estimate,
    collisionMaxError,
    identifiable: estimate !== null,
    scale: fieldEnergyScale(),
  }
}
