/**
 * BSR-1: Body-Ship Resonance, synthetic coupled-oscillator control.
 * These are dimensionless mathematical oscillators, NOT measured physiology.
 * Velocity Verlet integrates a conservative three-node spring chain.
 */
export const BSR_VERSION = 'BSR-1.0.0'
export const DEFAULT_BSR = Object.freeze({ coupling: 0.24, detuning: 0.16 })
const INITIAL_Q = [1, 0.15, -0.6]
const INITIAL_V = [0, 0.55, 0.2]

function acceleration(q, omega, coupling) {
  return q.map((position, i) => {
    const left = i > 0 ? position - q[i - 1] : 0
    const right = i < 2 ? position - q[i + 1] : 0
    return -(omega[i] ** 2) * position - coupling * (left + right)
  })
}

export function totalEnergy(q, v, omega, coupling) {
  const kinetic = v.reduce((sum, speed) => sum + speed * speed / 2, 0)
  const onSite = q.reduce((sum, position, i) => sum + (omega[i] * position) ** 2 / 2, 0)
  const links = coupling * ((q[0] - q[1]) ** 2 + (q[1] - q[2]) ** 2) / 2
  return kinetic + onSite + links
}

function bounded(value, fallback, min, max) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback
}

export function simulateBodyShip(options = {}) {
  const coupling = bounded(options.coupling, DEFAULT_BSR.coupling, 0, 1)
  const detuning = bounded(options.detuning, DEFAULT_BSR.detuning, 0, 0.5)
  const omega = [1 - detuning, 1, 1 + detuning]
  const dt = 0.01
  const steps = 1200
  const stride = 8
  const q = [...INITIAL_Q], v = [...INITIAL_V]
  let a = acceleration(q, omega, coupling)
  const initialEnergy = totalEnergy(q, v, omega, coupling)
  const samples = [], turns = []
  let maxRelativeEnergyDrift = 0

  for (let step = 0; step <= steps; step++) {
    const time = step * dt
    const energy = totalEnergy(q, v, omega, coupling)
    const relativeDrift = Math.abs(energy - initialEnergy) / initialEnergy
    maxRelativeEnergyDrift = Math.max(maxRelativeEnergyDrift, relativeDrift)
    if (step % stride === 0) {
      samples.push({ time, q: [...q], v: [...v], energy })
    }
    if (step === steps) break
    const previousVelocity = [...v]
    for (let i = 0; i < 3; i++) {
      v[i] += 0.5 * dt * a[i]
      q[i] += dt * v[i]
    }
    const nextAcceleration = acceleration(q, omega, coupling)
    for (let i = 0; i < 3; i++) {
      v[i] += 0.5 * dt * nextAcceleration[i]
      if (time > 0.05 && previousVelocity[i] * v[i] < 0) {
        turns.push({
          oscillator: i + 1,
          time: time + dt,
          displacement: q[i],
          velocity: v[i],
          totalSystemEnergy: totalEnergy(q, v, omega, coupling),
        })
      }
    }
    a = nextAcceleration
  }

  return {
    version: BSR_VERSION,
    provenance: 'SIMULATED',
    settings: { coupling, detuning, dt, duration: steps * dt, stride },
    omega, initialEnergy, finalEnergy: samples[samples.length - 1].energy,
    maxRelativeEnergyDrift, samples, turns,
  }
}

export function compareToNull(candidate, control) {
  if (candidate.samples.length !== control.samples.length ||
    candidate.samples.some((point, i) => point.time !== control.samples[i].time)) {
    throw new Error('Candidate and null control must share the same time grid.')
  }
  let sumSquares = 0, count = 0
  for (let i = 0; i < candidate.samples.length; i++) {
    for (let j = 0; j < 3; j++) {
      const delta = candidate.samples[i].q[j] - control.samples[i].q[j]
      sumSquares += delta * delta
      count++
    }
  }
  return Math.sqrt(sumSquares / count)
}

export function buildBodyShipReceipt(candidate, control, rotated) {
  return {
    protocol: BSR_VERSION,
    provenance: 'SIMULATED',
    scientificStatus: 'MATHEMATICAL_ILLUSTRATION_ONLY',
    hypothesis: 'Nearest-neighbor coupling changes trajectories relative to an uncoupled null.',
    parameters: candidate.settings,
    oscillatorAngularFrequencies: candidate.omega,
    controls: { coupling: 0, sameInitialConditions: true, sameTimeGrid: true },
    outcomes: {
      rmsDisplacementDifferenceFromNull: compareToNull(candidate, control),
      candidateMaxRelativeEnergyDrift: candidate.maxRelativeEnergyDrift,
      nullMaxRelativeEnergyDrift: control.maxRelativeEnergyDrift,
      candidateTurningPointCount: candidate.turns.length,
      minimumRecordedSystemEnergyAtTurningPoint: candidate.turns.length
        ? Math.min(...candidate.turns.map(turn => turn.totalSystemEnergy))
        : null,
    },
    presentation: { rotated90Degrees: Boolean(rotated), altersPhysics: false },
    exclusions: [
      'No measured heart, respiration or neural data',
      'No evidence of energy leaving spacetime',
      'No historical symbol is treated as a physical measurement',
    ],
  }
}
